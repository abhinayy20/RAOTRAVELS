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

// @desc    Get bookings assigned to the authenticated vendor
// @route   GET /api/vendor/bookings
// @access  Vendor Private
const getVendorBookings = async (req, res) => {
    try {
        // Extract vendor ID from Authorization header token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Not authorized — no token' });
        }

        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ success: false, message: 'Not authorized — invalid token' });
        }

        // Only fetch bookings assigned to this vendor
        const bookings = await Booking.find({ assignedVendorId: decoded.id })
            .populate('tourId', 'title location images price');

        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Vendor accepts a booking assigned to them
// @route   PUT /api/vendor/bookings/:id/accept
// @access  Vendor Private
const acceptBooking = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);

        // Ensure the booking belongs to this vendor
        const booking = await Booking.findOne({ _id: req.params.id, assignedVendorId: decoded.id });
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found or not assigned to you' });
        }

        const updated = await Booking.findByIdAndUpdate(
            req.params.id,
            { vendorStatus: 'accepted', status: 'confirmed' },
            { new: true, runValidators: true }
        );
        res.status(200).json({ success: true, booking: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Vendor rejects a booking assigned to them
// @route   PUT /api/vendor/bookings/:id/reject
// @access  Vendor Private
const rejectBooking = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);

        const booking = await Booking.findOne({ _id: req.params.id, assignedVendorId: decoded.id });
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found or not assigned to you' });
        }

        const updated = await Booking.findByIdAndUpdate(
            req.params.id,
            { vendorStatus: 'rejected' },
            { new: true, runValidators: true }
        );
        res.status(200).json({ success: true, booking: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Vendor updates booking trip status
// @route   PUT /api/vendor/update-status/:id
// @access  Vendor Private
const updateVendorStatus = async (req, res) => {
    try {
        const { vendorStatus } = req.body;

        if (!['accepted', 'rejected'].includes(vendorStatus)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const updateData = { vendorStatus };
        if (vendorStatus === 'accepted') {
            updateData.status = 'confirmed';
        }

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            updateData,
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

module.exports = { registerVendor, loginVendor, acceptBooking, rejectBooking, updateVendorStatus, getVendorBookings };
