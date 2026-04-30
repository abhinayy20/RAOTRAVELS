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

module.exports = { chat };
