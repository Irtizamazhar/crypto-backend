// controllers/payrollController.js
const { Payroll, Staff, Sale, Attendance } = require('../models');
const { Op } = require('sequelize');
const { startOfMonth, endOfMonth, format, parseISO } = require('date-fns');

const getPayroll = async (req, res) => {
  try {
    const { month } = req.query;
    
    if (!month) {
      return res.status(400).json({ 
        success: false, 
        message: 'Month parameter is required (YYYY-MM)' 
      });
    }

    const startDate = new Date(month);
    const endDate = endOfMonth(new Date(month));

    // Get all active staff
    const staff = await Staff.findAll({
      where: { status: 'Active' }
    });

    // Get or create payroll records for each staff member
    const payrollRecords = await Promise.all(staff.map(async (staffMember) => {
      let payroll = await Payroll.findOne({
        where: {
          staffId: staffMember.id,
          month: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: {
          model: Staff,
          as: 'staff'
        }
      });

      if (!payroll) {
        payroll = await Payroll.create({
          staffId: staffMember.id,
          month: startDate,
          basicSalary: staffMember.initial_salary || 0,
          commission: 0,
          deductions: 0,
          netPayable: staffMember.initial_salary || 0,
          status: 'PENDING'
        });
      }

      return payroll;
    }));

    return res.status(200).json({
      success: true,
      data: payrollRecords
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

const calculatePayroll = async (req, res) => {
  try {
    const { staffId, month } = req.body;
    
    const startDate = new Date(month);
    const endDate = endOfMonth(new Date(month));

    // Get staff member
    const staff = await Staff.findByPk(staffId);
    if (!staff) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff member not found' 
      });
    }

    // Calculate commission from sales
    const sales = await Sale.findAll({
      where: {
        staffId,
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const commission = sales.reduce((sum, sale) => {
      return sum + (sale.commission || 0);
    }, 0);

    // Calculate deductions (example: based on absences)
    const attendance = await Attendance.findAll({
      where: {
        staffId,
        date: {
          [Op.between]: [startDate, endDate]
        },
        status: 'absent'
      }
    });

    const deductions = attendance.length * (staff.initial_salary / 30); // Deduct 1 day's salary per absence

    // Calculate net payable
    const netPayable = (staff.initial_salary || 0) + commission - deductions;

    // Update or create payroll record
    const [payroll, created] = await Payroll.upsert({
      staffId,
      month: startDate,
      basicSalary: staff.initial_salary || 0,
      commission,
      deductions,
      netPayable,
      status: 'GENERATED'
    }, {
      returning: true
    });

    return res.status(200).json({
      success: true,
      data: payroll
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

const markPayrollPaid = async (req, res) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findByPk(id);
    if (!payroll) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payroll record not found' 
      });
    }

    payroll.status = 'PAID';
    await payroll.save();

    return res.status(200).json({
      success: true,
      data: payroll
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

module.exports = {
  getPayroll,
  calculatePayroll,
  markPayrollPaid
};