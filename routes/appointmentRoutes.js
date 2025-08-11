const express = require("express");
const router = express.Router();
const {
  createAppointment,
  getAllAppointments,
  updateAppointment,
  deleteAppointment,
} = require("../controllers/appointmentController");

const {
  verifyTokenRequired,
  isAllowedStaff,
} = require("../middlewares/JWTAuth");

// ✅ Create Appointment
router.post("/", verifyTokenRequired, isAllowedStaff, createAppointment);

// ✅ Get All Appointments
router.get("/", verifyTokenRequired, isAllowedStaff, getAllAppointments);

// ✅ Update Appointment
router.put("/:id", verifyTokenRequired, isAllowedStaff, updateAppointment);

// ✅ Delete Appointment
router.delete("/:id", verifyTokenRequired, isAllowedStaff, deleteAppointment);

module.exports = router;
