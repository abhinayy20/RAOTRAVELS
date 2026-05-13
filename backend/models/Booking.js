const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add your name']
    },
    email: {
        type: String,
        required: [true, 'Please add your email'],
        match: [/^\S+@\S+\.\S+$/, 'Please add a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Please add your phone number']
    },
    tourId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour',
        required: [true, 'Tour ID is required']
    },
    date: {
        type: Date,
        required: [true, 'Please select a travel date']
    },
    travelers: {
        type: Number,
        required: [true, 'Please specify number of travelers'],
        min: [1, 'At least 1 traveler required']
    },
    totalPrice: {
        type: Number
    },

    // ---- Workflow Status Fields ----
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'confirmed'],
        default: 'pending'
    },
    vendorStatus: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },

    // ---- Vendor Assignment (proper ObjectId reference) ----
    assignedVendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        default: null
    },
    assignedVendorName: {
        type: String,
        default: ''
    },
    // Kept for backward-compat with any existing data
    assignedVendor: {
        type: String,
        default: ''
    },

    // ---- Commission Breakdown (80/20 split) ----
    vendorCommission: {
        type: Number,
        default: 0  // 80% of totalPrice
    },
    platformCommission: {
        type: Number,
        default: 0  // 20% of totalPrice
    },
    payoutStatus: {
        type: String,
        enum: ['unpaid', 'paid'],
        default: 'unpaid'
    },

    // ---- Trip Lifecycle ----
    tripStatus: {
        type: String,
        enum: ['not_started', 'ongoing', 'completed', 'cancelled'],
        default: 'not_started'
    },
    assignedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    },

    // Admin notes
    adminNotes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
