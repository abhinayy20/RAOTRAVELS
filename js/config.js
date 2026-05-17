// ============================================================
//  config.js — Central API configuration
//  Change the LIVE URL after deploying your backend to Render
// ============================================================

const CONFIG = {
    // ✅ Central dynamic API configuration
    API_BASE: (() => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5000';
        }
        if (window.location.protocol === 'file:') {
            return 'https://raotravels-backend.onrender.com';
        }
        // Co-located production deployments (e.g. Docker, Kubernetes, Nginx proxies)
        return window.location.origin;
    })()
};
