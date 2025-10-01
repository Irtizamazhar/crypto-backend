"use strict";
const router = require("express").Router();
const { requireAuth } = require("../middlewares/JWTAuth");
const C = require("../controllers/WalletController");

// Remove the duplicate "wallet" prefix from these routes
router.get("/trc20", requireAuth, C.getTrc20Wallet);
router.get("/balance", requireAuth, C.getBalance);
router.get("/deposits", requireAuth, C.listDeposits);
router.post("/purchase", requireAuth, C.purchase);

module.exports = router;