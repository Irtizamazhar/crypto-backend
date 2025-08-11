const express = require("express");
const router = express.Router();
const { getStaffPerformance } = require("../controllers/performanceController");
const { verifyTokenRequired, isAllowedStaff } = require("../middlewares/JWTAuth");

// Performance route
router.get("/performance", verifyTokenRequired, isAllowedStaff, getStaffPerformance);

module.exports = router;