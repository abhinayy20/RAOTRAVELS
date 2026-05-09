// ============================================================
//  BOOKING DETAILS PAGE JS
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE : 'https://raotravels-backend.onrender.com';
    
    const loadingState = document.getElementById('loading-state');
    const detailsContent = document.getElementById('details-content');
    const logoutBtn = document.getElementById('logout-btn');
    
    let bookingId = getBookingIdFromURL();

    // Get booking ID from URL
    function getBookingIdFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    // Toast notification
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.4s ease forwards';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('vendorToken');
        window.location.href = 'vendor-login.html';
    });

    // Fetch booking details
    async function fetchBookingDetails() {
        if (!bookingId) {
            showToast('Booking not found', 'error');
            setTimeout(() => window.location.href = 'vendor.html', 1500);
            return;
        }

        try {
            const token = localStorage.getItem('vendorToken');
            const response = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Booking not found');

            const data = await response.json();
            const booking = data.data || data;

            renderBookingDetails(booking);
            loadingState.style.display = 'none';
            detailsContent.style.display = 'block';
        } catch (error) {
            console.error('Error fetching booking:', error);
            showToast('Failed to load booking details', 'error');
            setTimeout(() => window.location.href = 'vendor.html', 1500);
        }
    }

    // Render booking details
    function renderBookingDetails(booking) {
        const formatPrice = (p) => '₹' + Number(p).toLocaleString('en-IN');
        const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

        // Header
        document.getElementById('booking-title').textContent = booking.tourId?.title || booking.tourName || 'Booking Details';
        document.getElementById('booking-id-display').textContent = `Booking ID: ${booking._id}`;

        // Status section
        const statusSection = document.getElementById('status-section');
        const statusClass = booking.status || 'pending';
        statusSection.innerHTML = `
            <div class="status-badge-large ${statusClass}">
                <i class="fas fa-${getStatusIcon(booking.status)}"></i>
                ${(booking.status || 'pending').toUpperCase()}
            </div>
            <div style="font-size: 0.85rem; color: #94a3b8;">
                Last updated: ${formatDate(booking.updatedAt || booking.createdAt)}
            </div>
        `;

        // Tour Information
        document.getElementById('tour-name').textContent = booking.tourId?.title || booking.tourName || 'N/A';
        document.getElementById('tour-location').textContent = booking.tourId?.location || booking.location || 'N/A';
        document.getElementById('tour-duration').textContent = booking.tourId?.duration || booking.duration || 'N/A';
        document.getElementById('tour-price').textContent = formatPrice(booking.tourId?.price || booking.price || 0);

        // Customer Information
        document.getElementById('customer-name').textContent = booking.name || 'N/A';
        document.getElementById('customer-email').textContent = booking.email || 'N/A';
        document.getElementById('customer-phone').textContent = booking.phone || 'N/A';
        document.getElementById('customer-address').textContent = booking.address || 'Not Provided';

        // Booking Details
        document.getElementById('travelers-count').textContent = booking.travelers || 0;
        document.getElementById('tour-date').textContent = booking.date ? formatDate(booking.date) : 'TBD';
        document.getElementById('booking-date').textContent = formatDate(booking.bookingDate || booking.createdAt);
        document.getElementById('special-requests').textContent = booking.specialRequests || 'None';

        // Pricing
        const basePrice = booking.tourId?.price || booking.price || 0;
        const totalTravelers = booking.travelers || 1;
        const baseTotal = basePrice * totalTravelers;
        const tax = Math.round(baseTotal * 0.18);
        const totalAmount = baseTotal + tax;

        document.getElementById('base-total').textContent = formatPrice(baseTotal);
        document.getElementById('tax-amount').textContent = formatPrice(tax);
        document.getElementById('total-amount').textContent = formatPrice(totalAmount);

        // Timeline
        renderTimeline(booking);

        // Actions
        renderActions(booking);
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

    // Render timeline
    function renderTimeline(booking) {
        const timeline = document.getElementById('timeline-content');
        const vendorStatus = booking.vendorStatus || 'pending';

        const steps = [
            { id: 'submitted', label: 'Booking Submitted', icon: 'check-circle', completed: true },
            { id: 'admin-review', label: 'Admin Review', icon: 'shield-alt', completed: booking.status === 'approved' },
            { id: 'vendor-response', label: 'Vendor Response', icon: 'user-check', completed: booking.vendorStatus === 'accepted' },
            { id: 'confirmed', label: 'Booking Confirmed', icon: 'check-double', completed: booking.status === 'confirmed' }
        ];

        timeline.innerHTML = steps.map((step, index) => `
            <div class="timeline-item ${step.completed ? 'completed' : ''} ${!step.completed && index === steps.findIndex(s => !s.completed) ? 'active' : ''}">
                <div class="timeline-content">
                    <div class="timeline-title">${step.label}</div>
                    <div class="timeline-time">${getTimelineTime(booking, step.id)}</div>
                </div>
            </div>
        `).join('');
    }

    function getTimelineTime(booking, stepId) {
        const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        
        switch(stepId) {
            case 'submitted': return formatDate(booking.bookingDate || booking.createdAt);
            case 'admin-review': return booking.status === 'approved' ? formatDate(booking.updatedAt) : 'Pending';
            case 'vendor-response': return booking.vendorStatus === 'accepted' ? formatDate(booking.updatedAt) : 'Pending';
            case 'confirmed': return booking.status === 'confirmed' ? formatDate(booking.updatedAt) : 'Pending';
            default: return 'N/A';
        }
    }

    // Render actions
    function renderActions(booking) {
        const actionsSection = document.getElementById('actions-section');
        const vendorStatus = booking.vendorStatus || 'pending';
        
        let actionsHTML = '';

        if (vendorStatus === 'pending') {
            actionsHTML = `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; background: rgba(250,204,21,0.05); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(250,204,21,0.15);">
                    <i class="fas fa-info-circle" style="color: #facc15; font-size: 1.25rem; flex-shrink: 0;"></i>
                    <p style="margin: 0; color: #f1f5f9; font-size: 0.95rem;">Please review the booking details and confirm whether you can handle this booking.</p>
                </div>
                
                <div style="display: flex; gap: 1rem;">
                    <h3 style="width: 100%; display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1.5rem;">
                        <i class="fas fa-handshake" style="color: #facc15;"></i> Confirm Your Response
                    </h3>
                </div>
                
                <div class="action-buttons" id="actions-${booking._id}">
                    <button class="btn-action-primary btn-accept" onclick="handleVendorAction('${booking._id}', 'accepted')">
                        <i class="fas fa-check"></i> Accept Booking
                    </button>
                    <button class="btn-action-primary btn-reject" onclick="handleVendorAction('${booking._id}', 'rejected')">
                        <i class="fas fa-times"></i> Reject Booking
                    </button>
                </div>
            `;
        } else {
            const statusText = vendorStatus === 'accepted' ? 'You have accepted this booking' : 'You have rejected this booking';
            const statusClass = vendorStatus === 'accepted' ? 'confirmed' : 'rejected';
            
            actionsHTML = `
                <div style="background: rgba(${vendorStatus === 'accepted' ? '52,211,153' : '248,113,113'},0.05); border: 1px solid rgba(${vendorStatus === 'accepted' ? '52,211,153' : '248,113,113'},0.15); border-radius: 12px; padding: 1.5rem; display: flex; align-items: center; gap: 1rem;">
                    <i class="fas fa-${vendorStatus === 'accepted' ? 'check-circle' : 'times-circle'}" style="color: ${vendorStatus === 'accepted' ? '#34d399' : '#f87171'}; font-size: 1.5rem;"></i>
                    <p style="margin: 0; color: #f1f5f9; font-size: 0.95rem;">${statusText}</p>
                </div>
            `;
        }

        actionsSection.innerHTML = actionsHTML;
    }

    // Handle vendor action
    window.handleVendorAction = async function(bookingId, status) {
        const token = localStorage.getItem('vendorToken');
        const actionBtn = event.target.closest('button');
        const allButtons = document.querySelectorAll('.action-buttons button');
        
        allButtons.forEach(btn => btn.disabled = true);
        actionBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        try {
            const response = await fetch(`${API_BASE}/api/vendor/update-status/${bookingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ vendorStatus: status })
            });

            if (!response.ok) throw new Error('Failed to update status');

            showToast(`Booking ${status === 'accepted' ? 'accepted' : 'rejected'} successfully`, 'success');
            
            setTimeout(() => {
                fetchBookingDetails();
            }, 1500);
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to update booking', 'error');
            allButtons.forEach(btn => btn.disabled = false);
            actionBtn.innerHTML = status === 'accepted' ? '<i class="fas fa-check"></i> Accept Booking' : '<i class="fas fa-times"></i> Reject Booking';
        }
    };

    // Initial load
    fetchBookingDetails();
});
