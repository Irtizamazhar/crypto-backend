const express = require("express");
const router = express.Router();

const {
  createStaff,
  updateStaff,
  deleteStaff,
  loginStaff,
  getAllStaff,
} = require("../controllers/userAccessController");

const {
  verifyTokenRequired,
  isAllowedStaff,
  isSuperAdmin,
} = require("../middlewares/JWTAuth");

const { getStaffPerformance } = require("../controllers/performanceController");

// Login (public route)
router.post("/login", loginStaff);

// Get All Staff (for admins)
router.get("/", verifyTokenRequired, isAllowedStaff, getAllStaff);

// Performance route
router.get("/performance", verifyTokenRequired, isAllowedStaff, getStaffPerformance);

// Create Staff (super admin only)
router.post("/", verifyTokenRequired, isSuperAdmin, createStaff);

// Update Staff (super admin only)
router.put("/:id", verifyTokenRequired, isSuperAdmin, updateStaff);

// Delete Staff (super admin only)
router.delete("/:id", verifyTokenRequired, isSuperAdmin, deleteStaff);

module.exports = router;