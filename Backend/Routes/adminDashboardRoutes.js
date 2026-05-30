const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/adminController');
const { authenticateToken } = require('../Middleware/authMiddleware');

// Protected route for admin overview stats
router.get('/overview', authenticateToken, adminController.getDashboardStats);

module.exports = router;