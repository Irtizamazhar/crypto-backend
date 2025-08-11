const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

// Add a new service
router.post('/', serviceController.createService);

// Get all services
router.get('/', serviceController.getAllServices);
router.put('/:id', serviceController.updateService);

// Delete a service by ID
router.delete('/:id', serviceController.deleteService); // ✅ FIXED path

module.exports = router;
