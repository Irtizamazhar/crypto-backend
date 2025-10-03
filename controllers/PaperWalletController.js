"use strict";

const { User, Rain, RainGrab, sequelize } = require("../models");

/** Level thresholds by tap count */
const LEVEL_THRESHOLDS = [50000, 100000, 150000];

function levelFromTapCount(taps) {
  let lvl = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (taps >= LEVEL_THRESHOLDS[i]) lvl = i + 1;
    else break;
  }
  return lvl;
}

function dailyRewardFromStreak(streak) {
  return Math.min(3, 1 + Math.floor(streak / 3));
}
function midnightUTC(date) {
  const d = new Date(date);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

exports.wallet = async (req, res) => {
  return res.json({
    paper: Number(req.user.paper || 0),
    fiatUsd: Number(req.user.fiatUsd || 0),
    streak: Number(req.user.paperStreak || 0),
    lastClaimAt: req.user.paperLastClaimAt || null,
    tapCount: Number(req.user.tapCount || 0),
    userLevel: Number(req.user.userLevel || 0),
  });
};

exports.claimDaily = async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const now = new Date();
  const todayUTC = midnightUTC(now);
  const last = user.paperLastClaimAt ? new Date(user.paperLastClaimAt) : null;
  const lastUTC = last ? midnightUTC(last) : null;

  if (lastUTC === todayUTC) {
    return res.status(400).json({ message: "Already claimed today" });
  }

  if (last && todayUTC - lastUTC > 24 * 3600 * 1000) {
    user.paperStreak = 0;
  }

  user.paperStreak += 1;
  const reward = dailyRewardFromStreak(user.paperStreak); // whole PAPER
  user.paper = Number(user.paper || 0) + Number(reward);
  user.paperLastClaimAt = now;

  const history = Array.isArray(user.paperHistory) ? user.paperHistory : [];
  history.unshift({
    type: "daily",
    amount: Number(reward),
    note: `Daily reward (streak ${user.paperStreak})`,
    createdAt: now,
  });
  user.paperHistory = history.slice(0, 500);

  await user.save();

  return res.json({
    paper: Number(user.paper),
    streak: user.paperStreak,
    reward: Number(reward),
    lastClaimAt: user.paperLastClaimAt,
  });
};

/** Earn arbitrary paper (decimal OK) */
exports.earn = async (req, res) => {
  const { type = "manual", amount, note = "" } = req.body || {};
  const amt = Number(amount || 0);
  if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ message: "Invalid amount" });

  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.paper = Number(user.paper || 0) + amt;

  const history = Array.isArray(user.paperHistory) ? user.paperHistory : [];
  history.unshift({ type, amount: amt, note, createdAt: new Date() });
  user.paperHistory = history.slice(0, 500);

  await user.save();

  return res.json({ paper: Number(user.paper) });
};

/** Single tap — default +0.01 PAPER (kept for compatibility) */
exports.tap = async (req, res) => {
  const { paperAmount = 0.01 } = req.body || {};
  const inc = Number(paperAmount || 0);

  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.tapCount = Number(user.tapCount || 0) + 1;

  const newLevel = levelFromTapCount(user.tapCount);
  if (newLevel !== user.userLevel) {
    user.userLevel = newLevel;
    const paperHist = Array.isArray(user.paperHistory) ? user.paperHistory : [];
    paperHist.unshift({ type: "level", amount: 0, note: `Level up → ${newLevel}`, createdAt: new Date() });
    user.paperHistory = paperHist.slice(0, 500);
  }

  if (inc > 0) {
    user.paper = Number(user.paper || 0) + inc;
    const hist = Array.isArray(user.paperHistory) ? user.paperHistory : [];
    hist.unshift({ type: "tap", amount: inc, note: `Tap +${inc}`, createdAt: new Date() });
    user.paperHistory = hist.slice(0, 500);
  }

  await user.save();
  return res.json({ tapCount: Number(user.tapCount), userLevel: Number(user.userLevel), paper: Number(user.paper) });
};

/** Batch taps — increments tapCount and credits exact decimal PAPER */
exports.tapBatch = async (req, res) => {
  const { count = 0, amount = 0 } = req.body || {};
  const taps = Math.max(0, Math.floor(Number(count || 0)));
  const amt = Number(amount || 0);
  if (taps <= 0 || !Number.isFinite(amt) || amt < 0) {
    return res.status(400).json({ message: "Invalid batch" });
  }

  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.tapCount = Number(user.tapCount || 0) + taps;

  const newLevel = levelFromTapCount(user.tapCount);
  if (newLevel !== user.userLevel) {
    user.userLevel = newLevel;
    const paperHistL = Array.isArray(user.paperHistory) ? user.paperHistory : [];
    paperHistL.unshift({ type: "level", amount: 0, note: `Level up → ${newLevel}`, createdAt: new Date() });
    user.paperHistory = paperHistL.slice(0, 500);
  }

  if (amt > 0) {
    user.paper = Number(user.paper || 0) + amt;
    const hist = Array.isArray(user.paperHistory) ? user.paperHistory : [];
    hist.unshift({ type: "tap_batch", amount: amt, note: `Batch taps +${taps}`, createdAt: new Date() });
    user.paperHistory = hist.slice(0, 500);
  }

  await user.save();
  return res.json({ tapCount: Number(user.tapCount), userLevel: Number(user.userLevel), paper: Number(user.paper) });
};

/** Prize rain helpers */
async function getActiveRainRow(t) {
  return await Rain.findOne({
    where: { isActive: true },
    order: [["id", "DESC"]],
    transaction: t,
  });
}

exports.getRain = async (_req, res) => {
  const r = await getActiveRainRow();
  if (!r || (r.endsAt && new Date(r.endsAt).getTime() < Date.now())) {
    return res.json({ active: false });
  }
  return res.json({
    active: true,
    endsAt: r.endsAt,
    amountPerGrab: Number(r.amountPerGrab),
    totalDrops: r.totalDrops,
    claimedDrops: r.claimedDrops,
    rainId: r.id,
  });
};

exports.grabRain = async (req, res) => {
  const uid = req.user.id;

  return await sequelize.transaction(async (t) => {
    const rain = await getActiveRainRow(t);
    if (!rain || (rain.endsAt && new Date(rain.endsAt).getTime() < Date.now()) || !rain.isActive) {
      return res.status(400).json({ message: "No active rain" });
    }

    const exists = await RainGrab.findOne({ where: { rainId: rain.id, userId: uid }, transaction: t });
    if (exists) return res.status(400).json({ message: "Already grabbed" });

    if (rain.claimedDrops >= rain.totalDrops) {
      return res.status(400).json({ message: "All gifts grabbed" });
    }

    // Credit user
    const user = await User.findByPk(uid, { transaction: t, lock: t.LOCK.UPDATE });
    user.paper = Number(user.paper || 0) + Number(rain.amountPerGrab);
    const hist = Array.isArray(user.paperHistory) ? user.paperHistory : [];
    hist.unshift({ type: "rain", amount: Number(rain.amountPerGrab), note: `Prize rain`, createdAt: new Date() });
    user.paperHistory = hist.slice(0, 500);
    await user.save({ transaction: t });

    // Record grab + increment
    await RainGrab.create({ rainId: rain.id, userId: uid, amount: rain.amountPerGrab }, { transaction: t });
    rain.claimedDrops += 1;
    await rain.save({ transaction: t });

    return res.json({ ok: true, amount: Number(rain.amountPerGrab), total: Number(user.paper) });
  });
};

/** Admin: start/stop rain */
exports.adminStartRain = async (req, res) => {
  const { amountPerGrab = 0.1, totalDrops = 100, durationSec = 60 } = req.body || {};
  const amt = Number(amountPerGrab);
  const drops = Math.max(1, Math.floor(Number(totalDrops || 0)));
  const dur = Math.max(5, Math.floor(Number(durationSec || 0)));

  if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ message: "Invalid amountPerGrab" });

  const endsAt = new Date(Date.now() + dur * 1000);

  // close previous, start fresh
  await sequelize.transaction(async (t) => {
    await Rain.update({ isActive: false }, { where: { isActive: true }, transaction: t });
    await Rain.create({ isActive: true, endsAt, amountPerGrab: amt, totalDrops: drops, claimedDrops: 0 }, { transaction: t });
  });

  res.json({ ok: true, endsAt, amountPerGrab: amt, totalDrops: drops });
};

exports.adminStopRain = async (_req, res) => {
  await Rain.update({ isActive: false }, { where: { isActive: true } });
  res.json({ ok: true });
};

exports.history = async (req, res) => {
  const page  = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

  const user = await User.findByPk(req.user.id, { attributes: ["paperHistory"] });
  if (!user) return res.status(404).json({ message: "User not found" });

  const list = Array.isArray(user.paperHistory) ? user.paperHistory : [];
  const start = (page - 1) * limit;
  const items = list.slice(start, start + limit);

  return res.json({ items, page, limit, total: list.length });
};

/** 🔵 One-time Welcome Lucky Wheel spin */
exports.spin = async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.hasSpun) return res.status(400).json({ message: "Spin already used" });

  // Weighted rewards: 50% +5, 30% +10, 15% +20, 5% +50
  const r = Math.random();
  let reward = 5;
  if (r < 0.05) reward = 50;
  else if (r < 0.20) reward = 20;
  else if (r < 0.50) reward = 10;

  user.hasSpun = true;
  user.paper = Number(user.paper || 0) + Number(reward);
  const hist = Array.isArray(user.paperHistory) ? user.paperHistory : [];
  hist.unshift({ type: "spin", amount: Number(reward), note: "Welcome wheel", createdAt: new Date() });
  user.paperHistory = hist.slice(0, 500);
  await user.save();

  return res.json({ ok: true, reward: Number(reward), paper: Number(user.paper) });
};
