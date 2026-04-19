const express = require('express');
const { createBooking, getBookings, getBookingById, updateBookingStatus } = require('../controllers/bookingController');

const router = express.Router();

router.route('/')
    .get(getBookings)
    .post(createBooking);

router.route('/:id')
    .get(getBookingById)
    .put(updateBookingStatus);

module.exports = router;
