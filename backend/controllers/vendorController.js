const Booking = require('../models/Booking');

// @desc    Accept booking
// @route   PUT /api/vendor/bookings/:id/accept
// @access  Public (Simulation)
const acceptBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { vendorStatus: 'accepted', status: 'confirmed' },
            { new: true, runValidators: true }
        );
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        res.status(200).json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Reject booking
// @route   PUT /api/vendor/bookings/:id/reject
// @access  Public (Simulation)
const rejectBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { vendorStatus: 'rejected' },
            { new: true, runValidators: true }
        );
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        res.status(200).json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get all bookings for vendor
// @route   GET /api/vendor/bookings
// @access  Public (Simulation)
const getVendorBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().populate('tourId', 'title');
        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = { acceptBooking, rejectBooking, getVendorBookings };
