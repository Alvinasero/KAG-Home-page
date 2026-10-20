const express = require('express');
const router = express.Router();
const testimonialController = require('../Controllers/testimonialController');
const { authenticateToken } = require('../Middleware/authMiddleware'); // Assuming authMiddleware

router.get('/', testimonialController.getApprovedTestimonials); // Publicly visible
router.post('/', testimonialController.submitTestimonial); // Public submission
router.get('/admin', authenticateToken, testimonialController.getAllTestimonials); // Admin can see all
router.put('/admin/:id/status', authenticateToken, testimonialController.updateTestimonialStatus); // Admin approves
router.delete('/admin/:id', authenticateToken, testimonialController.deleteTestimonial);

module.exports = router;