const express = require('express');
const {
    createBooking,
    getBookings,
    getBookingById,
    adminAction,
    vendorAction,
    updateBookingStatus
} = require('../controllers/bookingController');

const protect = require('../middleware/auth');

const router = express.Router();

// Standard CRUD
router.route('/')
    .get(protect, getBookings)
    .post(createBooking);

router.route('/:id')
    .get(getBookingById)
    .put(protect, updateBookingStatus);

// Workflow actions
router.put('/:id/admin-action', protect, adminAction);
router.put('/:id/vendor-action', vendorAction); // vendor auth can be added later

module.exports = router;
