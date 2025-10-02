// server/routes/payments.js
"use strict";
const router = require("express").Router();
const { requireAuth } = require("../middlewares/JWTAuth");
const Payments = require("../controllers/PaymentsController");

router.use(requireAuth);

// allow POST /api/payments (your frontend) and POST /api/payments/create
router.post("/", Payments.create);          // ✅ new alias
router.post("/create", Payments.create);
router.post("/:id/confirm", Payments.confirm);

module.exports = router;
