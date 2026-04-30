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
    assignedVendor: {
        type: String,
        default: ''
    },

    // Admin who acted on the booking
    adminNotes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
