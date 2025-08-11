const { Service } = require("../models");

// ✅ Create Service
const createService = async (req, res) => {
  try {
    const {
      name,
      category,
      subCategory,
      price,
      duration,
      commission,
      linkedProducts,
    } = req.body;

    if (!name || !price || !duration || !commission) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const service = await Service.create({
      name,
      category,
      subCategory,
      price,
      duration,
      commission,
      linkedProducts,
    });

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ✅ Get All Services
const getAllServices = async (req, res) => {
  try {
    const services = await Service.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const updateService = async (req, res) => {
  const { id } = req.params;
  try {
    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const {
      name,
      category,
      subCategory,
      price,
      duration,
      commission,
      linkedProducts,
    } = req.body;

    await service.update({
      name,
      category,
      subCategory,
      price,
      duration,
      commission,
      linkedProducts,
    });

    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// ✅ Delete Service
const deleteService = async (req, res) => {
  const { id } = req.params;
  try {
    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    await service.destroy();

    res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  createService,
  getAllServices,
  updateService,
  deleteService,
};
