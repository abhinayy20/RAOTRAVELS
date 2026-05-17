// ============================================================
//  vendor-dashboard.js - Vendor Dashboard Main Logic
// ============================================================

// Check authentication on page load
requireVendorAuth();

// Global state
let vendorData = null;
let bookingsData = [];

// Initialize dashboard
const initDashboard = async () => {
    try {
        const profile = await getVendorProfile();
        vendorData   = profile.data || profile;
        const bookingsResponse = await getVendorBookings();
        bookingsData = bookingsResponse.data || [];
        updateDashboard();
        initCharts();
        showSuccess('Dashboard loaded!');
    } catch (error) {
        // ── Fall back to mock data when API is unavailable ──
        console.warn('API unavailable – loading mock data:', error.message);
        if (typeof loadMockData === 'function') {
            loadMockData();
            updateDashboard();
            initCharts();
            showWarning('Running in demo mode (offline data)');
        } else {
            showError('Failed to load dashboard data.');
        }
    }
};

// Update dashboard with data
const updateDashboard = () => {
    if (vendorData) {
        const name = vendorData.fullName || vendorData.name || 'Vendor';
        ['vendorName','profileName'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = name;
        });
    }
    
    // Calculate stats
    const stats = calculateStats();
    
    // Update stat cards
    updateStatCard('cardAssigned', stats.assigned);
    updateStatCard('cardPending', stats.pending);
    updateStatCard('cardAccepted', stats.accepted);
    updateStatCard('cardCompleted', stats.completed);
    updateStatCard('cardEarnings', `₹${stats.earnings.toLocaleString('en-IN')}`);
    updateStatCard('cardPayouts', `₹${stats.payouts.toLocaleString('en-IN')}`);
    
    // Update activity feed
    updateActivityFeed();
};

// Calculate statistics from bookings
const calculateStats = () => {
    const stats = {
        assigned: 0,
        pending: 0,
        accepted: 0,
        completed: 0,
        earnings: 0,
        payouts: 0
    };
    
    bookingsData.forEach(booking => {
        stats.assigned++;
        
        if (booking.vendorStatus === 'pending') stats.pending++;
        else if (booking.vendorStatus === 'accepted') stats.accepted++;
        
        if (booking.tripStatus === 'completed') stats.completed++;
        
        if (booking.vendorCommission) {
            stats.earnings += booking.vendorCommission;
            if (booking.payoutStatus === 'unpaid') {
                stats.payouts += booking.vendorCommission;
            }
        }
    });
    
    return stats;
};

// Update a stat card
const updateStatCard = (cardId, value) => {
    const card = document.getElementById(cardId);
    if (card) {
        const counter = card.querySelector('.counter');
        if (counter) {
            counter.textContent = value;
            counter.style.animation = 'pulse 0.5s ease';
        }
    }
};

// Add pulse animation to CSS
const addAnimations = () => {
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
    `;
    document.head.appendChild(style);
};

// Initialize charts
const initCharts = () => {
    initEarningsChart();
    initCompletionChart();
    initBookingsChart();
};

// Earnings chart (line chart)
const initEarningsChart = () => {
    const ctx = document.getElementById('earningsChart');
    if (!ctx) return;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const earnings = [2000, 2500, 3000, 2800, 3500, 4000];
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Monthly Earnings (₹)',
                data: earnings,
                borderColor: '#f5c842',
                backgroundColor: 'rgba(245, 200, 66, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointBackgroundColor: '#f5c842',
                pointBorderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#e6e8ec',
                        font: { size: 12 }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#8b95a5' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                x: {
                    ticks: { color: '#8b95a5' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                }
            }
        }
    });
};

// Completion percentage chart (doughnut)
const initCompletionChart = () => {
    const ctx = document.getElementById('completionChart');
    if (!ctx) return;
    
    const completed = bookingsData.filter(b => b.tripStatus === 'completed').length;
    const total = bookingsData.length || 1;
    const percentage = Math.round((completed / total) * 100);
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Ongoing'],
            datasets: [{
                data: [percentage, 100 - percentage],
                backgroundColor: ['#34d399', '#252d3a'],
                borderColor: ['#34d399', '#252d3a'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#e6e8ec',
                        font: { size: 12 }
                    }
                }
            }
        }
    });
};

// Bookings handled chart (bar chart)
const initBookingsChart = () => {
    const ctx = document.getElementById('bookingsChart');
    if (!ctx) return;
    
    const categories = ['Group', 'Honeymoon', 'Adventure'];
    const counts = [5, 3, 4];
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'Bookings',
                data: counts,
                backgroundColor: '#00d4b4',
                borderColor: '#00d4b4',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#e6e8ec',
                        font: { size: 12 }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#8b95a5' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                x: {
                    ticks: { color: '#8b95a5' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                }
            }
        }
    });
};

// Update activity feed
const updateActivityFeed = () => {
    const feed = document.getElementById('activityFeed');
    if (!feed) return;
    
    feed.innerHTML = '';
    
    bookingsData.slice(0, 5).forEach(booking => {
        const li = document.createElement('li');
        const icon = booking.vendorStatus === 'accepted' 
            ? 'fa-check-circle success' 
            : 'fa-clock info';
        
        const tourName = booking.tourId?.title || 'Unknown Tour';
        
        li.innerHTML = `
            <i class="fas ${icon}"></i>
            ${booking.vendorStatus === 'accepted' ? 'Accepted' : 'Assigned'}
            <strong>${tourName}</strong>
        `;
        
        feed.appendChild(li);
    });
};

// Populate profile section
const populateProfile = () => {
    if (!vendorData) return;
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || '—';
    };
    set('profileName', vendorData.fullName || vendorData.name);
    set('pf-name', vendorData.fullName || vendorData.name);
    set('pf-company', vendorData.companyName);
    set('pf-email', vendorData.email);
    set('pf-phone', vendorData.phone);
    set('pf-spec', vendorData.specialization);
    set('pf-region', vendorData.region);
    set('pf-since', vendorData.createdAt ? new Date(vendorData.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '—');
    set('pf-status', vendorData.isApproved ? 'Active & Approved' : 'Pending Approval');
};

// Event listeners
const setupEventListeners = () => {
    // ---- SIDEBAR NAVIGATION ----
    const sectionTitles = {
        dashboard:  'Dashboard',
        assigned:   'Assigned Trips',
        accepted:   'Accepted Trips',
        completed:  'Completed Trips',
        payouts:    'Payouts',
        commission: 'Commission',
        customers:  'Customers',
        profile:    'My Profile',
        settings:   'Settings'
    };

    const showSection = (sectionKey) => {
        // Hide dashboard sections
        const dashSection = document.getElementById('dashboardSection');
        const activitySection = document.getElementById('activitySection');
        if (dashSection) dashSection.style.display = 'none';
        if (activitySection) activitySection.style.display = 'none';

        // Hide all dash-sections
        document.querySelectorAll('.dash-section').forEach(sec => {
            sec.style.display = 'none';
        });

        if (sectionKey === 'dashboard') {
            if (dashSection) dashSection.style.display = '';
            if (activitySection) activitySection.style.display = '';
        } else {
            const target = document.getElementById(`section-${sectionKey}`);
            if (target) target.style.display = '';
        }

        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = sectionTitles[sectionKey] || 'Dashboard';

        // Update active state
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        const activeItem = document.querySelector(`.nav-item[data-section="${sectionKey}"]`);
        if (activeItem) activeItem.classList.add('active');

        // Call section-specific renderers
        const renderers = {
            assigned:   window.renderAssigned,
            accepted:   window.renderAccepted,
            completed:  window.renderCompleted,
            payouts:    window.renderPayouts,
            commission: window.renderCommission,
            customers:  window.renderCustomers,
            profile:    populateProfile
        };
        if (renderers[sectionKey]) renderers[sectionKey]();

        // Sync settings theme toggle (once)
        if (sectionKey === 'settings') {
            const settingsTheme = document.getElementById('settingsThemeToggle');
            if (settingsTheme && !settingsTheme._bound) {
                settingsTheme._bound = true;
                settingsTheme.checked = document.documentElement.getAttribute('data-theme') === 'dark';
                settingsTheme.addEventListener('change', () => {
                    const newTheme = settingsTheme.checked ? 'dark' : 'light';
                    document.documentElement.setAttribute('data-theme', newTheme);
                    localStorage.setItem('vendorTheme', newTheme);
                    const mainToggle = document.getElementById('themeToggle');
                    if (mainToggle) mainToggle.checked = (newTheme === 'light');
                });
            }
        }
    };

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            if (item.id === 'logoutBtn' || !section) {
                vendorLogout();
                return;
            }
            showSection(section);
        });
    });

    // Theme toggle (sidebar)
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            const html = document.documentElement;
            const newTheme = themeToggle.checked ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('vendorTheme', newTheme);
        });
    }

    // Sidebar toggle on mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        // Inject overlay element once
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }
        const closeSidebar = () => {
            document.getElementById('sidebar').classList.remove('mobile-open');
            overlay.classList.remove('show');
        };
        sidebarToggle.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            const opening = !sidebar.classList.contains('mobile-open');
            sidebar.classList.toggle('mobile-open');
            overlay.classList.toggle('show', opening);
        });
        overlay.addEventListener('click', closeSidebar);
    }

    // Modal close
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            const modal = document.getElementById('genericModal');
            modal.classList.remove('show');
        });
    }
};

// Load theme preference
const loadTheme = () => {
    const theme = localStorage.getItem('vendorTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.checked = theme === 'light';
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    addAnimations();
    setupEventListeners();
    initDashboard();
});
