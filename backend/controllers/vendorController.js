const jwt = require('jsonwebtoken');
const Vendor = require('../models/Vendor');
const Booking = require('../models/Booking');

// @desc    Register a new vendor
// @route   POST /api/vendor/register
// @access  Public
const registerVendor = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const vendorExists = await Vendor.findOne({ email });
        if (vendorExists) {
            return res.status(400).json({ success: false, message: 'Vendor already exists' });
        }

        const vendor = await Vendor.create({ name, email, password });

        const token = jwt.sign({ id: vendor._id, role: vendor.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            success: true,
            token,
            vendor: {
                id: vendor._id,
                name: vendor.name,
                email: vendor.email,
                role: vendor.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Vendor login
// @route   POST /api/vendor/login
// @access  Public
const loginVendor = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const vendor = await Vendor.findOne({ email }).select('+password');

        if (!vendor) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await vendor.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: vendor._id, role: vendor.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            success: true,
            token,
            vendor: {
                id: vendor._id,
                name: vendor.name,
                email: vendor.email,
                role: vendor.role
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

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

module.exports = { registerVendor, loginVendor, acceptBooking, rejectBooking, getVendorBookings };
