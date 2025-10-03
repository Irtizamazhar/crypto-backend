// controllers/AuthController.js
"use strict";
const jwt = require("jsonwebtoken");
const { User, UserAddress, sequelize } = require("../models");
const guard = require("../util/config/guard");
const { createTronAddressForUser } = require("../services/tronAddressAllocator");

function baseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers["x-forwarded-host"] || req.get("host");
  return `${proto}://${host}`;
}
function sign(user) {
  const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || "7d" });
}
function pubUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar || null,
    fiatUsd: Number(u.fiatUsd || 0),
    paper: Number(u.paper || 0),
    paperStreak: Number(u.paperStreak || 0),
    paperLastClaimAt: u.paperLastClaimAt || null,
    tapCount: Number(u.tapCount || 0),
    userLevel: Number(u.userLevel || 0),
    referralCode: u.referralCode || null,
    referredBy: u.referredBy || null,
    referralCount: Number(u.referralCount || 0),
    hasSpun: !!u.hasSpun,
  };
}
function isHttpUrl(s) {
  return typeof s === "string" && /^https?:\/\/.+/i.test(s);
}
function genReferralCode(base) {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${(base || "USER").toString().replace(/[^A-Z0-9]/gi, "").slice(0,6).toUpperCase()}${rand}`;
}
async function awardPaper(user, amount, type, note, t) {
  user.paper = Number(user.paper || 0) + Number(amount);
  const hist = Array.isArray(user.paperHistory) ? user.paperHistory : [];
  hist.unshift({ type, amount: Number(amount), note, createdAt: new Date() });
  user.paperHistory = hist.slice(0, 500);
  await user.save({ transaction: t });
}

module.exports = {
  async register(req, res) {
    let tx;
    try {
      let { name, email, password, referralCode: refInput } = req.body || {};
      name = (name || "").trim();
      email = String(email || "").trim().toLowerCase();
      password = String(password || "");
      if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });

      tx = await sequelize.transaction();

      const exists = await User.findOne({ where: { email }, transaction: tx });
      if (exists) { await tx.rollback(); return res.status(409).json({ message: "Email already in use" }); }

      // find referrer (optional)
      let referrer = null;
      if (refInput) {
        referrer = await User.findOne({ where: { referralCode: String(refInput).trim() }, transaction: tx });
      }

      // create user
      const user = await User.create({
        name, email, password: await guard.hashPass(password),
        role: "user", provider: "local",
        fiatUsd: 0, paper: 0, paperStreak: 0, paperLastClaimAt: null, tapCount: 0, userLevel: 0, paperHistory: [],
        referredBy: referrer ? referrer.id : null,
      }, { transaction: tx });

      // ensure unique referral code
      let code = genReferralCode(name || email);
      // small loop to guarantee uniqueness
      for (let i = 0; i < 3; i++) {
        const clash = await User.findOne({ where: { referralCode: code }, transaction: tx });
        if (!clash) break;
        code = genReferralCode(name || email);
      }
      user.referralCode = code;

      // Signup bonus for new user (+20)
      await awardPaper(user, 20, "ref_signup_bonus", "Welcome bonus for signing up", tx);

      // Referrer bonus (+100) & count++
      if (referrer) {
        referrer.referralCount = Number(referrer.referralCount || 0) + 1;
        await awardPaper(referrer, 100, "referral_reward", `Referral signup: ${email}`, tx);
      }

      // create TRON address
      try { await createTronAddressForUser(user.id); }
      catch { await tx.rollback(); return res.status(500).json({ message: "Failed to create wallet. Please try again." }); }

      await user.save({ transaction: tx });
      if (referrer) await referrer.save({ transaction: tx });

      await tx.commit();

      return res.json({ token: sign(user), user: pubUser(user), message: "Registration successful" });
    } catch (e) {
      if (tx) await tx.rollback();
      return res.status(500).json({ message: "Registration failed. Please try again." });
    }
  },

  async login(req, res) {
    try {
      let { email, password } = req.body || {};
      email = String(email || "").trim().toLowerCase();
      password = String(password || "");
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(400).json({ message: "Invalid email or password" });
      if (!(await guard.verifyPass(password, user.password))) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
      const resp = { token: sign(user), user: pubUser(user) };
      return res.json(resp);
    } catch (e) {
      return res.status(500).json({ message: e.message || "Login failed" });
    }
  },

  async me(req, res) {
    try {
      return res.json({ user: pubUser(req.user) });
    } catch {
      return res.json({ user: pubUser(req.user) });
    }
  },

  async uploadAvatar(req, res) {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const url = `${baseUrl(req)}/uploads/avatars/${encodeURIComponent(req.file.filename)}`;
      return res.json({ url });
    } catch (e) {
      return res.status(500).json({ message: "Upload failed" });
    }
  },

  async updateProfile(req, res) {
    try {
      const { name, avatar } = req.body || {};
      if (!name || !String(name).trim()) return res.status(400).json({ message: "Name is required" });
      const user = await User.findByPk(req.user.id);
      if (!user) return res.status(404).json({ message: "Not found" });

      user.name = String(name).trim();

      if (avatar !== undefined) {
        if (avatar === "") user.avatar = null;
        else if (isHttpUrl(avatar)) user.avatar = String(avatar);
        else return res.status(400).json({ message: "Avatar must be an http(s) URL. Upload the file first." });
      }

      await user.save();
      return res.json({ user: pubUser(user) });
    } catch (e) {
      return res.status(500).json({ message: e.message || "Update failed" });
    }
  },

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body || {};
      if (!currentPassword || !newPassword) return res.status(400).json({ message: "Missing fields" });
      const user = await User.findByPk(req.user.id);
      if (!user) return res.status(404).json({ message: "Not found" });
      if (user.provider && user.provider !== "local") {
        return res.status(400).json({ message: `This account uses ${user.provider} sign in` });
      }
      if (!(await guard.verifyPass(currentPassword, user.password))) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      user.password = await guard.hashPass(newPassword);
      await user.save();
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ message: e.message || "Password change failed" });
    }
  },

  async forgotPassword(req, res) {
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      if (!email) return res.status(400).json({ message: "Email required" });
      const user = await User.findOne({ where: { email } });
      if (!user) return res.json({ ok: true });
      const token = jwt.sign({ email, type: "magic" }, process.env.JWT_SECRET, { expiresIn: "15m" });
      const link = `${process.env.CLIENT_URL || "http://localhost:3000"}/auth/magic?token=${encodeURIComponent(token)}`;
      console.log("[magic-link]", link);
      return res.json({ ok: true, link });
    } catch (e) {
      return res.status(500).json({ message: e.message || "Failed to process request" });
    }
  },

  async magicLogin(req, res) {
    try {
      const token = String(req.query?.token || req.body?.token || "");
      if (!token) return res.status(400).json({ message: "Missing token" });
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload.type !== "magic") return res.status(400).json({ message: "Invalid token" });

      const email = String(payload.email || "").toLowerCase();
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(400).json({ message: "Invalid token" });

      const resp = { token: sign(user), user: pubUser(user) };
      return res.json(resp);
    } catch (e) {
      return res.status(400).json({ message: "Token expired or invalid" });
    }
  },

  async bootstrapAdmin(_req, res) {
    try {
      const email = (process.env.ADMIN_EMAIL || "admin@site.com").toLowerCase();
      let admin = await User.findOne({ where: { email } });
      if (admin) return res.json({ message: "Admin exists" });
      admin = await User.create({
        name: "Admin", email,
        password: await guard.hashPass(process.env.ADMIN_PASS || "admin123"),
        role: "admin", provider: "local",
        fiatUsd: 0, paper: 0, paperStreak: 0, paperLastClaimAt: null, tapCount: 0, userLevel: 0, paperHistory: [],
      });
      return res.json({ message: "Admin created", email: admin.email });
    } catch (e) {
      return res.status(500).json({ message: e.message || "Failed to bootstrap admin" });
    }
  },
};
