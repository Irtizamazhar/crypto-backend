// controllers/parkedSalesController.js
'use strict';

const { ParkedSale, Customer, Staff } = require('../models');

/**
 * @desc    Create a new parked sale
 * @route   POST /api/parked-sales
 * @access  Private
 */
// controllers/parkedSalesController.js
const createParkedSale = async (req, res) => {
  try {
    const { 
      customer_id, 
      staff_id,
      items,
      subtotal,
      discount,
      tip,
      total
    } = req.body;

    // Validate required fields
    if (!staff_id) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID is required'
      });
    }

    // Validate items structure
    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items must be an array'
      });
    }

    const parkedSale = await ParkedSale.create({
      customer_id: customer_id || null,
      staff_id: staff_id,
      items: items,
      subtotal: subtotal || 0,
      discount: discount || 0,
      tip: tip || 0,
      total: total || 0
    });

    // Include associated data in response
    const populatedSale = await ParkedSale.findByPk(parkedSale.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Staff, as: 'staff' }
      ]
    });

    return res.status(201).json({
      success: true,
      data: populatedSale
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.errors?.[0]?.message || 'Internal Server Error'
    });
  }
};
/**
 * @desc    Get all parked sales
 * @route   GET /api/parked-sales
 * @access  Private
 */
const getAllParkedSales = async (req, res) => {
  try {
    const parkedSales = await ParkedSale.findAll({
      include: [
        { 
          model: Customer,
          as: 'customer',
          attributes: ['id', 'full_name', 'phone_number']
        },
        {
          model: Staff,
          as: 'staff',
          attributes: ['id', 'full_name', 'role']
        }
      ],
      order: [['created_at', 'DESC']]  // Use created_at instead of createdAt
    });

    return res.json({
      success: true,
      data: parkedSales
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};
/**
 * @desc    Delete a parked sale
 * @route   DELETE /api/parked-sales/:id
 * @access  Private
 */
const deleteParkedSale = async (req, res) => {
  try {
    const { id } = req.params;

    const parkedSale = await ParkedSale.findByPk(id);
    if (!parkedSale) {
      return res.status(404).json({
        success: false,
        message: 'Parked sale not found'
      });
    }

    await parkedSale.destroy();

    return res.json({
      success: true,
      data: {
        message: 'Parked sale deleted successfully'
      }
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

/**
 * @desc    Restore a parked sale to active cart
 * @route   POST /api/parked-sales/:id/restore
 * @access  Private
 */
const restoreParkedSale = async (req, res) => {
  try {
    const { id } = req.params;

    const parkedSale = await ParkedSale.findByPk(id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Staff, as: 'staff' }
      ]
    });

    if (!parkedSale) {
      return res.status(404).json({
        success: false,
        message: 'Parked sale not found'
      });
    }

    // Return the parked sale data to be restored
    return res.json({
      success: true,
      data: {
        items: parkedSale.items,
        customer: parkedSale.customer,
        staff: parkedSale.staff,
        discount: parkedSale.discount,
        tip: parkedSale.tip
      }
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

module.exports = {
  createParkedSale,
  getAllParkedSales,
  deleteParkedSale,
  restoreParkedSale
};