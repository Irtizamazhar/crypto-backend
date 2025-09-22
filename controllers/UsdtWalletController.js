const { User } = require("../models");

/**
 * USDT/Fiat controller.
 * Stores balance in fiatUsd (DECIMAL(18,2)) and a fiatHistory JSON array:
 *   { type: "deposit"|"withdraw"|"adjust", amount: number, note: string, createdAt: Date }
 *
 * NOTE:
 * - In production, deposits should be driven by actual payment/wallet webhooks.
 * - Withdraw should trigger off-chain/on-chain payout flows + KYC/AML.
 * - Here we only provide simple endpoints to mutate balance securely.
 */

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

/**
 * Admin/manual deposit
 * body: { amount, note? }
 */
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

/**
 * Withdraw request (simple version)
 * body: { amount, note? }
 */
exports.withdraw = async (req, res) => {
  const amt = Number(req.body?.amount || 0);
  if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ message: "Invalid amount" });

  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const bal = Number(user.fiatUsd || 0);
  if (amt > bal) return res.status(400).json({ message: "Insufficient balance" });

  user.fiatUsd = (bal - amt).toFixed(2);
  const hist = Array.isArray(user.fiatHistory) ? user.fiatHistory : [];
  hist.unshift({ type: "withdraw", amount: amt, note: req.body.note || "Withdraw", createdAt: new Date() });
  user.fiatHistory = hist.slice(0, 500);
  await user.save();

  return res.json({ fiatUsd: Number(user.fiatUsd) });
};
