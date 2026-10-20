const express = require('express');
const router = express.Router();
const prayerController = require('../Controllers/prayerController');
const { authenticateToken } = require('../Middleware/authMiddleware'); // Assuming authMiddleware

router.post('/', prayerController.submitPrayerRequest); // Public prayer request submission
router.get('/admin', authenticateToken, prayerController.getAllPrayerRequests);
router.put('/admin/:id/status', authenticateToken, prayerController.updatePrayerStatus);
router.delete('/admin/:id', authenticateToken, prayerController.deletePrayerRequest);

module.exports = router;