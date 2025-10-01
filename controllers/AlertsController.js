// server/controllers/AlertsController.js
"use strict";
const { Alert, User } = require("../models");

const FREE_MAX_ALERTS = 2;

function canCreateMoreAlerts(plan, count) {
  return plan === "pro" ? true : count < FREE_MAX_ALERTS;
}

function sanitizeCreate(body) {
  const coinId = String(body.coinId || "").trim();
  const symbol = String(body.symbol || "").trim();
  const name   = String(body.name   || "").trim();
  const type   = String(body.type   || "price");
  const op     = String(body.op     || ">");
  const value  = Number(body.value);

  if (!coinId || !symbol || !name) throw new Error("Missing coinId/symbol/name");
  if (!["price","pct24h","vol24h"].includes(type)) throw new Error("Invalid type");
  if (!["<",">"].includes(op)) throw new Error("Invalid op");
  if (!Number.isFinite(value)) throw new Error("Invalid value");
  return { coinId, symbol, name, type, op, value };
}

function sanitizeUpdate(body) {
  const p = {};
  if (body.enabled !== undefined) p.enabled = !!body.enabled;
  if (body.op && ["<",">"].includes(body.op)) p.op = body.op;
  if (body.type && ["price","pct24h","vol24h"].includes(body.type)) p.type = body.type;
  if (body.value !== undefined) {
    const v = Number(body.value);
    if (!Number.isFinite(v)) throw new Error("Invalid value");
    p.value = v;
  }
  return p;
}

module.exports = {
  async limits(req, res) {
    const user = await User.findByPk(req.user.id);
    const used = await Alert.count({ where: { userId: req.user.id } });
    const max  = user.plan === "pro" ? 999 : FREE_MAX_ALERTS;
    res.json({ plan: user.plan, used, max });
  },

  async list(req, res) {
    const rows = await Alert.findAll({
      where: { userId: req.user.id },
      order: [["enabled","DESC"], ["createdAt","DESC"]],
      limit: 500,
    });
    res.json({ alerts: rows });
  },

  async create(req, res) {
    const user  = await User.findByPk(req.user.id);
    const count = await Alert.count({ where: { userId: user.id } });
    if (!canCreateMoreAlerts(user.plan, count)) {
      return res.status(402).json({ message: "Free plan allows 2 alerts. Upgrade to create more." });
    }
    try {
      const data = sanitizeCreate(req.body || {});
      const row  = await Alert.create({ userId: user.id, ...data });
      res.json({ alert: row });
    } catch (e) {
      res.status(400).json({ message: e.message || "Invalid payload" });
    }
  },

  async update(req, res) {
    try {
      const id = Number(req.params.id);
      const row = await Alert.findOne({ where: { id, userId: req.user.id } });
      if (!row) return res.status(404).json({ message: "Alert not found" });
      Object.assign(row, sanitizeUpdate(req.body || {}));
      await row.save();
      res.json({ alert: row });
    } catch (e) {
      res.status(400).json({ message: e.message || "Invalid payload" });
    }
  },

  async remove(req, res) {
    const id = Number(req.params.id);
    const row = await Alert.findOne({ where: { id, userId: req.user.id } });
    if (!row) return res.status(404).json({ message: "Alert not found" });
    await row.destroy();
    res.json({ ok: true });
  },

  async clear(req, res) {
    await Alert.destroy({ where: { userId: req.user.id } });
    res.json({ ok: true });
  },
};
