const express = require('express');
const { registerVendor, loginVendor, acceptBooking, rejectBooking, updateVendorStatus, getVendorBookings } = require('../controllers/vendorController');

const router = express.Router();

router.post('/register', registerVendor);
router.post('/login', loginVendor);
router.get('/bookings', getVendorBookings);
router.put('/bookings/:id/accept', acceptBooking);
router.put('/bookings/:id/reject', rejectBooking);
router.put('/update-status/:id', updateVendorStatus);

module.exports = router;
