const express = require('express');
const router = express.Router();
const blogController = require('../Controllers/blogController');
const { authenticateToken } = require('../Middleware/authMiddleware'); // Assuming authMiddleware

router.get('/', blogController.getAllBlogPosts);
router.get('/:id', blogController.getBlogPostById);
router.post('/admin', authenticateToken, blogController.createBlogPost);
router.put('/admin/:id', authenticateToken, blogController.updateBlogPost);
router.delete('/admin/:id', authenticateToken, blogController.deleteBlogPost);

module.exports = router;