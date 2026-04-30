const Booking = require('../models/Booking');
const Tour = require('../models/Tour');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Public
const createBooking = async (req, res) => {
    try {
        const { name, email, phone, tourId, date, travelers } = req.body;

        if (!name || !email || !phone || !tourId || !date || !travelers) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: name, email, phone, tourId, date, travelers'
            });
        }

        const tour = await Tour.findById(tourId);
        if (!tour) {
            return res.status(404).json({ success: false, message: 'Tour not found' });
        }

        const totalPrice = tour.price * Number(travelers);

        const booking = new Booking({
            name,
            email,
            phone,
            tourId,
            date,
            travelers: Number(travelers),
            totalPrice,
            status: 'pending',
            vendorStatus: 'pending',
            assignedVendor: ''
        });
        await booking.save();

        res.status(201).json({
            success: true,
            bookingId: booking._id,
            data: booking
        });

    } catch (error) {
        res.status(400).json({ success: false, message: 'Booking failed', error: error.message });
    }
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Admin
const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('tourId', 'title price location')
            .sort({ createdAt: -1 });
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
        const booking = await Booking.findById(req.params.id)
            .populate('tourId', 'title price location duration');
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

// @desc    Admin approves or rejects a booking
// @route   PUT /api/bookings/:id/admin-action
// @access  Admin
const adminAction = async (req, res) => {
    try {
        const { action, assignedVendor, adminNote } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid action. Use "approve" or "reject".' });
        }

        const update = {
            status: action === 'approve' ? 'approved' : 'rejected',
            adminNotes: adminNote || '',
        };

        // Assign vendor only on approval
        if (action === 'approve' && assignedVendor) {
            update.assignedVendor = assignedVendor;
            update.vendorStatus = 'pending'; // reset vendor status on re-approval
        }

        const booking = await Booking.findByIdAndUpdate(req.params.id, update, { new: true })
            .populate('tourId', 'title price location');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.status(200).json({
            success: true,
            message: `Booking ${update.status} by admin.`,
            data: booking
        });

    } catch (error) {
        res.status(400).json({ success: false, message: 'Action failed', error: error.message });
    }
};

// @desc    Vendor accepts or rejects an assigned booking
// @route   PUT /api/bookings/:id/vendor-action
// @access  Vendor (public for now, can add vendor auth later)
const vendorAction = async (req, res) => {
    try {
        const { action } = req.body;

        if (!['accept', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid action. Use "accept" or "reject".' });
        }

        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (booking.status !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Vendor can only act on Admin-Approved bookings.'
            });
        }

        const vendorStatus = action === 'accept' ? 'accepted' : 'rejected';
        // If vendor accepts → Confirmed, if rejects → stays Approved (admin can reassign)
        const newStatus = action === 'accept' ? 'confirmed' : 'approved';

        const updated = await Booking.findByIdAndUpdate(
            req.params.id,
            { vendorStatus, status: newStatus },
            { new: true }
        ).populate('tourId', 'title price location');

        res.status(200).json({
            success: true,
            message: `Vendor ${vendorStatus} the booking.`,
            data: updated
        });

    } catch (error) {
        res.status(400).json({ success: false, message: 'Vendor action failed', error: error.message });
    }
};

// @desc    Legacy: Update booking status (kept for backwards compat)
// @route   PUT /api/bookings/:id
// @access  Admin
const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'approved', 'rejected', 'confirmed', 'cancelled'].includes(status)) {
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
    adminAction,
    vendorAction,
    updateBookingStatus
};
