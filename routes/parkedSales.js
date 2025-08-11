// routes/parkedSales.js
'use strict';

const express = require('express');
const router = express.Router();
const { 
  createParkedSale, 
  getAllParkedSales, 
  deleteParkedSale,
  restoreParkedSale
} = require('../controllers/parkedSalesController');
const { verifyTokenRequired } = require('../middlewares/JWTAuth');

/**
 * @route   POST /api/parked-sales
 * @desc    Create a new parked sale
 * @access  Private
 */
router.post(
  '/', 
  verifyTokenRequired,
  createParkedSale
);

/**
 * @route   GET /api/parked-sales
 * @desc    Get all parked sales
 * @access  Private
 */
router.get(
  '/',
  verifyTokenRequired,
  getAllParkedSales
);

/**
 * @route   DELETE /api/parked-sales/:id
 * @desc    Delete a parked sale
 * @access  Private
 */
router.delete(
  '/:id',
  verifyTokenRequired,
  deleteParkedSale
);

/**
 * @route   POST /api/parked-sales/:id/restore
 * @desc    Restore a parked sale to active cart
 * @access  Private
 */
router.post(
  '/:id/restore',
  verifyTokenRequired,
  restoreParkedSale
);

module.exports = router;