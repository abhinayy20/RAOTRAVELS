const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const vendorSchema = new mongoose.Schema({
    // Basic Info
    fullName: {
        type: String,
        required: [true, 'Full name is required']
    },
    companyName: {
        type: String,
        required: [true, 'Company name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false  // Don't return password by default in queries
    },
    
    // Business Info
    specialization: {
        type: String,
        enum: ['Adventure', 'Honeymoon', 'Group', 'Family', 'Luxury', 'Cultural', 'Budget', 'Other'],
        default: 'Other'
    },
    region: {
        type: String,
        required: [true, 'Region is required'],
        enum: ['North', 'South', 'East', 'West', 'Northeast', 'Central', 'All India']
    },
    
    // Status & Approval
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    activeStatus: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'inactive'  // inactive until approved
    },
    rejectionReason: {
        type: String,
        default: ''
    },
    
    // Commission & Payout
    commissionRate: {
        type: Number,
        default: 80,  // Default 80% commission
        min: [0, 'Commission rate cannot be negative'],
        max: [100, 'Commission rate cannot exceed 100']
    },
    payoutInfo: {
        bankName: {
            type: String,
            default: ''
        },
        accountHolder: {
            type: String,
            default: ''
        },
        accountNumber: {
            type: String,
            default: ''
        },
        ifscCode: {
            type: String,
            default: ''
        },
        upiId: {
            type: String,
            default: ''
        }
    },
    
    // Platform Info
    role: {
        type: String,
        default: 'vendor'
    },
    totalBookingsHandled: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be negative'],
        max: [5, 'Rating cannot exceed 5']
    },
    totalEarnings: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Hash password before saving
vendorSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare entered password with hashed password in DB
vendorSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Vendor', vendorSchema);
