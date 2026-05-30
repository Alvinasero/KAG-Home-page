const express = require('express');
const router = express.Router();
const ministryController = require('../Controllers/ministryController');
const { authenticateToken } = require('../Middleware/authMiddleware'); // Assuming authMiddleware

router.get('/', ministryController.getAllMinistries);
router.get('/:id', ministryController.getMinistryById);
router.post('/admin', authenticateToken, ministryController.createMinistry);
router.put('/admin/:id', authenticateToken, ministryController.updateMinistry);
router.delete('/admin/:id', authenticateToken, ministryController.deleteMinistry);

module.exports = router;