"use strict";

/**
 * AdminTreasuryController
 *
 * This controller handles admin‐initiated withdrawals from the
 * platform's hot wallet to an external TRC20 address. Only admins
 * should have access to these endpoints. All user facing
 * withdrawals are handled via the WithdrawalsController.
 */

const { sequelize } = require("../models");
const {
  debitPlatform,
  getPlatformBalanceUSDT,
} = require("../services/wallet.service");
const { derivePkByIndex, makeTron } = require("../services/tronHd");

require("dotenv").config();

// Pull configuration from environment variables with sane defaults.
const USDT = process.env.USDT_TRON_CONTRACT;
const DEC = Number(process.env.USDT_TRON_DECIMALS || 6);
const HOT_INDEX = Number(process.env.TRON_HOT_INDEX || 0);

/**
 * Helper to send TRC20 USDT on the Tron network.
 *
 * @param {string} pk Private key of the sending account
 * @param {string} to Destination TRC20 address
 * @param {number} amountUsdt Amount in whole USDT units
 */
async function sendUsdt(pk, to, amountUsdt) {
  const tron = makeTron(pk);
  const c = await tron.contract().at(USDT);
  const units = Math.round(Number(amountUsdt) * 10 ** DEC);
  return await c.transfer(to, units).send();
}

module.exports = {
  /**
   * Admin withdrawal endpoint.
   *
   * POST /admin/treasury/withdraw
   *
   * Body: { to_address: string, amount_usdt: number }
   */
  async withdraw(req, res) {
    const to = String(req.body?.to_address || "");
    const amount = Number(req.body?.amount_usdt);
    if (!to || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid request" });
    }
    // Ensure the platform has sufficient balance before initiating the transfer.
    try {
      await sequelize.transaction(async (t) => {
        await debitPlatform(amount, "sweep_out", "admin", null, t);
      });
      const pk = await derivePkByIndex(HOT_INDEX);
      const txid = await sendUsdt(pk, to, amount);
      const newBal = await getPlatformBalanceUSDT();
      return res.json({ ok: true, txid, new_platform_balance: newBal });
    } catch (err) {
      // If anything fails, respond with a generic error.
      console.error(err);
      return res.status(500).json({ message: err.message || "Withdrawal failed" });
    }
  },
};