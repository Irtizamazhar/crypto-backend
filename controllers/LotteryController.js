// server/controllers/LotteryController.js
const { User, LotteryRound, LotteryEntry, Sequelize } = require("../models");
const { Op } = Sequelize;

/** Ensure there is one open round that resolves in ~24 hours */
async function getOrCreateOpenRound() {
  const now = new Date();
  let round = await LotteryRound.findOne({
    where: { resolved: false, resolvesAt: { [Op.gt]: now } },
    order: [["id", "DESC"]],
  });
  if (!round) {
    round = await LotteryRound.create({
      resolvesAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      resolved: false,
      payout: 0,
    });
  }
  return round;
}

exports.current = async (req, res) => {
  const now = new Date();
  const userId = req.user?.id;
  const user = userId ? await User.findByPk(userId, { attributes: ["fiatUsd"] }) : null;

  const round = await LotteryRound.findOne({
    where: { resolved: false, resolvesAt: { [Op.gt]: now } },
    include: [
      {
        model: LotteryEntry,
        as: "entries",
        include: [{ model: User, as: "user", attributes: ["id", "name", "email", "avatar"] }],
      },
    ],
    order: [["id", "DESC"]],
  });

  if (!round) {
    return res.json({ round: null, entries: [], pool: 0, fiatUsd: Number(user?.fiatUsd || 0) });
  }

  return res.json({
    round,
    entries: round.entries || [],
    pool: (round.entries || []).length,
    fiatUsd: Number(user?.fiatUsd || 0),
  });
};

exports.join = async (req, res) => {
  const userId = req.user.id;
  const user = await User.findByPk(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const bal = Number(user.fiatUsd || 0);
  if (bal < 1) return res.status(400).json({ message: "Insufficient balance ($1 required)" });

  const round = await getOrCreateOpenRound();

  // Allow only one entry per user in the current round (change if you want multiple)
  const existing = await LotteryEntry.findOne({ where: { roundId: round.id, userId } });
  if (existing) return res.status(400).json({ message: "Already joined this round" });

  // Deduct $1 and record history
  user.fiatUsd = (bal - 1).toFixed(2);
  const hist = Array.isArray(user.fiatHistory) ? user.fiatHistory : [];
  hist.unshift({ type: "withdraw", amount: 1, note: "Lottery entry", createdAt: new Date() });
  user.fiatHistory = hist.slice(0, 500);
  await user.save();

  await LotteryEntry.create({ roundId: round.id, userId });

  const updated = await LotteryRound.findByPk(round.id, {
    include: [{ model: LotteryEntry, as: "entries" }],
  });

  return res.json({
    ok: true,
    round: updated,
    pool: (updated.entries || []).length,
    fiatUsd: Number(user.fiatUsd),
  });
};

exports.listRounds = async (req, res) => {
  const resolved = String(req.query.resolved || "").trim();
  const where = {};
  if (resolved === "1" || resolved.toLowerCase() === "true") {
    where.resolved = true;
  }

  const rounds = await LotteryRound.findAll({
    where,
    include: [
      {
        model: LotteryEntry,
        as: "entries",
        include: [{ model: User, as: "user", attributes: ["id", "name", "email", "avatar"] }],
      },
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
      {
        model: LotteryEntry,
        as: "entries",
        include: [{ model: User, as: "user", attributes: ["id", "name", "email", "avatar"] }],
      },
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

  const payout = entries.length; // $1 per entry

  // credit winner
  const winner = await User.findByPk(winnerUserId);
  if (!winner) return res.status(404).json({ message: "Winner user not found" });

  const wb = Number(winner.fiatUsd || 0);
  winner.fiatUsd = (wb + payout).toFixed(2);
  const whist = Array.isArray(winner.fiatHistory) ? winner.fiatHistory : [];
  whist.unshift({ type: "deposit", amount: payout, note: `Lottery Round #${round.id} Winnings`, createdAt: new Date() });
  winner.fiatHistory = whist.slice(0, 500);
  await winner.save();

  round.resolved = true;
  round.winnerUserId = Number(winnerUserId);
  round.payout = payout;
  await round.save();

  return res.json({ ok: true, roundId: round.id, winnerUserId: Number(winnerUserId), payout });
};
