// ============================================================
//  MY BOOKINGS PAGE JS
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE : 'https://raotravels-backend.onrender.com';
    
    const loadingState = document.getElementById('loading-state');
    const bookingsList = document.getElementById('bookings-list');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const logoutBtn = document.getElementById('logout-user-btn');
    
    let allBookings = [];

    // Toast notification
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastSlide 0.4s cubic-bezier(0.34,1.56,0.64,1) reverse';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userEmail');
        window.location.href = 'index.html';
    });

    // Fetch bookings
    async function fetchBookings() {
        showLoadingState();
        try {
            const userEmail = localStorage.getItem('userEmail');
            if (!userEmail) {
                showToast('Please log in to view your bookings', 'error');
                window.location.href = 'index.html';
                return;
            }

            const response = await fetch(`${API_BASE}/api/bookings?email=${encodeURIComponent(userEmail)}`);
            const data = await response.json();

            allBookings = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
            
            updateStats();
            renderBookings(allBookings);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            showToast('Failed to load bookings', 'error');
            showEmptyState();
        }
    }

    // Update stats
    function updateStats() {
        document.getElementById('stat-total').textContent = allBookings.length;
        document.getElementById('stat-pending').textContent = allBookings.filter(b => b.status === 'pending').length;
        document.getElementById('stat-confirmed').textContent = allBookings.filter(b => b.status === 'confirmed').length;
    }

    // Show/Hide states
    function showLoadingState() {
        loadingState.style.display = 'flex';
        bookingsList.style.display = 'none';
        emptyState.style.display = 'none';
    }

    function showBookingsList() {
        loadingState.style.display = 'none';
        emptyState.style.display = 'none';
        bookingsList.style.display = 'grid';
    }

    function showEmptyState() {
        loadingState.style.display = 'none';
        bookingsList.style.display = 'none';
        emptyState.style.display = 'flex';
    }

    // Render bookings
    function renderBookings(bookings) {
        if (!bookings || bookings.length === 0) {
            showEmptyState();
            return;
        }

        showBookingsList();
        bookingsList.innerHTML = '';

        bookings.forEach((booking, index) => {
            const statusClass = `status-${booking.status || 'pending'}`;
            const statusText = (booking.status || 'pending').charAt(0).toUpperCase() + (booking.status || 'pending').slice(1);
            const date = new Date(booking.bookingDate || booking.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            const tourName = booking.tourId?.title || booking.tourName || 'Custom Tour';
            const amount = booking.totalPrice ? `₹${Number(booking.totalPrice).toLocaleString('en-IN')}` : 'N/A';

            const item = document.createElement('div');
            item.className = 'booking-item';
            item.style.animationDelay = `${index * 50}ms`;
            
            item.innerHTML = `
                <div class="booking-icon">
                    <i class="fas fa-map-marked-alt"></i>
                </div>
                
                <div class="booking-info">
                    <h3 class="booking-title">${tourName}</h3>
                    <div class="booking-meta">
                        <div class="meta-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>Booked on: <strong>${date}</strong></span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-users"></i>
                            <span>Travelers: <strong>${booking.travelers || 1}</strong></span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-tag"></i>
                            <span>ID: <strong>${booking._id.substring(0, 8).toUpperCase()}</strong></span>
                        </div>
                    </div>
                    <div class="timeline-indicator">
                        <div class="timeline-step">
                            <div class="timeline-dot active"></div>
                            <span>Submitted</span>
                        </div>
                        <div class="timeline-separator">→</div>
                        <div class="timeline-step">
                            <div class="timeline-dot ${booking.status !== 'pending' ? 'active' : ''}"></div>
                            <span>Review</span>
                        </div>
                        <div class="timeline-separator">→</div>
                        <div class="timeline-step">
                            <div class="timeline-dot ${booking.status === 'confirmed' ? 'active' : ''}"></div>
                            <span>Confirmed</span>
                        </div>
                    </div>
                </div>
                
                <div class="booking-right">
                    <div class="booking-amount">
                        <div class="amount-value">${amount}</div>
                        <div class="amount-label">Total Amount</div>
                    </div>
                    <span class="booking-status ${statusClass}">
                        <i class="fas fa-${getStatusIcon(booking.status)}"></i>
                        ${statusText}
                    </span>
                </div>
            `;

            item.addEventListener('click', () => {
                window.location.href = `booking-details.html?id=${booking._id}`;
            });

            bookingsList.appendChild(item);
        });
    }

    function getStatusIcon(status) {
        const icons = {
            'pending': 'clock',
            'approved': 'shield-alt',
            'confirmed': 'check-circle',
            'rejected': 'times-circle'
        };
        return icons[status] || 'clock';
    }

    // Filter and search
    function applyFilters() {
        let filtered = allBookings;

        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(b =>
                (b.tourId?.title || b.tourName || '').toLowerCase().includes(searchTerm) ||
                b._id.toLowerCase().includes(searchTerm)
            );
        }

        const statusValue = statusFilter.value;
        if (statusValue) {
            filtered = filtered.filter(b => b.status === statusValue);
        }

        updateStats();
        renderBookings(filtered);
    }

    searchInput.addEventListener('input', applyFilters);
    statusFilter.addEventListener('change', applyFilters);

    // Initial load
    fetchBookings();
});
