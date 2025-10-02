// server/controllers/PaymentsController.js
"use strict";
const { v4: uuidv4 } = require("uuid");
const { Payment, User } = require("../models");
const tronService = require("../services/tron.service");

const PRICE_USDT = parseFloat(process.env.PRO_PRICE_USDT || "9.99");
const HOT_WALLET = process.env.TRON_HOT_ADDRESS;
const USDT = process.env.USDT_TRON_CONTRACT;

function hexTopic(s) {
  return s.startsWith("0x") ? s : "0x" + s;
}

module.exports = {
  async create(req, res) {
    if (!HOT_WALLET) return res.status(500).json({ message: "TRON_HOT_ADDRESS not configured" });
    const id = uuidv4().replace(/-/g, "");
    const row = await Payment.create({
      id,
      userId: req.user.id,
      plan: "pro",
      amount: PRICE_USDT,
      toAddress: HOT_WALLET,
      status: "pending",
    });
    res.json({ id: row.id, toAddress: row.toAddress, amount: parseFloat(row.amount) });
  },

  async confirm(req, res) {
    try {
      const id = String(req.params.id || "");
      const txid = String(req.body?.txid || "");
      if (!txid) return res.status(400).json({ message: "Missing txid" });
      const row = await Payment.findOne({ where: { id, userId: req.user.id } });
      if (!row) return res.status(404).json({ message: "Order not found" });
      if (row.status === "paid") return res.json({ ok: true });

      const tronWeb = tronService.tronWeb;
      if (!tronWeb) return res.status(500).json({ message: "Tron service not initialized" });

      // fetch tx receipt (contains logs)
      const info = await tronWeb.trx.getTransactionInfo(txid);
      if (!info || !info.id) return res.status(400).json({ message: "Transaction not found on TRON" });
      const logs = info.log || [];

      // TRC20 Transfer(address,address,uint256) topic
      const TRANSFER_TOPIC = hexTopic("ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef");

      const ok = logs.some((log) => {
        try {
          // check contract address == USDT
          const contractBase58 = tronWeb.address.fromHex(log.address);
          if (contractBase58 !== USDT) return false;

          if (!log.topics || log.topics[0] !== TRANSFER_TOPIC) return false;

          // topic[2] -> 'to' address (last 20 bytes). Convert to base58: prefix 41 (hex) then base58.
          const toHex = log.topics[2]; // 0x...
          const toAddr = tronWeb.address.fromHex("41" + toHex.slice(-40));
          if (toAddr !== HOT_WALLET) return false;

          // data is uint256 amount
          const hex = (log.data || "").replace(/^0x/i, "");
          const amountWei = BigInt("0x" + hex);
          const amount = Number(amountWei) / 1e6; // USDT 6 decimals
          return amount + 1e-6 >= parseFloat(row.amount);
        } catch {
          return false;
        }
      });

      if (!ok) return res.status(400).json({ message: "Tx does not match a USDT transfer to our hot wallet with sufficient amount" });

      // mark paid, set txid, upgrade user
      row.txid = txid;
      row.status = "paid";
      await row.save();

      const user = await User.findByPk(req.user.id);
      user.plan = "pro";
      await user.save();

      return res.json({ ok: true });
    } catch (e) {
      console.error("Payment confirm error:", e);
      return res.status(400).json({ message: e.message || "Failed to verify tx" });
    }
  },
};
