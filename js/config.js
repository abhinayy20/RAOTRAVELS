// ============================================================
//  config.js — Central API configuration
//  Change the LIVE URL after deploying your backend to Render
// ============================================================

const CONFIG = {
    // 🔽 Replace this with your Render backend URL after deployment
    //    Example: 'https://raotravels-api.onrender.com'
    API_BASE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : 'https://raotravels-api.onrender.com'  // ← UPDATE THIS after Render deploy
};
