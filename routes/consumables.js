// routes/consumables.js
const express = require('express');
const router  = express.Router();

const {
  getAllConsumables,
  getConsumablesByProduct
} = require('../controllers/consumableController');

const {
  verifyTokenRequired,
  isSuperAdmin,
} = require('../middlewares/JWTAuth');

// GET /api/consumables
router.get(
  '/',
  verifyTokenRequired,
  isSuperAdmin,
  getAllConsumables
);

// GET /api/consumables/by-product/:productId
router.get(
  '/by-product/:productId',
  verifyTokenRequired,
  isSuperAdmin,
  getConsumablesByProduct
);

module.exports = router;
