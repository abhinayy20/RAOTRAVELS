const express = require('express');
const { acceptBooking, rejectBooking, getVendorBookings } = require('../controllers/vendorController');

const router = express.Router();

router.get('/bookings', getVendorBookings);
router.put('/bookings/:id/accept', acceptBooking);
router.put('/bookings/:id/reject', rejectBooking);

module.exports = router;
