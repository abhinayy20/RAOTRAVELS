const express = require('express');
const { adminLogin, verifyToken, approveBooking, rejectBooking } = require('../controllers/adminController');
const protect = require('../middleware/auth');

const router = express.Router();

// Public
router.post('/login', adminLogin);

// Protected — used by frontend to check if token is still valid
router.get('/verify', protect, verifyToken);

// Booking workflow
router.put('/bookings/:id/approve', protect, approveBooking);
router.put('/bookings/:id/reject', protect, rejectBooking);

module.exports = router;
