// server/routes/lottery.js
const router = require("express").Router();
const { requireAuth, requireRole } = require("../middlewares/JWTAuth");
const Lottery = require("../controllers/LotteryController");

// Sanity ping (optional, useful while debugging routes)
router.get("/ping", (_req, res) => res.json({ ok: true, scope: "lottery" }));

// User endpoints
router.get("/current", requireAuth, Lottery.current);
router.post("/join", requireAuth, Lottery.join);
router.get("/rounds", requireAuth, Lottery.listRounds);
router.get("/rounds/:id/participants", requireAuth, Lottery.roundParticipants);

// Admin: pick winner
router.post("/rounds/:id/resolve", requireAuth, requireRole("admin"), Lottery.adminPickWinner);

module.exports = router;
