const Tour = require('../models/Tour');

// @desc    Get all tours (with optional filters)
// @route   GET /api/tours?location=&minPrice=&maxPrice=&category=
// @access  Public
const getTours = async (req, res) => {
    try {
        const { location, minPrice, maxPrice, category } = req.query;
        const filter = {};

        if (location) {
            filter.location = { $regex: location, $options: 'i' };
        }
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }
        if (category && category !== 'All') {
            filter.category = { $regex: category, $options: 'i' };
        }

        const tours = await Tour.find(filter).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: tours.length, data: tours });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get single tour by ID
// @route   GET /api/tours/:id
const getTourById = async (req, res) => {
    try {
        const tour = await Tour.findById(req.params.id);
        if (!tour) {
            return res.status(404).json({ success: false, message: 'Tour not found' });
        }
        res.status(200).json({ success: true, data: tour });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Tour not found' });
        }
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Create a new tour
// @route   POST /api/tours
const createTour = async (req, res) => {
    try {
        const tour = await Tour.create(req.body);
        res.status(201).json({ success: true, data: tour });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Invalid data', error: error.message });
    }
};

// @desc    Update a tour
// @route   PUT /api/tours/:id
const updateTour = async (req, res) => {
    try {
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!tour) {
            return res.status(404).json({ success: false, message: 'Tour not found' });
        }
        res.status(200).json({ success: true, data: tour });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Update failed', error: error.message });
    }
};

// @desc    Delete a tour
// @route   DELETE /api/tours/:id
const deleteTour = async (req, res) => {
    try {
        const tour = await Tour.findByIdAndDelete(req.params.id);
        if (!tour) {
            return res.status(404).json({ success: false, message: 'Tour not found' });
        }
        res.status(200).json({ success: true, message: 'Tour deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Delete failed', error: error.message });
    }
};

module.exports = { getTours, getTourById, createTour, updateTour, deleteTour };
