// ============================================================
//  vendor-api.js - API utility functions for vendor dashboard
// ============================================================

const API_BASE = 'https://raotravels-backend.onrender.com/api';

// Get vendor token from localStorage
const getVendorToken = () => localStorage.getItem('vendorToken');

// API call helper
const apiCall = async (endpoint, options = {}) => {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getVendorToken()}`
        }
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
};

// Get vendor's assigned bookings
const getVendorBookings = async () => {
    return apiCall('/vendor/bookings');
};

// Accept a booking
const acceptBooking = async (bookingId) => {
    return apiCall(`/vendor/bookings/${bookingId}/accept`, {
        method: 'PUT'
    });
};

// Reject a booking
const rejectBooking = async (bookingId) => {
    return apiCall(`/vendor/bookings/${bookingId}/reject`, {
        method: 'PUT'
    });
};

// Get vendor profile
const getVendorProfile = async () => {
    const token = getVendorToken();
    if (!token) throw new Error('No token found');
    
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return apiCall(`/vendor/${decoded.id}`);
};

// Logout vendor
const vendorLogout = () => {
    localStorage.removeItem('vendorToken');
    localStorage.removeItem('vendorId');
    window.location.href = 'vendor-login.html';
};

// Check if vendor is authenticated
const isVendorAuthenticated = () => {
    return !!getVendorToken();
};

// Redirect to login if not authenticated
const requireVendorAuth = () => {
    if (!isVendorAuthenticated()) {
        window.location.href = 'vendor-login.html';
    }
};
