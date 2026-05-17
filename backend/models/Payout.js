// ============================================================
//  models/Payout.js — RAO Travels Payout Model
// ============================================================

const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['unpaid', 'paid'],
        default: 'unpaid'
    },
    paidAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Payout', payoutSchema);
