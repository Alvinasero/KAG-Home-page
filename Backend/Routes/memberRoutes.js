const express = require('express');
const router = express.Router();
const memberController = require('../Controllers/memberController');
const { authenticateToken } = require('../Middleware/authMiddleware'); // Assuming authMiddleware

router.post('/', memberController.registerMember); // Public registration
router.get('/admin', authenticateToken, memberController.getAllMembers);
router.get('/admin/:id', authenticateToken, memberController.getMemberById);
router.put('/admin/:id', authenticateToken, memberController.updateMember);
router.delete('/admin/:id', authenticateToken, memberController.deleteMember);

module.exports = router;