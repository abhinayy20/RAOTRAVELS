const Booking = require('../models/Booking');
const Tour = require('../models/Tour');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Public
const createBooking = async (req, res) => {
    try {
        const { name, email, phone, tourId, date, travelers } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !tourId || !date || !travelers) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: name, email, phone, tourId, date, travelers'
            });
        }

        // Verify tour exists and get price
        const tour = await Tour.findById(tourId);
        if (!tour) {
            return res.status(404).json({ success: false, message: 'Tour not found' });
        }

        const totalPrice = tour.price * Number(travelers);

        const booking = await Booking.create({
            name,
            email,
            phone,
            tourId,
            date,
            travelers: Number(travelers),
            totalPrice
        });

        res.status(201).json({
            success: true,
            bookingId: booking._id,
            data: booking
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Booking failed',
            error: error.message
        });
    }
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Public (should be admin-protected in production)
const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().populate('tourId', 'title price location');
        res.status(200).json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Public
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('tourId', 'title price location duration');
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        res.status(200).json({ success: true, data: booking });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id
// @access  Admin
const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Pending', 'Confirmed', 'Cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('tourId', 'title price location');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        res.status(200).json({ success: true, data: booking });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Update failed', error: error.message });
    }
};

module.exports = {
    createBooking,
    getBookings,
    getBookingById,
    updateBookingStatus
};
