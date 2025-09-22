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
