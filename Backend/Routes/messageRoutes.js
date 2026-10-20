const express = require('express');
const router = express.Router();
const messageController = require('../Controllers/messageController');
const { authenticateToken } = require('../Middleware/authMiddleware'); // Assuming authMiddleware

router.post('/', messageController.submitMessage); // Public contact form
router.get('/admin', authenticateToken, messageController.getAllMessages);
router.put('/admin/:id/read', authenticateToken, messageController.markMessageAsRead);
router.delete('/admin/:id', authenticateToken, messageController.deleteMessage);

module.exports = router;