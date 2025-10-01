const router = require("express").Router();
const { requireAuth, requireRole } = require("../middlewares/JWTAuth");
const Lottery = require("../controllers/LotteryController");

// sanity
router.get("/ping", (_req, res) => res.json({ ok: true, scope: "lottery" }));

// User endpoints
router.get("/current", requireAuth, Lottery.current);
router.post("/join", requireAuth, Lottery.join);
router.get("/rounds", requireAuth, Lottery.listRounds);
router.get("/rounds/:id/participants", requireAuth, Lottery.roundParticipants);

// Admin resolve
router.post("/rounds/:id/resolve", requireAuth, requireRole("admin"), Lottery.adminPickWinner);

// Optional admin-prefixed mirrors (front-end convenience)
router.get("/admin/rounds", requireAuth, requireRole("admin"), Lottery.listRounds);
router.get("/admin/rounds/:id/participants", requireAuth, requireRole("admin"), Lottery.roundParticipants);
router.post("/admin/rounds/:id/resolve", requireAuth, requireRole("admin"), Lottery.adminPickWinner);

module.exports = router;
