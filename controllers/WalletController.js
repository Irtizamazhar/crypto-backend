"use strict";
const TronWeb = require('tronweb');
const { UserAddress, Deposit, sequelize } = require('../models');
const { debitUser, creditPlatform, getUserBalanceUSDT } = require('../services/wallet.service');
const { calcInvestFee } = require('../services/fees');
require('dotenv').config();

// Initialize TronWeb for public API access using the function format.
const tron = new TronWeb({
  fullHost: process.env.TRON_FULLHOST,
  headers: { 'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY || '' },
  // Optionally add these configurations if needed:
  // privateKey: "your-private-key",
});

const USDT = process.env.USDT_TRON_CONTRACT;
const DEC = Number(process.env.USDT_TRON_DECIMALS || 6);

module.exports = {
  async getTrc20Wallet(req, res) {
    try {
      const ua = await UserAddress.findOne({
        where: { user_id: req.user.id, network: 'TRC20' },
      });

      if (!ua) {
        return res.status(404).json({
          message: 'No TRC20 address found for this user',
          address: null,
          trx: 0,
          usdt: 0,
        });
      }

      let trx = 0;
      let usdt = 0;
      let error = null;

      try {
        // Fetch TRX balance (in SUN, convert to TRX)
        const sun = await tron.trx.getBalance(ua.address);
        trx = sun / 1e6;

        // Fetch TRC20 USDT balance if contract address is configured
        if (USDT) {
          const c = await tron.contract().at(USDT);
          const units = await c.balanceOf(ua.address).call();
          usdt = Number(units) / 10 ** DEC;
        }
      } catch (e) {
        // Log error but don't fail the request
        console.error('Error fetching blockchain data:', e);
        error = e.message;
      }

      return res.json({
        network: 'TRC20',
        address: ua.address,
        trx,
        usdt,
        error,
        minConfirmations: Number(process.env.TRON_MIN_CONFIRMATIONS || 20),
      });
    } catch (e) {
      console.error('Error in getTrc20Wallet:', e);
      return res.status(500).json({
        message: 'Failed to retrieve wallet information',
        error: e.message,
      });
    }
  },

  async listDeposits(req, res) {
    try {
      const rows = await Deposit.findAll({
        where: { user_id: req.user.id },
        order: [['id', 'DESC']],
        limit: 200,
      });
      return res.json(rows);
    } catch (e) {
      console.error('Error in listDeposits:', e);
      return res.status(500).json({ message: 'Failed to retrieve deposits' });
    }
  },

  async getBalance(req, res) {
    try {
      const usdt = await getUserBalanceUSDT(req.user.id);
      return res.json({ usdt });
    } catch (e) {
      console.error('Error in getBalance:', e);
      return res.status(500).json({ message: 'Failed to retrieve balance' });
    }
  },

  async purchase(req, res) {
    try {
      const amount = Number(req.body?.amount_usdt);
      const itemCode = String(req.body?.item_code || 'plan');

      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
      }

      const fee = calcInvestFee(amount);

      await sequelize.transaction(async (t) => {
        // Debit user for the full amount
        await debitUser(req.user.id, amount, 'purchase', 'purchase', null, t);
        // Credit the platform with fee only
        if (fee > 0) {
          await creditPlatform(fee, 'invest_fee', 'purchase', null, t);
        }
      });

      return res.json({
        ok: true,
        charged_usdt: amount,
        fee_usdt: fee,
        item_code: itemCode,
      });
    } catch (e) {
      console.error('Error in purchase:', e);
      return res.status(500).json({
        message: e.message || 'Purchase failed',
      });
    }
  },
};
