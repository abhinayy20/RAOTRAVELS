const openai = require('../config/openai');

// @desc    AI Travel Assistant chat
// @route   POST /api/ai/chat
// @access  Public
const chat = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.json({ reply: 'Please provide a message.' });
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a professional travel assistant for RAO Travels. Suggest travel packages based on budget, destination, and duration.' },
                { role: 'user', content: message.trim() }
            ]
        });

        const reply = response.choices[0]?.message?.content?.trim();
        res.json({ reply });

    } catch (error) {
        console.error('OpenAI Error:', error.message);
        res.json({ reply: 'AI is currently unavailable, please try again later.' });
    }
};

// @desc    Generate a custom AI travel itinerary
// @route   POST /api/ai/planner
// @access  Public
const generateItinerary = async (req, res) => {
    try {
        const { destination, budget, days, interests } = req.body;

        if (!destination || !budget || !days) {
            return res.status(400).json({ success: false, message: 'Please provide destination, budget, and days.' });
        }

        const prompt = `You are an expert travel planner for RAO Travels.
Generate a premium, detailed, custom travel itinerary for a trip to: ${destination}.
Duration: ${days} days.
Total Budget: ₹${budget} (Indian Rupees).
Interests/Preferences: ${interests || 'General sightseeing, local food, culture'}.

Please return a structured JSON object with the following fields:
{
  "destination": "${destination}",
  "days": ${days},
  "budget": "₹${budget}",
  "overview": "A short, engaging, premium introduction to the custom trip.",
  "itinerary": [
    {
      "day": 1,
      "title": "Day Title",
      "activities": [
        "Activity 1 detail with location and description",
        "Activity 2 detail with location and description"
      ],
      "tips": "Local travel tips, budget guidelines, or dining recommendations for this day."
    }
  ],
  "hotels": [
    {
      "name": "Suggested Hotel Name",
      "type": "Luxury / Mid-range / Budget",
      "priceRange": "₹X,XXX - ₹Y,YYY per night",
      "reason": "Why this hotel is recommended based on the user's budget and interests."
    }
  ],
  "attractions": [
    {
      "name": "Attraction/Place Name",
      "description": "What to see, duration, entry fee details."
    }
  ],
  "budgetAllocation": {
    "accommodation": "Estimated percentage (e.g., 35%)",
    "foodAndDining": "Estimated percentage (e.g., 25%)",
    "transport": "Estimated percentage (e.g., 20%)",
    "sightseeingAndActivities": "Estimated percentage (e.g., 15%)",
    "shoppingAndMisc": "Estimated percentage (e.g., 5%)"
  }
}

Return ONLY the valid parseable JSON. Do not include markdown code blocks.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a professional travel planner API that strictly returns valid JSON output without any conversational prefix or suffix.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const rawContent = response.choices[0]?.message?.content?.trim();
        const plan = JSON.parse(rawContent);

        res.json({ success: true, data: plan });

    } catch (error) {
        console.error('AI Planner Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to generate custom travel plan. AI is currently overloaded.' });
    }
};

module.exports = { chat, generateItinerary };
