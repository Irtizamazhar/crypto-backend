// routes/sales.js
const express = require('express');
const router  = express.Router();
const { createSale, getAllSales } = require('../controllers/salesController');
const { verifyTokenRequired } = require('../middlewares/JWTAuth');

// Create a new sale
router.post(
  '/',
  verifyTokenRequired,
  createSale
);

// (optional) List all sales
router.get(
  '/',
  verifyTokenRequired,
  getAllSales
);

module.exports = router;
