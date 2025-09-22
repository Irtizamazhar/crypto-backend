const { WithdrawalRequest, User, Sequelize } = require("../models");
const { Op } = Sequelize;

// Simple role check helper (adapt to your auth system)
function ensureAdmin(req) {
  return req.user && String(req.user.role || "").toLowerCase() === "admin";
}

exports.list = async (req, res) => {
  if (!ensureAdmin(req)) return res.status(403).json({ message: "Admin only" });

  const status = req.query.status || "pending";
  const where = status ? { status } : {};
  const items = await WithdrawalRequest.findAll({
    where,
    include: [{ model: User, as: "user", attributes: ["id","name","email","avatar"] }],
    order: [["createdAt", "DESC"]],
    limit: 200,
  });
  res.json({ items });
};

exports.approve = async (req, res) => {
  if (!ensureAdmin(req)) return res.status(403).json({ message: "Admin only" });

  const id = Number(req.params.id);
  const wr = await WithdrawalRequest.findByPk(id);
  if (!wr) return res.status(404).json({ message: "Request not found" });
  if (wr.status !== "pending") return res.status(400).json({ message: "Already decided" });

  const user = await User.findByPk(wr.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  // Deduct (it should already be deducted at request time if you want hold; 
  // if not deducted yet, do it now; here we assume it was already deducted in /api/usdt/withdraw)
  wr.status = "approved";
  wr.decidedAt = new Date();
  wr.decidedBy = req.user.id;
  await wr.save();

  // You can also append to user's fiatHistory a note "Withdraw approved"
  const hist = Array.isArray(user.fiatHistory) ? user.fiatHistory : [];
  hist.unshift({ type: "withdraw", amount: Number(wr.amount), note: "Withdraw approved", createdAt: new Date() });
  user.fiatHistory = hist.slice(0, 500);
  await user.save();

  res.json({ ok: true });
};

exports.reject = async (req, res) => {
  if (!ensureAdmin(req)) return res.status(403).json({ message: "Admin only" });

  const id = Number(req.params.id);
  const wr = await WithdrawalRequest.findByPk(id);
  if (!wr) return res.status(404).json({ message: "Request not found" });
  if (wr.status !== "pending") return res.status(400).json({ message: "Already decided" });

  const user = await User.findByPk(wr.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  // If you deducted on request, refund on rejection:
  const bal = Number(user.fiatUsd || 0);
  user.fiatUsd = (bal + Number(wr.amount)).toFixed(2);
  const hist = Array.isArray(user.fiatHistory) ? user.fiatHistory : [];
  hist.unshift({ type: "deposit", amount: Number(wr.amount), note: "Withdraw rejected — refund", createdAt: new Date() });
  user.fiatHistory = hist.slice(0, 500);
  await user.save();

  wr.status = "rejected";
  wr.decidedAt = new Date();
  wr.decidedBy = req.user.id;
  await wr.save();

  res.json({ ok: true });
};
