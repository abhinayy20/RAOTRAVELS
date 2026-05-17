const genAI = require('../config/gemini');

// @desc    Generate customized travel plan via Google Gemini API
// @route   POST /api/ai/travel-plan
// @access  Public
const generateTravelPlan = async (req, res) => {
    try {
        const { destination, budget, days, travelType, interests, notes } = req.body;

        // 1. Strict Input Validation & Security checks
        if (!destination || !budget || !days || !travelType || !interests) {
            return res.status(400).json({ 
                success: false, 
                message: 'Mandatory parameters missing: destination, budget, days, travelType, and interests are required.' 
            });
        }

        const cleanDays = parseInt(days, 10);
        if (isNaN(cleanDays) || cleanDays < 1 || cleanDays > 14) {
            return res.status(400).json({ 
                success: false, 
                message: 'Trip duration must be a valid integer between 1 and 14 days.' 
            });
        }

        const cleanBudget = Number(budget);
        if (isNaN(cleanBudget) || cleanBudget < 5000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Budget must be a valid number greater than ₹5,000.' 
            });
        }

        if (!Array.isArray(interests) || interests.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Interests must be a non-empty array.' 
            });
        }

        // 2. Resilient Fallback if API Key is not configured in .env
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            console.warn('GEMINI_API_KEY is not defined or is placeholder. Triggering highly detailed local fallback...');
            const mockPlan = generateMockPlan(destination, cleanDays, cleanBudget, travelType, interests, notes);
            return res.json({ success: true, data: mockPlan, note: 'Mock generated due to unconfigured API key.' });
        }

        // 3. Google Gemini 1.5 Flash Configuration (Free-Tier Eligible)
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash',
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        // Optimize travel prompt for location relevance and structured output
        const prompt = `You are a world-class travel planning engine for RAO Travels, known for your detailed, premium, and realistic holiday blueprints.
Create a custom travel itinerary for: ${destination.trim()}.
Group Context: ${travelType} trip.
Duration: ${cleanDays} days.
Total Budget: ₹${cleanBudget.toLocaleString('en-IN')} (Indian Rupees).
Interests: ${interests.join(', ')}.
Extra Preferences: ${notes ? notes.trim() : 'None'}.

Generate a complete, professional travel plan in standard JSON matching the exact schema below:
{
  "destination": "${destination.trim()}",
  "days": ${cleanDays},
  "budget": "₹${cleanBudget.toLocaleString('en-IN')}",
  "travelType": "${travelType}",
  "overview": "A short, premium custom summary explaining why this plan is optimized for ${travelType} travelers focusing on ${interests.join(', ')}.",
  "itinerary": [
    {
      "day": 1,
      "title": "Title (e.g. Arrival & Orientation)",
      "activities": [
        "Detailed activity 1 (include recommended spots and times)",
        "Detailed activity 2 (include culinary and dining spots)"
      ],
      "tips": "Specific local advice or packing tips for this day."
    }
  ],
  "hotels": [
    {
      "name": "Recommended Hotel Name",
      "type": "Luxury / Mid-range / Budget",
      "priceRange": "₹X,XXX - ₹Y,YYY per night",
      "reason": "Why this accommodation fits the overall budget of ₹${cleanBudget.toLocaleString('en-IN')}."
    }
  ],
  "attractions": [
    {
      "name": "Attraction Name",
      "description": "What to explore, estimated ticket cost, and time allocation."
    }
  ],
  "localTransportAdvice": "Practical transport insights (metros, auto-rickshaws, private cabs) for this location.",
  "foodRecommendations": "Famous local dishes, sweets, and recommended authentic restaurants to visit.",
  "travelTips": "Essential tips regarding weather, dress code, currency details, and safety parameters.",
  "budgetAllocation": {
    "accommodation": "Estimated percentage (e.g., 35%)",
    "foodAndDining": "Estimated percentage (e.g., 25%)",
    "transport": "Estimated percentage (e.g., 20%)",
    "sightseeingAndActivities": "Estimated percentage (e.g., 15%)",
    "shoppingAndMisc": "Estimated percentage (e.g., 5%)"
  }
}

Return ONLY valid, parseable JSON matching the schema. No markdown formatting.`;

        // 4. Send Content Request
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const plan = JSON.parse(responseText.trim());

        res.json({ success: true, data: plan });

    } catch (error) {
        console.error('Google Gemini API Error:', error.message);
        // Robust safety fallback in case of rate-limiting, timeout or syntax errors
        const mockPlan = generateMockPlan(
            req.body.destination || 'Beautiful Getaway',
            parseInt(req.body.days, 10) || 5,
            Number(req.body.budget) || 50000,
            req.body.travelType || 'Solo',
            req.body.interests || ['Sightseeing'],
            req.body.notes
        );
        res.json({ success: true, data: mockPlan, note: 'Resilient mock triggered due to API exception.' });
    }
};

// Generates highly realistic fallback data tailored exactly to inputs
const generateMockPlan = (dest, days, budget, travelType, interests, notes) => {
    const cleanDest = dest.trim().replace(/^./, str => str.toUpperCase());
    const interestList = interests.join(', ');

    const mockPlan = {
        destination: cleanDest,
        days: days,
        budget: `₹${budget.toLocaleString('en-IN')}`,
        travelType: travelType,
        overview: `A premium bespoke ${days}-day itinerary crafted specifically to discover the absolute finest local treasures of ${cleanDest}. Customized for a memorable ${travelType} holiday centered around ${interestList}, this plan seamlessly matches local activities with custom comforts.`,
        itinerary: [],
        hotels: [
            {
                name: `The Grand ${cleanDest} Palace & Spa`,
                type: "Luxury / Premium",
                priceRange: "₹9,000 - ₹13,500 per night",
                reason: "Offers stunning scenic vistas, highly rated local wellness spas, and comfortable private amenities suited for a perfect getaway."
            },
            {
                name: `${cleanDest} Heritage Inn`,
                type: "Mid-range Boutique",
                priceRange: "₹4,500 - ₹7,000 per night",
                reason: "Exceptional ratings for hygiene, complimentary local breakfast options, and convenient proximity to primary tour sites."
            }
        ],
        attractions: [
            {
                name: `Iconic Vistas of ${cleanDest}`,
                description: "Vivid architectural landmark with deep historical significance and gorgeous viewing platforms. Average visit time: 2.5 hours."
            },
            {
                name: `Valley Nature Trail`,
                description: "A gorgeous pine-forested forest corridor recommended for refreshing nature photography and peaceful strolls."
            }
        ],
        localTransportAdvice: "We recommend hire-based app cabs or a pre-arranged tourist rental car for group travel. Standard local auto-rickshaws are efficient for quick, short point-to-point transit.",
        foodRecommendations: "Must try local specialty cuisine platters, traditional bakery items, and organic herbal teas. We recommend the classic dining options located in the central street market.",
        travelTips: "Ensure you keep loose cash currency handy as network coverage for online cards can be inconsistent in high valley points. Always respect local temple and cultural dress codes.",
        budgetAllocation: {
            accommodation: "40%",
            foodAndDining: "20%",
            transport: "20%",
            sightseeingAndActivities: "15%",
            shoppingAndMisc: "5%"
        }
    };

    // Construct customizable day profiles
    for (let d = 1; d <= days; d++) {
        let dayTitle = "";
        let activities = [];
        let tips = "";

        if (d === 1) {
            dayTitle = `Arrival, Check-in & Scenic Orientation`;
            activities = [
                `Receive warm greeting from your private chauffeur and transfer to your selected resort in ${cleanDest}.`,
                `Relax, unpack, and enjoy premium hospitality check-in drinks.`,
                `Take a refreshing evening stroll around clean local lanes to sample signature spiced tea and local treats.`
            ];
            tips = "Stay well hydrated during travel and avoid heavy hikes on Day 1 to adjust perfectly.";
        } else if (d === days) {
            dayTitle = `Souvenir Shopping & Farewell Departure`;
            activities = [
                `Enjoy a leisurely breakfast overlooking the majestic hills or beach fronts.`,
                `Visit custom craft emporiums to pick up local handloom products, authentic spices, and souvenir artwork.`,
                `Board your private check-out transfer leading back to the airport or railway hub.`
            ];
            tips = "Confirm all travel documents and baggage requirements before departure.";
        } else {
            dayTitle = `Immersive ${interestList} Tour`;
            activities = [
                `Depart for an engaging early morning guided tour around core local monuments and panoramic vistas.`,
                `Enjoy a traditional lunch layout featuring authentic specialties.`,
                `Participate in custom local workshops or local adventure activities tailored directly to your interest in ${interests[0]}.`,
                `Wind down with an aesthetic sunset boat ride or cultural dance show showcasing regional heritage.`
            ];
            tips = "Carry light backup jackets or umbrellas as weather patterns can change quickly.";
        }

        mockPlan.itinerary.push({
            day: d,
            title: dayTitle,
            activities: activities,
            tips: tips
        });
    }

    return mockPlan;
};

module.exports = { generateTravelPlan };
