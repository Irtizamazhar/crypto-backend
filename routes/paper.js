const router = require("express").Router();
const { requireAuth } = require("../middlewares/JWTAuth");
const Paper = require("../controllers/PaperWalletController");

// All endpoints require auth
router.get("/wallet", requireAuth, Paper.wallet);
router.post("/claim-daily", requireAuth, Paper.claimDaily);
router.post("/earn", requireAuth, Paper.earn);
router.post("/tap", requireAuth, Paper.tap);
router.get("/history", requireAuth, Paper.history);

module.exports = router;
