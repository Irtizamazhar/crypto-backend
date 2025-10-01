"use strict";
const router = require("express").Router();
const { requireAdmin, requireOtp } = require("../util/middleware/auth");
const C = require("../controllers/AdminTreasuryController");

router.post("/admin/treasury/withdraw", requireAdmin, requireOtp, C.withdraw);

module.exports = router;
