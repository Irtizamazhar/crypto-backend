// controllers/UsdtWalletController.js
const { User, WithdrawalRequest } = require("../models");

exports.balance = async (req, res) => {
  const user = await User.findByPk(req.user.id, { attributes: ["fiatUsd", "fiatHistory"] });
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({
    fiatUsd: Number(user.fiatUsd || 0),
    historyCount: Array.isArray(user.fiatHistory) ? user.fiatHistory.length : 0
  });
};

exports.history = async (req, res) => {
  const page  = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

  const user = await User.findByPk(req.user.id, { attributes: ["fiatHistory"] });
  if (!user) return res.status(404).json({ message: "User not found" });

  const list = Array.isArray(user.fiatHistory) ? user.fiatHistory : [];
  const start = (page - 1) * limit;
  const items = list.slice(start, start + limit);

  return res.json({ items, page, limit, total: list.length });
};

exports.deposit = async (req, res) => {
  const amt = Number(req.body?.amount || 0);
  if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ message: "Invalid amount" });

  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const bal = Number(user.fiatUsd || 0) + amt;
  user.fiatUsd = bal.toFixed(2);
  const hist = Array.isArray(user.fiatHistory) ? user.fiatHistory : [];
  hist.unshift({ type: "deposit", amount: amt, note: req.body.note || "Deposit", createdAt: new Date() });
  user.fiatHistory = hist.slice(0, 500);
  await user.save();

  return res.json({ fiatUsd: Number(user.fiatUsd) });
};

exports.withdraw = async (req, res) => {
  const amt = Number(req.body?.amount || 0);
  if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ message: "Invalid amount" });

  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const wr = await WithdrawalRequest.create({
    userId: req.user.id,
    amount: amt.toFixed(2),
    note: req.body.note || "Withdraw request",
    status: "pending",
  });

  return res.json({ ok: true, requestId: wr.id });
};
