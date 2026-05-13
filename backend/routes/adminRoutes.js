const express = require('express');
const {
    adminLogin,
    verifyToken,
    getVendors,
    approveBooking,
    rejectBooking,
    assignVendor
} = require('../controllers/adminController');
const protect = require('../middleware/auth');

const router = express.Router();

// Public
router.post('/login', adminLogin);

// Protected — used by frontend to check if token is still valid
router.get('/verify', protect, verifyToken);

// Vendor list for assignment dropdown
router.get('/vendors', protect, getVendors);

// Booking workflow
router.put('/bookings/:id/approve',       protect, approveBooking);
router.put('/bookings/:id/reject',        protect, rejectBooking);
router.put('/bookings/:id/assign-vendor', protect, assignVendor);

module.exports = router;
