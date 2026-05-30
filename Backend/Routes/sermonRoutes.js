const express = require('express');
const router = express.Router();
const sermonController = require('../Controllers/sermonController');
const { authenticateToken } = require('../Middleware/authMiddleware'); // Assuming authMiddleware
const { uploadSingle, VIDEO_MIME_TYPES, MAX_VIDEO_SIZE } = require('../Middleware/uploadMiddleware'); // Assuming uploadMiddleware

router.get('/', sermonController.getAllSermons);
router.get('/:id', sermonController.getSermonById);
router.post('/admin', authenticateToken, uploadSingle('video', { allowedMimeTypes: VIDEO_MIME_TYPES, maxFileSize: MAX_VIDEO_SIZE }), sermonController.createSermon);
router.put('/admin/:id', authenticateToken, uploadSingle('video', { allowedMimeTypes: VIDEO_MIME_TYPES, maxFileSize: MAX_VIDEO_SIZE, optional: true }), sermonController.updateSermon); // Optional upload for update
router.delete('/admin/:id', authenticateToken, sermonController.deleteSermon);

module.exports = router;