const express = require('express');
const { generateTravelPlan } = require('../controllers/geminiController');

const router = express.Router();

// POST /api/ai/travel-plan
router.post('/travel-plan', generateTravelPlan);

module.exports = router;
