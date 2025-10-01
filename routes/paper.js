// server/routes/paper.js
const router = require("express").Router();
const { requireAuth, requireRole } = require("../middlewares/JWTAuth");
const Paper = require("../controllers/PaperWalletController");

// User endpoints
router.get("/wallet", requireAuth, Paper.wallet);
router.post("/claim-daily", requireAuth, Paper.claimDaily);
router.post("/earn", requireAuth, Paper.earn);
router.post("/tap", requireAuth, Paper.tap);
router.post("/tap-batch", requireAuth, Paper.tapBatch);
router.get("/rain", requireAuth, Paper.getRain);
router.post("/rain/grab", requireAuth, Paper.grabRain);
router.get("/history", requireAuth, Paper.history);

// Admin-only prize rain controls
router.post("/admin/rain/start", requireAuth, requireRole("admin"), Paper.adminStartRain);
router.post("/admin/rain/stop",  requireAuth, requireRole("admin"), Paper.adminStopRain);

module.exports = router;
