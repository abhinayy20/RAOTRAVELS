const express = require('express');
const { getTours, getTourById, createTour, updateTour, deleteTour } = require('../controllers/tourController');

const router = express.Router();

router.route('/')
    .get(getTours)
    .post(createTour);

router.route('/:id')
    .get(getTourById)
    .put(updateTour)
    .delete(deleteTour);

module.exports = router;
