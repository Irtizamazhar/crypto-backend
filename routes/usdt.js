const router = require("express").Router();
const { requireAuth } = require("../middlewares/JWTAuth");
const USDT = require("../controllers/UsdtWalletController");

// All endpoints require auth (you can add admin-only variants with requireRole("admin"))
router.get("/balance", requireAuth, USDT.balance);
router.get("/history", requireAuth, USDT.history);

// These are manual endpoints for now; in production use webhooks / admin tooling
router.post("/deposit", requireAuth, USDT.deposit);
router.post("/withdraw", requireAuth, USDT.withdraw);

module.exports = router;
