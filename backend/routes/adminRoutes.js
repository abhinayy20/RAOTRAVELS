const express = require('express');
const { adminLogin, verifyToken } = require('../controllers/adminController');
const protect = require('../middleware/auth');

const router = express.Router();

// Public
router.post('/login', adminLogin);

// Protected — used by frontend to check if token is still valid
router.get('/verify', protect, verifyToken);

module.exports = router;
