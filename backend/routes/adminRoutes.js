const express = require('express');
const {
    adminLogin,
    verifyToken,
    getVendors,
    getPendingVendors,
    getAllVendors,
    approveVendor,
    rejectVendor,
    deactivateVendor,
    activateVendor,
    editVendor,
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

// ━━━ VENDOR MANAGEMENT ━━━
router.get('/vendors/pending', protect, getPendingVendors);
router.get('/vendors/all', protect, getAllVendors);
router.put('/vendors/:id/approve', protect, approveVendor);
router.put('/vendors/:id/reject', protect, rejectVendor);
router.put('/vendors/:id/deactivate', protect, deactivateVendor);
router.put('/vendors/:id/activate', protect, activateVendor);
router.put('/vendors/:id/edit', protect, editVendor);

// Booking workflow
router.put('/bookings/:id/approve',       protect, approveBooking);
router.put('/bookings/:id/reject',        protect, rejectBooking);
router.put('/bookings/:id/assign-vendor', protect, assignVendor);

module.exports = router;
