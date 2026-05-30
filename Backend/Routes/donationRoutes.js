const express = require('express');
const router = express.Router();
const donationController = require('../Controllers/donationController');
const { authenticateToken } = require('../Middleware/authMiddleware'); // Assuming authMiddleware

router.post('/', donationController.createDonation); // Public donation submission
router.get('/my-history', authenticateToken, donationController.getMyDonations); // Member personal history
router.get('/admin', authenticateToken, donationController.getAllDonations);
router.put('/admin/:id/status', authenticateToken, donationController.updateDonationStatus);
router.delete('/admin/:id', authenticateToken, donationController.deleteDonation);

module.exports = router;