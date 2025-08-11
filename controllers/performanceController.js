const { Staff, Attendance, Sale, Appointment } = require("../models");
const { Op } = require("sequelize");

const getStaffPerformance = async (req, res) => {
  try {
    const { startDate, endDate, staffId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: "Both startDate and endDate are required" 
      });
    }

    // Adjust dates to include entire days
    const startOfPeriod = new Date(startDate);
    startOfPeriod.setHours(0, 0, 0, 0);
    
    const endOfPeriod = new Date(endDate);
    endOfPeriod.setHours(23, 59, 59, 999);

    // Base query conditions
    const whereCondition = {
      status: 'Active',
      deletedAt: null
    };

    if (staffId) {
      whereCondition.id = staffId;
    }

    // Get all active staff with their performance data
    const staffs = await Staff.findAll({
      attributes: ['id', 'full_name', 'position', 'commission_rate'],
      where: whereCondition,
      include: [
        {
          association: 'attendance',
          where: {
            date: {
              [Op.between]: [startDate, endDate]
            }
          },
          required: false
        },
        {
          association: 'sales',
          where: {
            createdAt: {  // Changed from sale_date to createdAt
              [Op.between]: [startOfPeriod, endOfPeriod]
            }
          },
          required: false
        },
        {
          association: 'appointments',
          where: {
            appointment_date: {
              [Op.between]: [startDate, endDate]
            },
            status: 'completed'
          },
          required: false
        }
      ]
    });

    // Calculate performance metrics for each staff member
    const performanceData = staffs.map(staff => {
      // Attendance calculations
      const presentDays = staff.attendance?.filter(a => a.status === 'present').length || 0;
      const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
      const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      // Sales calculations
      const totalRevenue = staff.sales?.reduce((sum, sale) => sum + sale.total, 0) || 0; // Changed from total_amount to total
      const totalCommission = staff.sales?.reduce((sum, sale) => {
        return sum + (sale.total * (staff.commission_rate || 0) / 100); // Changed from total_amount to total
      }, 0) || 0;

      // Appointment calculations
      const completedAppointments = staff.appointments?.length || 0;
      const averageRating = staff.appointments?.length > 0 
        ? staff.appointments.reduce((sum, appt) => sum + (appt.rating || 0), 0) / staff.appointments.length
        : 0;

      return {
        id: staff.id,
        full_name: staff.full_name,
        position: staff.position,
        total_customers: completedAppointments,
        total_revenue: totalRevenue,
        total_commission: totalCommission,
        attendance_rate: attendanceRate,
        average_rating: averageRating,
        present_days: presentDays,
        total_days: totalDays
      };
    });

    res.status(200).json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
};

module.exports = {
  getStaffPerformance
};