// controllers/attendanceController.js
const { Attendance, Staff } = require('../models');
const { Op } = require('sequelize');
const { startOfMonth, endOfMonth, format, parseISO } = require('date-fns');

// Mark attendance
const markAttendance = async (req, res) => {
  try {
    const { staffId, date, status, checkIn, checkOut, notes } = req.body;

    // Validate status
    const validStatuses = ['present', 'absent', 'late', 'half-day'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid attendance status' 
      });
    }

    // Check if staff exists
    const staff = await Staff.findByPk(staffId);
    if (!staff) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff member not found' 
      });
    }

    // Create or update attendance record
    const [attendance, created] = await Attendance.upsert({
      staffId,
      date,
      status,
      checkIn,
      checkOut,
      notes
    }, {
      returning: true
    });

    return res.status(200).json({
      success: true,
      message: created ? 'Attendance marked successfully' : 'Attendance updated successfully',
      data: attendance
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get daily attendance
const getDailyAttendance = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Date parameter is required' 
      });
    }

    // Get all active staff
    const activeStaff = await Staff.findAll({
      where: { status: 'Active' },
      attributes: ['id', 'full_name', 'position']
    });

    // Get attendance records for the date
    const attendanceRecords = await Attendance.findAll({
      where: { date },
      include: {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'full_name', 'position']
      }
    });

    // Create a map of attendance records by staffId
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      attendanceMap[record.staffId] = record;
    });

    // Combine with all active staff to ensure everyone has a record
    const completeAttendance = activeStaff.map(staff => {
      return attendanceMap[staff.id] || {
        id: null,
        staffId: staff.id,
        date,
        status: 'absent',
        checkIn: null,
        checkOut: null,
        notes: null,
        staff
      };
    });

    return res.status(200).json({
      success: true,
      data: completeAttendance
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get monthly report
const getMonthlyReport = async (req, res) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ 
        success: false, 
        message: 'Month parameter is required (YYYY-MM)' 
      });
    }

    const startDate = startOfMonth(new Date(month));
    const endDate = endOfMonth(new Date(month));

    // Get all active staff with their attendance records for the month
    const staff = await Staff.findAll({
      where: { status: 'Active' },
      attributes: ['id', 'full_name', 'position'],
      include: {
        model: Attendance,
        as: 'attendance',
        where: {
          date: {
            [Op.between]: [startDate, endDate]
          }
        },
        required: false
      }
    });

    // Calculate attendance metrics for each staff member
    const reportData = staff.map(staffMember => {
      const attendanceRecords = staffMember.attendance || [];
      
      const presentDays = attendanceRecords.filter(a => a.status === 'present').length;
      const absentDays = attendanceRecords.filter(a => a.status === 'absent').length;
      const lateDays = attendanceRecords.filter(a => a.status === 'late').length;
      const halfDays = attendanceRecords.filter(a => a.status === 'half-day').length;
      
      const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;
      const attendanceRate = Math.round((presentDays / totalDays) * 100);

      return {
        id: staffMember.id,
        full_name: staffMember.full_name,
        position: staffMember.position,
        present: presentDays,
        absent: absentDays,
        late: lateDays,
        halfDays: halfDays,
        attendanceRate
      };
    });

    return res.status(200).json({
      success: true,
      data: reportData
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

module.exports = {
  markAttendance,
  getDailyAttendance,
  getMonthlyReport
};