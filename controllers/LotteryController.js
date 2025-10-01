"use strict";
const { User, UserAddress, LotteryRound, LotteryEntry, Sequelize, sequelize } = require("../models");
const { Op } = Sequelize;

const { debitUser, creditPlatform, debitPlatform, getUserBalanceUSDT } = require("../services/wallet.service");
const tronService = require("../services/tron.service");

const DURATION_MS = { 1: 12 * 60 * 60 * 1000, 5: 4 * 60 * 60 * 1000, 10: 2 * 60 * 60 * 1000 };
const TIERS = [1, 5, 10];
const normTier = (raw) => (TIERS.includes(Number(raw)) ? Number(raw) : 1);

async function createRound(entryUsd) {
  return LotteryRound.create({
    entryUsd,
    resolvesAt: new Date(Date.now() + DURATION_MS[entryUsd]),
    resolved: false,
    payout: 0,
    payout_status: "pending",
  });
}

async function getOrCreateOpenRound(entryUsd) {
  const now = new Date();
  let round = await LotteryRound.findOne({
    where: { resolved: false, entryUsd, resolvesAt: { [Op.gt]: now } },
    order: [["id", "DESC"]],
  });
  if (!round) round = await createRound(entryUsd);
  return round;
}

async function resolveIfExpired(round) {
  const now = Date.now();
  if (!round || round.resolved) return null;
  if (new Date(round.resolvesAt).getTime() > now) return null;

  const reload = await LotteryRound.findByPk(round.id, {
    include: [{ model: LotteryEntry, as: "entries" }],
  });

  const entries = reload.entries || [];
  let winnerUserId = null;
  if (entries.length > 0) {
    const idx = Math.floor(Math.random() * entries.length);
    winnerUserId = entries[idx].userId;
  }

  reload.resolved = true;
  reload.winnerUserId = winnerUserId;
  reload.payout = entries.length * reload.entryUsd;
  await reload.save();
  return reload;
}

exports.current = async (req, res) => {
  const entryUsd = normTier(req.query.tier);
  const userId = req.user?.id;

  const latest = await LotteryRound.findOne({ where: { entryUsd }, order: [["id", "DESC"]] });
  if (latest) await resolveIfExpired(latest);
  const round = await getOrCreateOpenRound(entryUsd);

  let usdt = 0;
  if (userId) {
    try { usdt = await getUserBalanceUSDT(userId); } catch {}
  }

  const withEntries = await LotteryRound.findByPk(round.id, {
    include: [
      { model: LotteryEntry, as: "entries", include: [{ model: User, as: "user", attributes: ["id", "name", "email", "avatar"] }] }
    ],
  });

  const entries = withEntries.entries || [];
  const pool = entries.length * entryUsd;
  return res.json({ round: withEntries, entries, pool, usdt, entryUsd });
};

exports.join = async (req, res) => {
  const userId = req.user.id;
  const entryUsd = normTier(req.body?.tier ?? req.query?.tier);

  const usdtBal = await getUserBalanceUSDT(userId);
  if (usdtBal < entryUsd) {
    return res.status(400).json({ message: `Insufficient balance ($${entryUsd} required)` });
  }

  const latest = await LotteryRound.findOne({ where: { entryUsd }, order: [["id", "DESC"]] });
  if (latest) await resolveIfExpired(latest);
  const round = await getOrCreateOpenRound(entryUsd);

  const existing = await LotteryEntry.findOne({ where: { roundId: round.id, userId } });
  if (existing) return res.status(400).json({ message: "Already joined this round" });

  await sequelize.transaction(async (t) => {
    // debit user (internal)
    await debitUser(userId, entryUsd, "lottery_entry", "lottery", { roundId: round.id, entryUsd }, t);
    // credit platform to hold pooled funds
    await creditPlatform(entryUsd, "lottery_entry", "lottery", round.id, t);
    await LotteryEntry.create({ roundId: round.id, userId }, { transaction: t });
  });

  const updated = await LotteryRound.findByPk(round.id, {
    include: [{ model: LotteryEntry, as: "entries" }],
  });

  const usdt = await getUserBalanceUSDT(userId);
  return res.json({
    ok: true,
    round: updated,
    pool: (updated.entries || []).length * entryUsd,
    usdt,
    entryUsd,
  });
};

exports.listRounds = async (req, res) => {
  const resolved = String(req.query.resolved || "").trim().toLowerCase();
  const tier = req.query.tier ? normTier(req.query.tier) : undefined;

  const where = {};
  if (resolved === "1" || resolved === "true") where.resolved = true;
  if (tier) where.entryUsd = tier;

  const rounds = await LotteryRound.findAll({
    where,
    include: [
      { model: LotteryEntry, as: "entries", include: [{ model: User, as: "user", attributes: ["id", "name", "email", "avatar"] }] },
      { model: User, as: "winner", attributes: ["id", "name", "email", "avatar"] },
    ],
    order: [["id", "DESC"]],
    limit: Math.min(200, Number(req.query.limit || 50)),
  });

  res.json({ rounds });
};

exports.roundParticipants = async (req, res) => {
  const id = Number(req.params.id);
  const round = await LotteryRound.findByPk(id, {
    include: [
      { model: LotteryEntry, as: "entries", include: [{ model: User, as: "user", attributes: ["id", "name", "email", "avatar"] }] },
    ],
  });
  if (!round) return res.status(404).json({ message: "Round not found" });
  res.json({ round, entries: round.entries || [] });
};

exports.adminPickWinner = async (req, res) => {
  const roundId = Number(req.params.id);
  const { winnerUserId } = req.body;
  if (!winnerUserId) return res.status(400).json({ message: "winnerUserId required" });

  const round = await LotteryRound.findByPk(roundId, { include: [{ model: LotteryEntry, as: "entries" }] });
  if (!round) return res.status(404).json({ message: "Round not found" });
  if (round.resolved) return res.status(400).json({ message: "Round already resolved" });

  const entries = round.entries || [];
  if (entries.length === 0) return res.status(400).json({ message: "No entries in this round" });

  const validWinner = entries.find((e) => e.userId === Number(winnerUserId));
  if (!validWinner) return res.status(400).json({ message: "Winner must be a participant" });

  const payout = entries.length * round.entryUsd;

  round.resolved = true;
  round.winnerUserId = Number(winnerUserId);
  round.payout = payout;
  round.payout_status = "pending";
  await round.save();

  return res.json({ ok: true, roundId: round.id, winnerUserId: Number(winnerUserId), payout });
};

// NEW: pay the winner from hot wallet (TRC20 USDT) and debit platform ledger
exports.adminPayWinner = async (req, res) => {
  const roundId = Number(req.params.id);
  const { overrideAmount } = req.body || {};

  const round = await LotteryRound.findByPk(roundId, {
    include: [{ model: User, as: "winner", attributes: ["id", "name", "email"] }],
  });
  if (!round) return res.status(404).json({ message: "Round not found" });
  if (!round.resolved || !round.winnerUserId) {
    return res.status(400).json({ message: "Pick a winner first" });
  }
  if (round.payout_status && ["broadcast", "confirmed"].includes(round.payout_status)) {
    return res.status(400).json({ message: "Already paid or in progress" });
  }

  const amount = Number(overrideAmount || round.payout || 0);
  if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid payout amount" });

  // winner address
  const ua = await UserAddress.findOne({ where: { user_id: round.winnerUserId, network: "TRC20" } });
  if (!ua) return res.status(400).json({ message: "Winner has no TRC20 address" });

  // Book the debit on platform ledger first
  await sequelize.transaction(async (t) => {
    await debitPlatform(amount, "lottery_payout", "lottery", round.id, t);
    round.payout_status = "broadcast";
    round.adminNote = `Payout initiated to ${ua.address}`;
    await round.save({ transaction: t });
  });

  try {
    const txid = await tronService.transferUSDT(ua.address, amount);
    round.payout_txid = txid;
    round.paidAt = new Date();
    round.payout_status = "confirmed"; // optionally poll for finality elsewhere
    await round.save();

    return res.json({ ok: true, roundId, amount, to: ua.address, txid, status: round.payout_status });
  } catch (e) {
    round.payout_status = "failed";
    round.adminNote = `Transfer failed: ${e.message}`;
    await round.save();
    return res.status(500).json({ message: `Transfer failed: ${e.message}` });
  }
};
