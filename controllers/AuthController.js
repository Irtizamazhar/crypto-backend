// controllers/AuthController.js
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const guard = require("../util/config/guard");

const sign = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "7d",
  });
};

function pubUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    fiatUsd: Number(u.fiatUsd || 0),
    paper: Number(u.paper || 0),
    paperStreak: Number(u.paperStreak || 0),
    paperLastClaimAt: u.paperLastClaimAt || null,
    tapCount: Number(u.tapCount || 0),
    userLevel: Number(u.userLevel || 0),
  };
}

module.exports = {
  // Local email/password
  async register(req, res) {
    try {
      let { name, email, password } = req.body || {};
      name = (name || "").trim();
      email = String(email || "").trim().toLowerCase();
      password = String(password || "");

      if (!name || !email || !password) {
        return res.status(400).json({ message: "Missing fields" });
      }

      const exists = await User.findOne({ where: { email } });
      if (exists) return res.status(409).json({ message: "Email already in use" });

      const hash = await guard.hashPass(password);
      const user = await User.create({
        name,
        email,
        password: hash,
        role: "user",
        provider: "local",

        // sensible defaults so other routes don’t crash
        fiatUsd: 0,
        paper: 0,
        paperStreak: 0,
        paperLastClaimAt: null,
        tapCount: 0,
        userLevel: 0,
        paperHistory: [],
      });

      const token = sign(user);
      res.json({ token, user: pubUser(user) });
    } catch (e) {
      res.status(500).json({ message: e.message || "Register failed" });
    }
  },

  async login(req, res) {
    try {
      let { email, password } = req.body || {};
      email = String(email || "").trim().toLowerCase();
      password = String(password || "");

      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(400).json({ message: "Invalid email or password" });
      if (user.provider && user.provider !== "local") {
        return res.status(400).json({ message: `Use ${user.provider} to sign in` });
      }

      const ok = await guard.verifyPass(password, user.password);
      if (!ok) return res.status(400).json({ message: "Invalid email or password" });

      const token = sign(user);
      res.json({ token, user: pubUser(user) });
    } catch (e) {
      res.status(500).json({ message: e.message || "Login failed" });
    }
  },

  me(req, res) {
    // requireAuth attaches a subset of fields to req.user
    return res.json({ user: pubUser(req.user) });
  },



async updateProfile(req, res) {
    try {
      const { name } = req.body || {};
      if (!name || !String(name).trim()) {
        return res.status(400).json({ message: "Name is required" });
      }
      const user = await User.findByPk(req.user.id);
      if (!user) return res.status(404).json({ message: "Not found" });

      user.name = String(name).trim();
      await user.save();

      // Return public user (same shape as `me`)
      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          fiatUsd: Number(user.fiatUsd || 0),
          paper: Number(user.paper || 0),
          paperStreak: Number(user.paperStreak || 0),
          paperLastClaimAt: user.paperLastClaimAt || null,
          tapCount: Number(user.tapCount || 0),
          userLevel: Number(user.userLevel || 0),
        },
      });
    } catch (e) {
      return res.status(500).json({ message: e.message || "Update failed" });
    }
  },

  // ✅ NEW: changePassword
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body || {};
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Missing fields" });
      }

      const user = await User.findByPk(req.user.id);
      if (!user) return res.status(404).json({ message: "Not found" });
      if (user.provider && user.provider !== "local") {
        return res.status(400).json({ message: `This account uses ${user.provider} sign in` });
      }

      const ok = await guard.verifyPass(currentPassword, user.password);
      if (!ok) return res.status(400).json({ message: "Current password is incorrect" });

      const hash = await guard.hashPass(newPassword);
      user.password = hash;
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
      // Always return ok to avoid user enumeration
      if (!user) return res.json({ ok: true });

      if (user.provider && user.provider !== "local") {
        // For social accounts, suggest using that provider
        return res.json({ ok: true });
      }

      const token = signMagic(email);
      const link = `${CLIENT_URL}/auth/magic?token=${encodeURIComponent(token)}`;

      // TODO integrate real mailer; for now log and return link in dev
      console.log("[magic-link]", link);

      // In production, do NOT return link — only send email.
      return res.json({ ok: true, devLink: process.env.NODE_ENV !== "production" ? link : undefined });
    } catch (e) {
      return res.status(500).json({ message: e.message || "Failed to process request" });
    }
  },

  // ✅ Exchange magic token for normal session
  async magicLogin(req, res) {
    try {
      const token = String(req.query?.token || req.body?.token || "");
      if (!token) return res.status(400).json({ message: "Missing token" });

      const payload = jwt.verify(token, JWT_SECRET);
      if (payload.type !== "magic") return res.status(400).json({ message: "Invalid token" });

      const email = String(payload.email || "").toLowerCase();
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(400).json({ message: "Invalid token" });

      const authToken = sign(user);
      return res.json({ token: authToken, user: pubUser(user) });
    } catch (e) {
      return res.status(400).json({ message: "Token expired or invalid" });
    }
  },

  // One-time admin bootstrap (alternative to seeder)
  async bootstrapAdmin(_req, res) {
    const email = (process.env.ADMIN_EMAIL || "admin@site.com").toLowerCase();
    let admin = await User.findOne({ where: { email } });
    if (admin) return res.json({ message: "Admin exists" });

    const hash = await guard.hashPass(process.env.ADMIN_PASS || "admin123");
    admin = await User.create({
      name: "Admin",
      email,
      password: hash,
      role: "admin",
      provider: "local",
      fiatUsd: 0,
      paper: 0,
      paperStreak: 0,
      paperLastClaimAt: null,
      tapCount: 0,
      userLevel: 0,
      paperHistory: [],
    });
    res.json({ message: "Admin created", email: admin.email });
  },
};
