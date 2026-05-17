const express = require('express');
const { chat, generateItinerary } = require('../controllers/aiController');

const router = express.Router();

// POST /api/ai/chat
router.post('/chat', chat);

// POST /api/ai/planner
router.post('/planner', generateItinerary);

module.exports = router;
