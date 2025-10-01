// server/services/wallet.service.js
"use strict";

const { WalletEntry, PlatformEntry } = require("../models");
const tronService = require("./tron.service");

// ─── Helpers: 6-decimal math to match DECIMAL(18,6) ───────────────────────────
const DEC = 6;
const SCALE = 10 ** DEC;
function toFixed6(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) throw new Error("Invalid amount");
  return Number((Math.round(x * SCALE) / SCALE).toFixed(DEC));
}

// ─── Balances ─────────────────────────────────────────────────────────────────
async function getUserBalanceUSDT(userId) {
  const entry = await WalletEntry.findOne({
    where: { user_id: userId },
    order: [["created_at", "DESC"]],
  });
  return entry ? Number(entry.balance_after_usdt) : 0;
}

async function getPlatformBalanceUSDT() {
  const entry = await PlatformEntry.findOne({
    order: [["created_at", "DESC"]],
  });
  return entry ? Number(entry.balance_after_usdt) : 0;
}

// ─── Hot wallet real-time (blockchain) ────────────────────────────────────────
async function getHotWalletBalance() {
  try {
    const hotWalletAddress = process.env.TRON_HOT_ADDRESS;
    if (!hotWalletAddress) {
      return {
        usdt: 0,
        trx: 0,
        address: "Not configured in environment variables",
        error: "TRON_HOT_ADDRESS not set",
      };
    }
    if (!tronService.isValidAddress(hotWalletAddress)) {
      return {
        usdt: 0,
        trx: 0,
        address: hotWalletAddress,
        error: "Invalid Tron address format",
      };
    }

    const balances = await tronService.getWalletBalances(hotWalletAddress);
    return {
      usdt: balances.usdt,
      trx: balances.trx,
      address: hotWalletAddress,
      timestamp: balances.timestamp,
      error: balances.error,
    };
  } catch (error) {
    console.error("Error in getHotWalletBalance:", error.message);
    return {
      usdt: 0,
      trx: 0,
      address: process.env.TRON_HOT_ADDRESS || "Error fetching",
      error: error.message,
    };
  }
}

// ─── User ledger helpers ──────────────────────────────────────────────────────
async function creditUser(userId, amount, type, refType, refId, transaction) {
  const bal = await getUserBalanceUSDT(userId);
  const amt = toFixed6(amount);
  if (amt <= 0) throw new Error("Amount must be positive");
  const newBal = toFixed6(bal + amt);
  await WalletEntry.create(
    {
      user_id: userId,
      delta_usdt: amt,
      balance_after_usdt: newBal,
      type,
      ref_type: refType,
      ref_id: refId,
    },
    { transaction }
  );
  return newBal;
}

async function debitUser(userId, amount, type, refType, refId, transaction) {
  const bal = await getUserBalanceUSDT(userId);
  const amt = toFixed6(amount);
  if (amt <= 0) throw new Error("Amount must be positive");
  if (bal < amt) throw new Error("Insufficient balance");
  const newBal = toFixed6(bal - amt);
  await WalletEntry.create(
    {
      user_id: userId,
      delta_usdt: -amt,
      balance_after_usdt: newBal,
      type,
      ref_type: refType,
      ref_id: refId,
    },
    { transaction }
  );
  return newBal;
}

// ─── Platform ledger helpers ──────────────────────────────────────────────────
async function creditPlatform(amount, type, refType, refId, transaction) {
  const latest = await PlatformEntry.findOne({ order: [["created_at", "DESC"]] });
  const bal = latest ? Number(latest.balance_after_usdt) : 0;
  const amt = toFixed6(amount);
  if (amt <= 0) throw new Error("Amount must be positive");
  const newBal = toFixed6(bal + amt);
  await PlatformEntry.create(
    {
      delta_usdt: amt,
      balance_after_usdt: newBal,
      type,
      ref_type: refType,
      ref_id: refId,
    },
    { transaction }
  );
  return newBal;
}

async function debitPlatform(amount, type, refType, refId, transaction) {
  const latest = await PlatformEntry.findOne({ order: [["created_at", "DESC"]] });
  const bal = latest ? Number(latest.balance_after_usdt) : 0;
  const amt = toFixed6(amount);
  if (amt <= 0) throw new Error("Amount must be positive");
  if (bal < amt) throw new Error("Platform insufficient balance");
  const newBal = toFixed6(bal - amt);
  await PlatformEntry.create(
    {
      delta_usdt: -amt,
      balance_after_usdt: newBal,
      type,
      ref_type: refType,
      ref_id: refId,
    },
    { transaction }
  );
  return newBal;
}

module.exports = {
  // balances
  getUserBalanceUSDT,
  getPlatformBalanceUSDT,
  getHotWalletBalance,
  // user/platform mutations
  creditUser,
  debitUser,
  creditPlatform,
  debitPlatform,
};
