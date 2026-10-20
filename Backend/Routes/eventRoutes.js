const express = require('express');
const router = express.Router();
const eventController = require('../Controllers/eventController');
const { authenticateToken } = require('../Middleware/authMiddleware'); // Assuming authMiddleware
const { uploadSingle, IMAGE_MIME_TYPES, MAX_IMAGE_SIZE } = require('../Middleware/uploadMiddleware'); // Assuming uploadMiddleware

router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.post('/admin', authenticateToken, uploadSingle('image_poster', { allowedMimeTypes: IMAGE_MIME_TYPES, maxFileSize: MAX_IMAGE_SIZE }), eventController.createEvent);
router.put('/admin/:id', authenticateToken, uploadSingle('image_poster', { allowedMimeTypes: IMAGE_MIME_TYPES, maxFileSize: MAX_IMAGE_SIZE, optional: true }), eventController.updateEvent); // Optional upload for update
router.delete('/admin/:id', authenticateToken, eventController.deleteEvent);

module.exports = router;