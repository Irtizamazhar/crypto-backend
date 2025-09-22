const { User } = require("../models");

/** Level thresholds by tap count:
 * 0 → level 0
 * 50,000 → level 1
 * 100,000 → level 2
 * 150,000 → level 3
 * add more if you like
 */
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
  // 1 → 1 PAPER, every 3 days +1 extra, max 3
  return Math.min(3, 1 + Math.floor(streak / 3));
}
function midnightUTC(date) {
  const d = new Date(date);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

exports.wallet = async (req, res) => {
  return res.json({
    paper: req.user.paper || 0,
    fiatUsd: Number(req.user.fiatUsd || 0),
    streak: req.user.paperStreak || 0,
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

  // reset streak if skipped a day
  if (last && todayUTC - lastUTC > 24 * 3600 * 1000) {
    user.paperStreak = 0;
  }

  user.paperStreak += 1;
  const reward = dailyRewardFromStreak(user.paperStreak);
  user.paper = (user.paper || 0) + reward;
  user.paperLastClaimAt = now;

  const history = Array.isArray(user.paperHistory) ? user.paperHistory : [];
  history.unshift({
    type: "daily",
    amount: reward,
    note: `Daily reward (streak ${user.paperStreak})`,
    createdAt: now
  });
  user.paperHistory = history.slice(0, 500);

  await user.save();

  return res.json({
    paper: user.paper,
    streak: user.paperStreak,
    reward,
    lastClaimAt: user.paperLastClaimAt
  });
};

/**
 * Earn arbitrary paper (admin or server-side actions):
 * body: { amount: number, type?: string, note?: string }
 */
exports.earn = async (req, res) => {
  const { type = "manual", amount, note = "" } = req.body || {};
  const amt = Number(amount || 0);
  if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ message: "Invalid amount" });

  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.paper = (user.paper || 0) + amt;
  const history = Array.isArray(user.paperHistory) ? user.paperHistory : [];
  history.unshift({ type, amount: amt, note, createdAt: new Date() });
  user.paperHistory = history.slice(0, 500);
  await user.save();

  return res.json({ paper: user.paper });
};

/**
 * Tap endpoint (1 tap = +1 tapCount).
 * Optionally credit paper on tap: body: { paperAmount?: number }
 */
exports.tap = async (req, res) => {
  const { paperAmount = 0 } = req.body || {};
  const inc = Number.isFinite(Number(paperAmount)) ? Number(paperAmount) : 0;

  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.tapCount = Number(user.tapCount || 0) + 1;

  // Level up if needed
  const newLevel = levelFromTapCount(user.tapCount);
  if (newLevel !== user.userLevel) {
    user.userLevel = newLevel;
    const paperHist = Array.isArray(user.paperHistory) ? user.paperHistory : [];
    paperHist.unshift({ type: "level", amount: 0, note: `Level up → ${newLevel}`, createdAt: new Date() });
    user.paperHistory = paperHist.slice(0, 500);
  }

  // Optional paper credit per tap
  if (inc > 0) {
    user.paper = (user.paper || 0) + Math.floor(inc);
    const hist = Array.isArray(user.paperHistory) ? user.paperHistory : [];
    hist.unshift({ type: "tap", amount: Math.floor(inc), note: `Tap +${inc}`, createdAt: new Date() });
    user.paperHistory = hist.slice(0, 500);
  }

  await user.save();
  return res.json({ tapCount: Number(user.tapCount), userLevel: Number(user.userLevel), paper: user.paper });
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
