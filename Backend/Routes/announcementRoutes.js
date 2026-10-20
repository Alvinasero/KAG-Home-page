const express = require('express');
const router = express.Router();
const announcementController = require('../Controllers/announcementController');
const { authenticateToken } = require('../Middleware/authMiddleware'); // Assuming authMiddleware

router.get('/', announcementController.getAllAnnouncements);
router.post('/admin', authenticateToken, announcementController.createAnnouncement);
router.put('/admin/:id', authenticateToken, announcementController.updateAnnouncement);
router.delete('/admin/:id', authenticateToken, announcementController.deleteAnnouncement);

module.exports = router;