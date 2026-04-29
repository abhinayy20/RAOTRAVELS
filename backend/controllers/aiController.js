const OpenAI = require('openai');
const Tour   = require('../models/Tour');

// Lazy-init so missing key doesn't crash the whole server
let openai;
const getClient = () => {
    if (!openai) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set in environment variables.');
        }
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openai;
};

const formatPrice = (p) => '₹' + Number(p).toLocaleString('en-IN');

// @desc    AI Travel Assistant chat
// @route   POST /api/ai/chat
// @access  Public
const chat = async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, reply: 'Please provide a message.' });
        }

        // --- Fetch live tours from DB to ground the AI in real data ---
        let toursContext = '';
        try {
            const tours = await Tour.find({}, 'title location category price duration description').limit(30);
            if (tours.length > 0) {
                const tourLines = tours.map(t =>
                    `• ${t.title} | ${t.location} | ${t.category} | ${formatPrice(t.price)} | ${t.duration}`
                ).join('\n');
                toursContext = `\n\nAVAILABLE TOURS (from our database — use these for suggestions):\n${tourLines}`;
            }
        } catch (dbErr) {
            console.warn('Could not fetch tours for AI context:', dbErr.message);
        }

        // --- System prompt ---
        const systemPrompt = `You are Riya, a friendly and knowledgeable AI travel assistant for RAO Travels — a premium Indian travel agency.

Your role:
- Help users discover and choose the right tour packages
- Suggest tours based on their budget, location preference, or travel style
- Keep responses concise, friendly, and helpful (2–4 sentences max unless listing tours)
- Always refer to tours from the provided list when making suggestions
- Format tour suggestions clearly: Name, Location, Price, Duration
- If asked about booking, guide them to click "Book Now" on the package details page
- If no tour matches, suggest they contact RAO Travels on WhatsApp: +91 79858 15601
- Do NOT make up tours that aren't in the list
- Respond in English by default; switch to Hindi if the user writes in Hindi
${toursContext}`;

        // --- Build message history for context ---
        const messages = [
            { role: 'system', content: systemPrompt },
            // Include up to last 6 messages for context
            ...history.slice(-6).map(h => ({
                role: h.role,
                content: h.content
            })),
            { role: 'user', content: message.trim() }
        ];

        // --- Call OpenAI ---
        const client   = getClient();
        const response = await client.chat.completions.create({
            model:       'gpt-4o-mini',
            messages,
            max_tokens:  400,
            temperature: 0.7,
        });

        const reply = response.choices[0]?.message?.content?.trim()
            || 'Sorry, I could not generate a response. Please try again!';

        res.status(200).json({ success: true, reply });

    } catch (error) {
        console.error('AI chat error:', error.message);

        // Friendly error if API key is missing
        if (error.message.includes('OPENAI_API_KEY')) {
            return res.status(500).json({
                success: false,
                reply: 'AI assistant is not configured yet. Please contact us on WhatsApp: +91 79858 15601'
            });
        }

        res.status(500).json({
            success: false,
            reply: 'I\'m having trouble right now. Please try again in a moment or contact us on WhatsApp!'
        });
    }
};

module.exports = { chat };
