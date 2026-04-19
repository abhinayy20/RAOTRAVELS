// ============================================================
//  admin-auth.js — Handles login form & auth token management
// ============================================================

const AUTH_API = (typeof CONFIG !== 'undefined' ? CONFIG.API_BASE : 'http://localhost:5000') + '/api/admin';

// ============================================================
//  LOGIN PAGE LOGIC (runs on admin-login.html)
// ============================================================
const loginForm = document.getElementById('login-form');

if (loginForm) {
    // If already logged in, go straight to dashboard
    const existingToken = localStorage.getItem('adminToken');
    if (existingToken) {
        window.location.href = 'admin.html';
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const errorDiv = document.getElementById('error-msg');
        const loginBtn = document.getElementById('login-btn');

        // Reset error
        errorDiv.classList.remove('show');

        // Show loading
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

        try {
            const res = await fetch(`${AUTH_API}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.message || 'Login failed');
            }

            // Store token and redirect to dashboard
            localStorage.setItem('adminToken', json.token);
            window.location.href = 'admin.html';

        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.classList.add('show');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login to Dashboard';
        }
    });
}

// ============================================================
//  AUTH GUARD (runs on admin.html)
//  Call this from admin.html to protect it
// ============================================================
async function checkAdminAuth() {
    const token = localStorage.getItem('adminToken');

    if (!token) {
        window.location.href = 'admin-login.html';
        return false;
    }

    try {
        const res = await fetch(`${AUTH_API}/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            throw new Error('Token expired');
        }

        return true;
    } catch (err) {
        localStorage.removeItem('adminToken');
        window.location.href = 'admin-login.html';
        return false;
    }
}

// Logout
function adminLogout() {
    localStorage.removeItem('adminToken');
    window.location.href = 'admin-login.html';
}
