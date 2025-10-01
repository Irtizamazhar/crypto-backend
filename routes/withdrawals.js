"use strict";
const router = require("express").Router();
const { requireAuth, requireAdmin, requireOtp } = require("../util/middleware/auth");
const C = require("../controllers/WithdrawalsController");

router.post("/withdrawals", requireAuth, requireOtp, C.create);
router.post("/admin/withdrawals/:id/approve", requireAdmin, C.approve);

module.exports = router;
