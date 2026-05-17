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
        // Return only approved and active vendors for assignment
        const vendors = await Vendor.find(
            { approvalStatus: 'approved', activeStatus: 'active' },
            '_id fullName companyName email phone specialization region commissionRate'
        ).sort({ fullName: 1 });
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
                assignedVendorName: vendor.fullName,
                assignedVendor:     vendor.fullName,   // backward compat
                vendorCommission,
                platformCommission,
                vendorStatus:       'pending',      // reset vendor response
                status:             'approved',     // ensure it's approved
                assignedAt:         new Date()
            },
            { new: true, runValidators: true }
        ).populate('assignedVendorId', 'fullName email phone');

        res.status(200).json({
            success: true,
            message: `Booking assigned to ${vendor.fullName}`,
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  VENDOR MANAGEMENT (Admin)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// @desc    Get all pending vendor approvals
// @route   GET /api/admin/vendors/pending
// @access  Private
const getPendingVendors = async (req, res) => {
    try {
        const vendors = await Vendor.find({ approvalStatus: 'pending' })
            .select('-password')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: vendors.length, data: vendors });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get all vendors with filters
// @route   GET /api/admin/vendors/all
// @access  Private
const getAllVendors = async (req, res) => {
    try {
        const { status, activeStatus } = req.query;
        const filter = {};
        
        if (status) filter.approvalStatus = status;
        if (activeStatus) filter.activeStatus = activeStatus;

        const vendors = await Vendor.find(filter)
            .select('-password')
            .sort({ createdAt: -1 });
        
        res.status(200).json({ success: true, count: vendors.length, data: vendors });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Approve a pending vendor
// @route   PUT /api/admin/vendors/:id/approve
// @access  Private
const approveVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            {
                approvalStatus: 'approved',
                activeStatus: 'active',
                rejectionReason: ''
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        res.status(200).json({
            success: true,
            message: `${vendor.fullName} has been approved and activated`,
            vendor
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Reject a pending vendor
// @route   PUT /api/admin/vendors/:id/reject
// @access  Private
const rejectVendor = async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ success: false, message: 'Please provide rejection reason' });
        }

        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            {
                approvalStatus: 'rejected',
                activeStatus: 'inactive',
                rejectionReason: reason
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        res.status(200).json({
            success: true,
            message: `${vendor.fullName} registration has been rejected`,
            vendor
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Deactivate/Suspend a vendor
// @route   PUT /api/admin/vendors/:id/deactivate
// @access  Private
const deactivateVendor = async (req, res) => {
    try {
        const { reason } = req.body;

        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            {
                activeStatus: 'suspended',
                rejectionReason: reason || ''
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        res.status(200).json({
            success: true,
            message: `${vendor.fullName} has been suspended`,
            vendor
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Reactivate a suspended vendor
// @route   PUT /api/admin/vendors/:id/activate
// @access  Private
const activateVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            {
                activeStatus: 'active',
                rejectionReason: ''
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        res.status(200).json({
            success: true,
            message: `${vendor.fullName} has been reactivated`,
            vendor
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Edit vendor details
// @route   PUT /api/admin/vendors/:id/edit
// @access  Private
const editVendor = async (req, res) => {
    try {
        const { specialization, region, commissionRate } = req.body;
        
        const updateData = {};
        if (specialization) updateData.specialization = specialization;
        if (region) updateData.region = region;
        if (commissionRate !== undefined) updateData.commissionRate = commissionRate;

        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        res.status(200).json({
            success: true,
            message: `${vendor.fullName} details updated`,
            vendor
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    adminLogin,
    verifyToken,
    getVendors,
    getPendingVendors,
    getAllVendors,
    approveVendor,
    rejectVendor,
    deactivateVendor,
    activateVendor,
    editVendor,
    approveBooking,
    rejectBooking,
    assignVendor
};
