// ============================================================
// models/Notification.js — RAO Travels Notification Model
// ============================================================

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    type: {
      // e.g., 'booking_assigned', 'booking_accepted', 'trip_completed', 'payout_paid'
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
