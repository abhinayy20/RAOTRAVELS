const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a tour title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    price: {
        type: Number,
        required: [true, 'Please add a price']
    },
    location: {
        type: String,
        required: [true, 'Please add a location']
    },
    duration: {
        type: String,
        required: [true, 'Please add a duration (e.g., 5 Days / 4 Nights)']
    },
    images: {
        type: [String],
        required: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    category: {
        type: String,
        enum: ['Group', 'Honeymoon', 'Adventure', 'Family', 'Standard', 'Luxury'],
        default: 'Standard'
    },
    rating: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot be more than 5'],
        default: 4.5
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Tour', tourSchema);
