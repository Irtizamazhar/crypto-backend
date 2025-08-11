const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/statsController");
const { verifyTokenRequired, isAllowedStaff } = require("../middlewares/JWTAuth");

router.get("/", verifyTokenRequired, isAllowedStaff, getDashboardStats);

module.exports = router;