// ============================================================
//  config.js — Central API configuration
//  Change the LIVE URL after deploying your backend to Render
// ============================================================

const CONFIG = {
    // ✅ Live backend on Render — local dev falls back to localhost:5000
    API_BASE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : 'https://raotravels-backend.onrender.com'
};
