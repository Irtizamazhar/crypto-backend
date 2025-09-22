const router = require("express").Router();
const { requireAuth, requireRole } = require("../middlewares/JWTAuth");

// OPTIONAL: real admin login route (only if you want it).
// If you don't implement this now, the frontend will fall back to /auth/login.
const Auth = require("../controllers/AuthController");
router.post("/auth/login", async (req, res, next) => {
  try {
    // Reuse your normal login logic
    // Assumes Auth.login returns { token, user } via res.json(...)
    // If your Auth.login sends the response directly, you can copy its internals
    // into a new Auth.adminLogin(req,res) that checks role before responding.
    let responded = false;
    const _json = res.json.bind(res);
    res.json = (payload) => {
      responded = true;
      const role = String(payload?.user?.role || "").toLowerCase();
      if (role !== "admin") {
        return res.status(403).json({ message: "This account is not an admin." });
      }
      return _json(payload);
    };
    await Auth.login(req, res, next);
    if (!responded) res.status(500).json({ message: "Login handler did not respond" });
  } catch (err) {
    next(err);
  }
});

// Admin-only identity (used by AdminAPI.me fallback)
router.get("/auth/me", requireAuth, requireRole("admin"), (req, res) => {
  res.json({ user: req.user });
});

// Simple health
router.get("/ping", requireAuth, requireRole("admin"), (req, res) => res.json({ ok: true }));

// ---- Overview (stub; replace with your real data) ----
router.get("/overview", requireAuth, requireRole("admin"), async (req, res) => {
  res.json({
    users_total: 0,
    users_active: 0,
    payments_24h: 0,
    revenue_24h: 0,
    paper_issued: 0,
    paper_redeemed: 0,
  });
});

// ---- Users (stubs) ----
router.get("/users", requireAuth, requireRole("admin"), async (req, res) => {
  const page = Number(req.query.page || 1);
  const q = String(req.query.q || "");
  res.json({
    page,
    q,
    total: 0,
    users: [], // [{_id, name, email, role, status, createdAt}]
  });
});

router.put("/users/:id/role", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body || {};
  // TODO: update DB here
  res.json({ ok: true, id, role });
});

router.put("/users/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  // TODO: update DB here
  res.json({ ok: true, id, status });
});

// ---- Payments (stub) ----
router.get("/payments", requireAuth, requireRole("admin"), async (req, res) => {
  const page = Number(req.query.page || 1);
  const q = String(req.query.q || "");
  res.json({
    page,
    q,
    total: 0,
    payments: [], // [{_id, user, amount, currency, status, createdAt}]
  });
});

// ---- Earn Paper settings (stub) ----
router.get("/earn-paper", requireAuth, requireRole("admin"), async (_req, res) => {
  res.json({
    daily_reward_base: 1,
    streak_bonus_every: 3,
    max_daily_reward: 3,
    features: { tap_game: true, watch_ads: false },
  });
});

router.put("/earn-paper", requireAuth, requireRole("admin"), async (req, res) => {
  // TODO: persist payload in DB
  res.json({ ok: true, saved: req.body || {} });
});

module.exports = router;
