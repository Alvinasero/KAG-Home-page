const express = require('express');
const router = express.Router();
const galleryController = require('../Controllers/galleryController');
const { authenticateToken } = require('../Middleware/authMiddleware'); // Assuming authMiddleware
const { uploadSingle, IMAGE_MIME_TYPES, MAX_IMAGE_SIZE } = require('../Middleware/uploadMiddleware'); // Assuming uploadMiddleware

router.get('/', galleryController.getAllGalleryItems);
router.post('/admin', authenticateToken, uploadSingle('image', { allowedMimeTypes: IMAGE_MIME_TYPES, maxFileSize: MAX_IMAGE_SIZE }), galleryController.createGalleryItem);
router.delete('/admin/:id', authenticateToken, galleryController.deleteGalleryItem);

module.exports = router;