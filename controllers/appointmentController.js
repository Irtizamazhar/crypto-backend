const { Service,Appointment, Customer, Staff } = require("../models");

// ✅ Create Appointment
const createAppointment = async (req, res) => {
  try {
    const {
      customer_id,
      staff_id,
      appointment_date,
      start_time,
      end_time,
      service_id,  // Use service_id instead of service
      status,
    } = req.body;

    // Check if the service_id exists in the services table
    const serviceExists = await Service.findByPk(service_id); // Find the service by primary key (ID)
    if (!serviceExists) {
      return res.status(400).json({
        success: false,
        message: "Service not found, please select a valid service.",
      });
    }

    // Create the appointment with the correct service_id
    const appointment = await Appointment.create({
      customer_id,
      staff_id,
      appointment_date,
      start_time,
      end_time,
      service_id, // Store service_id instead of service
      status: status || "scheduled",  // If status is not provided, default to "scheduled"
    });

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


// ✅ Get All Appointments with Customer and Staff Info
const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      include: [
        { 
          model: Customer, 
          as: 'customer', // Must match association alias
          attributes: ["id", "full_name"] 
        },
        { 
          model: Staff, 
          as: 'staff', // Must match association alias
          attributes: ["id", "full_name", "role"] 
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error",
      error: error.message // Include error message for debugging
    });
  }
};

// ✅ Update Appointment
const updateAppointment = async (req, res) => {
  const { id } = req.params;
  try {
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    await appointment.update(req.body);

    res.status(200).json({
      success: true,
      message: "Appointment updated",
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ✅ Delete Appointment
const deleteAppointment = async (req, res) => {
  const { id } = req.params;
  try {
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    await appointment.destroy();

    res.status(200).json({
      success: true,
      message: "Appointment deleted",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  createAppointment,
  getAllAppointments,
  updateAppointment,
  deleteAppointment,
};
