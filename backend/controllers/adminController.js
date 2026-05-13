const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Booking = require('../models/Booking');
const Vendor = require('../models/Vendor');

// ─── Commission Constants ─────────────────────────────────────
const VENDOR_COMMISSION_RATE   = 0.80;  // 80% to vendor
const PLATFORM_COMMISSION_RATE = 0.20;  // 20% kept by platform

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const admin = await Admin.findOne({ email }).select('+password');

        if (!admin) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await admin.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: admin._id, email: admin.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            token,
            admin: {
                id: admin._id,
                email: admin.email
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Verify token (for frontend auth check)
// @route   GET /api/admin/verify
// @access  Private
const verifyToken = async (req, res) => {
    res.status(200).json({ success: true, admin: { id: req.admin.id, email: req.admin.email } });
};

// @desc    Get all registered vendors (for admin dropdown)
// @route   GET /api/admin/vendors
// @access  Private
const getVendors = async (req, res) => {
    try {
        // Return id, name, email — never password
        const vendors = await Vendor.find({}, '_id name email createdAt');
        res.status(200).json({ success: true, data: vendors });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Approve booking (no vendor assignment — just sets approved)
// @route   PUT /api/admin/bookings/:id/approve
// @access  Private
const approveBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status: 'approved' },
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
// @route   PUT /api/admin/bookings/:id/reject
// @access  Private
const rejectBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status: 'rejected' },
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

// @desc    Assign a registered vendor to a booking + calculate commission
// @route   PUT /api/admin/bookings/:id/assign-vendor
// @access  Private
const assignVendor = async (req, res) => {
    try {
        const { vendorId } = req.body;

        if (!vendorId) {
            return res.status(400).json({ success: false, message: 'vendorId is required' });
        }

        // Verify vendor exists
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        // Fetch booking to read totalPrice for commission calc
        const existingBooking = await Booking.findById(req.params.id);
        if (!existingBooking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const price = existingBooking.totalPrice || 0;
        const vendorCommission   = Math.round(price * VENDOR_COMMISSION_RATE);
        const platformCommission = Math.round(price * PLATFORM_COMMISSION_RATE);

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            {
                assignedVendorId:   vendor._id,
                assignedVendorName: vendor.name,
                assignedVendor:     vendor.name,   // backward compat
                vendorCommission,
                platformCommission,
                vendorStatus:       'pending',      // reset vendor response
                status:             'approved',     // ensure it's approved
                assignedAt:         new Date()
            },
            { new: true, runValidators: true }
        ).populate('assignedVendorId', 'name email');

        res.status(200).json({
            success: true,
            message: `Booking assigned to ${vendor.name}`,
            booking,
            commission: {
                total:    price,
                vendor:   vendorCommission,
                platform: platformCommission
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = { adminLogin, verifyToken, getVendors, approveBooking, rejectBooking, assignVendor };
