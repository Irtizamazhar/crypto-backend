const db = require("../models");
const { Op } = require("sequelize");
const moment = require("moment");

const getDashboardStats = async (req, res) => {
  try {
    const { Sale, Appointment, Customer, Staff } = db;

    // Validate required models exist
    if (!Sale || !Appointment || !Customer || !Staff) {
      throw new Error("Required models are not properly initialized");
    }

    const today = moment().startOf('day');
    const sevenDaysAgo = moment().subtract(7, 'days').startOf('day');
    const thirtyDaysAgo = moment().subtract(30, 'days').startOf('day');

    // Get today's completed appointments
    const completedAppointments = await Appointment.count({
      where: {
        appointment_date: { [Op.gte]: today.toDate() },
        status: "completed"
      }
    });

    // Get today's upcoming appointments
    const upcomingAppointments = await Appointment.findAll({
      where: {
        appointment_date: { [Op.gte]: new Date() },
        status: { [Op.ne]: "completed" }
      },
      order: [['appointment_date', 'ASC']],
      limit: 5,
      include: [
        { 
          model: Customer, 
          as: 'customer',
          attributes: ['full_name'] 
        },
        { 
          model: Staff, 
          as: 'staff',
          attributes: ['full_name'] 
        }
      ]
    });

    // Get new customers from last 7 days
    const newCustomers = await Customer.count({
      where: {
        createdAt: { [Op.gte]: sevenDaysAgo.toDate() }
      }
    });

    // Get revenue from last 30 days
    const sales = await Sale.findAll({
      where: {
        createdAt: { [Op.gte]: thirtyDaysAgo.toDate() }
      }
    });
    const revenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);

    // Format upcoming appointments for frontend
    const formattedAppointments = upcomingAppointments.map(appt => ({
      name: appt.customer?.full_name || "Unknown",
      staff: appt.staff?.full_name || "Unknown",
      time: moment(appt.appointment_date).format("h:mm A")
    }));

    res.json({
      success: true,
      revenue,
      newCustomers,
      completedAppointments,
      upcomingAppointments: formattedAppointments,
      quickActions: [
        { label: "New Sale / Billing", completed: false },
        { label: "Book Appointment", completed: false }
      ]
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || "Error fetching dashboard stats" 
    });
  }
};

module.exports = {
  getDashboardStats
};