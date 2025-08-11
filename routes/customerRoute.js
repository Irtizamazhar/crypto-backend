const express = require("express");
const router = express.Router();

const {
  createCustomer,
  updateCustomer,
  getAllCustomers,
  deleteCustomer,
} = require("../controllers/userAccessController");

const {
  verifyTokenRequired,
  isSuperAdmin, // only super admins can manage customers
} = require("../middlewares/JWTAuth");

// ✅ Create Customer (by super admin only)
router.post("/register", verifyTokenRequired, isSuperAdmin, createCustomer);
router.get("/", verifyTokenRequired, isSuperAdmin, getAllCustomers);
// ✅ Update Customer
router.put("/:id", verifyTokenRequired, isSuperAdmin, updateCustomer);

// ✅ Delete Customer
router.delete("/:id", verifyTokenRequired, isSuperAdmin, deleteCustomer);

module.exports = router;
