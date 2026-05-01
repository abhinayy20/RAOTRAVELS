const express = require('express');
const { registerVendor, loginVendor, acceptBooking, rejectBooking, getVendorBookings } = require('../controllers/vendorController');

const router = express.Router();

router.post('/register', registerVendor);
router.post('/login', loginVendor);
router.get('/bookings', getVendorBookings);
router.put('/bookings/:id/accept', acceptBooking);
router.put('/bookings/:id/reject', rejectBooking);

module.exports = router;
