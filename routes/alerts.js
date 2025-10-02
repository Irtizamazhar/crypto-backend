// server/routes/alerts.js
"use strict";

const express = require("express");
const router = express.Router();
const passport = require("../middlewares/passport");
const { sequelize, User, Payment, Alert } = require("../models");

// All endpoints require JWT
router.use(passport.authenticate("jwt", { session: false }));

/** Helper: does user have any paid plan? */
async function userHasPaidPlan(userId) {
  const p = await Payment.findOne({
    where: { userId, status: "paid" },
    order: [["createdAt", "DESC"]],
  });
  return !!p;
}

/** -------------------- LIMITS / QUOTA -------------------- */

// GET /api/alerts/quota  -> { plan, limit, used, remaining }
router.get("/quota", async (req, res) => {
  const userId = req.user.id;
  const user = await User.findByPk(userId, {
    attributes: ["id", "freeAlertsLimit", "freeAlertsUsed"],
  });
  if (!user) return res.status(404).json({ message: "User not found" });

  const isPro = await userHasPaidPlan(userId);
  const plan = isPro ? "pro" : "free";
  const limit = user.freeAlertsLimit ?? 2;
  const used = user.freeAlertsUsed ?? 0;
  const remaining = isPro ? Infinity : Math.max(0, limit - used);

  res.json({ plan, limit, used, remaining });
});

// Alias for frontend: GET /api/alerts/limits  -> { plan, used, max }
router.get("/limits", async (req, res) => {
  const userId = req.user.id;
  const user = await User.findByPk(userId, {
    attributes: ["id", "freeAlertsLimit", "freeAlertsUsed"],
  });
  if (!user) return res.status(404).json({ message: "User not found" });

  const isPro = await userHasPaidPlan(userId);
  const plan = isPro ? "pro" : "free";
  const max = user.freeAlertsLimit ?? 2;
  const used = user.freeAlertsUsed ?? 0;

  res.json({ plan, used, max });
});

// (Optional/debug) POST /api/alerts/quota/consume
router.post("/quota/consume", async (req, res) => {
  const userId = req.user.id;
  if (await userHasPaidPlan(userId)) return res.json({ ok: true, plan: "pro" });

  try {
    await sequelize.transaction(async (t) => {
      const user = await User.findByPk(userId, {
        attributes: ["id", "freeAlertsLimit", "freeAlertsUsed"],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!user) throw new Error("User not found");

      const limit = user.freeAlertsLimit ?? 2;
      const used = user.freeAlertsUsed ?? 0;

      if (used >= limit) {
        return res
          .status(403)
          .json({ code: "FREE_QUOTA_EXHAUSTED", message: "You have used all free alerts." });
      }

      await user.update({ freeAlertsUsed: used + 1 }, { transaction: t });
      return res.json({ ok: true, plan: "free", used: used + 1, limit });
    });
  } catch (e) {
    console.error("consume quota error:", e);
    return res.status(500).json({ message: "Failed to consume quota" });
  }
});

/** -------------------- ALERTS CRUD -------------------- */

// GET /api/alerts  -> { alerts: [...] }
router.get("/", async (req, res) => {
  const userId = req.user.id;
  const rows = await Alert.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
  });
  res.json({ alerts: rows });
});

// POST /api/alerts  -> { alert }
router.post("/", async (req, res) => {
  const userId = req.user.id;
  const body = req.body || {};

  const coinId = String(body.coinId || "").trim();
  const symbol = String(body.symbol || "").trim();
  const name = String(body.name || "").trim();
  const type = String(body.type || "price");
  const op = String(body.op || ">");
  const value = Number(body.value);

  if (!coinId || !symbol || !name) {
    return res.status(400).json({ message: "coinId, symbol, name are required" });
  }
  if (!["price", "pct24h", "vol24h"].includes(type)) {
    return res.status(400).json({ message: "Invalid type" });
  }
  if (!["<", ">"].includes(op)) {
    return res.status(400).json({ message: "Invalid operator" });
  }
  if (!Number.isFinite(value) || value <= 0) {
    return res.status(400).json({ message: "Invalid value" });
  }

  const isPro = await userHasPaidPlan(userId);

  try {
    const created = await sequelize.transaction(async (t) => {
      if (!isPro) {
        const user = await User.findByPk(userId, {
          attributes: ["id", "freeAlertsLimit", "freeAlertsUsed"],
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!user) throw new Error("User not found");

        const limit = user.freeAlertsLimit ?? 2;
        const used = user.freeAlertsUsed ?? 0;
        if (used >= limit) {
          const err = new Error("Free alert quota exhausted");
          err.status = 402; // let frontend open paywall
          throw err;
        }

        await user.update({ freeAlertsUsed: used + 1 }, { transaction: t });
      }

      const alert = await Alert.create(
        {
          userId,
          coinId,
          symbol,
          name,
          type,
          op,
          value,
          enabled: true,
        },
        { transaction: t }
      );

      return alert;
    });

    res.json({ alert: created });
  } catch (e) {
    const status = e.status || 500;
    console.error("create alert error:", e.message);
    res.status(status).json({ message: e.message || "Failed to create alert" });
  }
});

// PATCH /api/alerts/:id  -> { alert }
router.patch("/:id", async (req, res) => {
  const userId = req.user.id;
  const id = Number(req.params.id || 0);

  const alert = await Alert.findOne({ where: { id, userId } });
  if (!alert) return res.status(404).json({ message: "Not found" });

  const patch = req.body || {};
  const upd = {};

  if (patch.hasOwnProperty("enabled")) upd.enabled = !!patch.enabled;
  if (patch.hasOwnProperty("op")) {
    const nop = String(patch.op);
    if (!["<", ">"].includes(nop)) return res.status(400).json({ message: "Invalid operator" });
    upd.op = nop;
  }
  if (patch.hasOwnProperty("value")) {
    const v = Number(patch.value);
    if (!Number.isFinite(v) || v <= 0) return res.status(400).json({ message: "Invalid value" });
    upd.value = v;
  }
  if (patch.hasOwnProperty("type")) {
    const t = String(patch.type);
    if (!["price", "pct24h", "vol24h"].includes(t)) {
      return res.status(400).json({ message: "Invalid type" });
    }
    upd.type = t;
  }

  await alert.update(upd);
  res.json({ alert });
});

// DELETE /api/alerts/:id  -> { ok: true }
router.delete("/:id", async (req, res) => {
  const userId = req.user.id;
  const id = Number(req.params.id || 0);

  const alert = await Alert.findOne({ where: { id, userId } });
  if (!alert) return res.status(404).json({ message: "Not found" });

  await alert.destroy();
  // NOTE: do NOT decrement freeAlertsUsed (permanent consumption)
  res.json({ ok: true });
});

// POST /api/alerts/clear -> { ok: true, deleted }
router.post("/clear", async (req, res) => {
  const userId = req.user.id;
  const deleted = await Alert.destroy({ where: { userId } });
  // NOTE: do NOT decrement freeAlertsUsed (permanent consumption)
  res.json({ ok: true, deleted });
});

module.exports = router;
