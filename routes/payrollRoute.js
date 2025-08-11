// routes/payroll.js
const express = require('express');
const router = express.Router();
const {
  getPayroll,
  calculatePayroll,
  markPayrollPaid
} = require('../controllers/payrollController');

const {
  verifyTokenRequired,
  isAllowedStaff,
  isSuperAdmin
} = require('../middlewares/JWTAuth');

router.get('/', verifyTokenRequired, isAllowedStaff, getPayroll);
router.post('/calculate', verifyTokenRequired, isSuperAdmin, calculatePayroll);
router.put('/:id/mark-paid', verifyTokenRequired, isSuperAdmin, markPayrollPaid);

module.exports = router;