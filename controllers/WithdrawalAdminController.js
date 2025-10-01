"use strict";
const { WithdrawalRequest, User, Sequelize } = require("../models");
const { Op } = Sequelize;

/**
 * Helper to check if the current user has admin role. In a real
 * application this would likely be handled by middleware (see
 * middlewares/JWTAuth.js) but is included here for completeness.
 */
function ensureAdmin(req) {
  return req.user && String(req.user.role || "").toLowerCase() === "admin";
}

module.exports = {
  /**
   * List withdrawal requests filtered by status (default: pending).
   * Only accessible to admins.
   */
  async list(req, res) {
    if (!ensureAdmin(req)) {
      return res.status(403).json({ message: "Admin only" });
    }
    const status = req.query.status || "pending";
    const where = status ? { status } : {};
    const items = await WithdrawalRequest.findAll({
      where,
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email", "avatar"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: 200,
    });
    return res.json({ items });
  },

  /**
   * Approve a pending fiat withdrawal. Marks the request as
   * approved, records the decision metadata and appends a note to
   * the user's fiat history. Does not actually move funds; that
   * must be handled by an external finance team.
   */
  async approve(req, res) {
    if (!ensureAdmin(req)) {
      return res.status(403).json({ message: "Admin only" });
    }
    const id = Number(req.params.id);
    const wr = await WithdrawalRequest.findByPk(id);
    if (!wr) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (wr.status !== "pending") {
      return res.status(400).json({ message: "Already decided" });
    }
    const user = await User.findByPk(wr.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    wr.status = "approved";
    wr.decidedAt = new Date();
    wr.decidedBy = req.user.id;
    await wr.save();
    // Append history entry to user.fiatHistory
    const hist = Array.isArray(user.fiatHistory) ? user.fiatHistory : [];
    hist.unshift({
      type: "withdraw",
      amount: Number(wr.amount),
      note: "Withdraw approved",
      createdAt: new Date(),
    });
    user.fiatHistory = hist.slice(0, 500);
    await user.save();
    return res.json({ ok: true });
  },

  /**
   * Reject a pending fiat withdrawal. If the user's balance was
   * deducted on request creation, refund it now. For simplicity
   * this implementation assumes the balance was not deducted until
   * approval, so no refund is needed. The note is recorded in
   * fiatHistory and the request is marked as rejected.
   */
  async reject(req, res) {
    if (!ensureAdmin(req)) {
      return res.status(403).json({ message: "Admin only" });
    }
    const id = Number(req.params.id);
    const wr = await WithdrawalRequest.findByPk(id);
    if (!wr) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (wr.status !== "pending") {
      return res.status(400).json({ message: "Already decided" });
    }
    const user = await User.findByPk(wr.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Refund the amount if it was held at request time. This
    // implementation assumes no hold so we simply update balance.
    const bal = Number(user.fiatUsd || 0);
    user.fiatUsd = (bal + Number(wr.amount)).toFixed(2);
    const hist = Array.isArray(user.fiatHistory) ? user.fiatHistory : [];
    hist.unshift({
      type: "deposit",
      amount: Number(wr.amount),
      note: "Withdraw rejected — refund",
      createdAt: new Date(),
    });
    user.fiatHistory = hist.slice(0, 500);
    await user.save();
    wr.status = "rejected";
    wr.decidedAt = new Date();
    wr.decidedBy = req.user.id;
    await wr.save();
    return res.json({ ok: true });
  },
};