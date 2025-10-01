"use strict";
const { Withdrawal, sequelize } = require("../models");
const { calcWithdrawFee } = require("../services/fees");
const { debitUser, creditPlatform } = require("../services/wallet.service");
const { queueBroadcast } = require("../workers/withdrawQueue");

module.exports = {
  /**
   * Create a new TRC20 withdrawal request. The user's USDT
   * balance is not deducted until an admin approves the request
   * (see approve below). Fees are calculated up front and
   * returned to the client so they can display the net amount.
   */
  async create(req, res) {
    const amount = Number(req.body?.amount_usdt);
    const to = String(req.body?.to_address || "");
    if (!to || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid" });
    }
    const { fee, net } = calcWithdrawFee(amount);
    const w = await Withdrawal.create({
      user_id: req.user.id,
      network: "TRC20",
      to_address: to,
      amount_usdt: amount,
      fee_usdt: fee,
      status: "pending",
    });
    return res.json({ ok: true, id: w.id, fee_usdt: fee, net_usdt: net });
  },

  /**
   * Approve a pending withdrawal. Deduct the full amount from the
   * user's internal USDT balance, credit the platform with the fee
   * portion, mark the withdrawal as approved and queue a broadcast
   * job which sends the net amount on-chain via the hot wallet.
   */
  async approve(req, res) {
    const w = await Withdrawal.findByPk(req.params.id);
    if (!w || w.status !== "pending") {
      return res.status(404).json({ message: "Not found" });
    }
    const { fee, net } = calcWithdrawFee(Number(w.amount_usdt));
    try {
      await sequelize.transaction(async (t) => {
        await debitUser(w.user_id, w.amount_usdt, "withdraw", "withdrawals", w.id, t);
        await creditPlatform(fee, "fee", "withdrawals", w.id, t);
        await w.update({ fee_usdt: fee, status: "approved" }, { transaction: t });
      });
      await queueBroadcast({ withdrawalId: w.id, netAmount: net, toAddress: w.to_address });
      return res.json({ ok: true, net_usdt: net, fee_usdt: fee });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: e.message || "Approval failed" });
    }
  },
};