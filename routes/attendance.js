// routes/attendance.js
const express = require('express');
const router = express.Router();

const {
  markAttendance,
  getDailyAttendance,
  getMonthlyReport
} = require('../controllers/attendanceController');

const {
  verifyTokenRequired,
  isAllowedStaff,
  isSuperAdmin
} = require('../middlewares/JWTAuth');

// Mark attendance (admin or manager only)
router.post('/', verifyTokenRequired, isAllowedStaff, markAttendance);

// Get daily attendance (admin or manager only)
router.get('/daily', verifyTokenRequired, isAllowedStaff, getDailyAttendance);

// Get monthly report (admin or manager only)
router.get('/monthly', verifyTokenRequired, isAllowedStaff, getMonthlyReport);

module.exports = router;