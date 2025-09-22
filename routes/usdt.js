const router = require("express").Router();
const { requireAuth } = require("../middlewares/JWTAuth");
const USDT = require("../controllers/UsdtWalletController");

router.get("/balance", requireAuth, USDT.balance);
router.get("/history", requireAuth, USDT.history);
router.post("/deposit", requireAuth, USDT.deposit);
router.post("/withdraw", requireAuth, USDT.withdraw);

module.exports = router;
