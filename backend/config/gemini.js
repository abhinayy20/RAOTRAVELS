const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Google Gemini SDK using the GEMINI_API_KEY environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

module.exports = genAI;
