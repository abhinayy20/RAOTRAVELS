// ============================================================
//  vendor.js — Logic for Vendor Dashboard
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Authentication Check
    const token = localStorage.getItem('vendorToken');
    if (!token) {
        window.location.href = 'vendor-login.html';
        return;
    }

    // 2. DOM Elements
    const logoutBtn = document.getElementById('logout-btn');
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const bookingsGrid = document.getElementById('bookings-grid');
    const bookingStats = document.getElementById('booking-stats');
    const toastContainer = document.getElementById('toast-container');

    // 3. Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('vendorToken');
        window.location.href = 'vendor-login.html';
    });

    // 4. Toast Notification System
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-exclamation-circle';
        if (type === 'info') icon = 'fa-info-circle';

        toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
        toastContainer.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // 5. Fetch Bookings
    async function fetchAssignedBookings() {
        try {
            const res = await fetch(`${CONFIG.API_BASE}/api/bookings`);
            const data = await res.json();
            
            if (res.ok) {
                // Filter: only show bookings where Admin approved them
                // and maybe vendorStatus exists (assuming 'pending' is default)
                const assignedBookings = data.filter(b => b.status === 'approved');
                renderBookings(assignedBookings);
            } else {
                showToast('Failed to fetch bookings', 'error');
                showEmptyState();
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            showToast('Server connection error', 'error');
            showEmptyState();
        }
    }

    // 6. UI State Managers
    function showLoadingState() {
        loadingState.style.display = 'flex';
        bookingsGrid.style.display = 'none';
        emptyState.style.display = 'none';
    }

    function showEmptyState() {
        loadingState.style.display = 'none';
        bookingsGrid.style.display = 'none';
        emptyState.style.display = 'flex';
        bookingStats.textContent = `0 Active Assignments`;
    }

    // 7. Render Bookings
    function renderBookings(bookings) {
        if (!bookings || bookings.length === 0) {
            showEmptyState();
            return;
        }

        loadingState.style.display = 'none';
        emptyState.style.display = 'none';
        bookingsGrid.style.display = 'grid';
        bookingsGrid.innerHTML = '';
        
        // Stats
        const pendingCount = bookings.filter(b => b.vendorStatus === 'pending' || !b.vendorStatus).length;
        bookingStats.textContent = `${pendingCount} Pending Actions | ${bookings.length} Total Assignments`;

        bookings.forEach(booking => {
            // Safe fallback for potentially missing fields
            const vendorStatus = booking.vendorStatus || 'pending';
            const price = booking.totalPrice ? `$${booking.totalPrice}` : 'N/A';
            const date = new Date(booking.bookingDate || booking.createdAt).toLocaleDateString();

            const card = document.createElement('div');
            card.className = 'booking-card';
            card.dataset.id = booking._id;

            // Build Action Buttons or Status Indicator
            let actionsHTML = '';
            if (vendorStatus === 'pending') {
                actionsHTML = `
                    <div class="card-actions" id="actions-${booking._id}">
                        <button class="btn-action btn-accept" onclick="handleVendorAction('${booking._id}', 'confirmed')">
                            <i class="fas fa-check"></i> Accept
                        </button>
                        <button class="btn-action btn-reject" onclick="handleVendorAction('${booking._id}', 'rejected')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                `;
            } else if (vendorStatus === 'confirmed') {
                actionsHTML = `<div class="vendor-status-indicator indicator-confirmed"><i class="fas fa-check-circle"></i> Accepted</div>`;
            } else if (vendorStatus === 'rejected') {
                actionsHTML = `<div class="vendor-status-indicator indicator-rejected"><i class="fas fa-times-circle"></i> Rejected</div>`;
            }

            card.innerHTML = `
                <div class="card-header">
                    <div class="tour-info">
                        <h3>${booking.tourName || 'Custom Tour'}</h3>
                        <div class="date"><i class="far fa-calendar-alt"></i> ${date}</div>
                    </div>
                    <span class="status-badge status-approved">
                        <i class="fas fa-shield-alt"></i> Admin Approved
                    </span>
                </div>
                
                <div class="card-body">
                    <div class="detail-row">
                        <span class="detail-label"><i class="fas fa-user"></i> Customer</span>
                        <span class="detail-value">${booking.customerName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label"><i class="fas fa-users"></i> Travelers</span>
                        <span class="detail-value">${booking.travelers} Persons</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label"><i class="fas fa-phone"></i> Contact</span>
                        <span class="detail-value">${booking.phone || 'N/A'}</span>
                    </div>
                    <div class="detail-row" style="margin-top: 8px; padding-top: 12px; border-top: 1px dashed var(--border);">
                        <span class="detail-label">Total Value</span>
                        <span class="price-value">${price}</span>
                    </div>
                </div>

                ${actionsHTML}
            `;

            bookingsGrid.appendChild(card);
        });
    }

    // 8. Handle Accept/Reject Actions
    window.handleVendorAction = async function(bookingId, status) {
        const actionDiv = document.getElementById(`actions-${bookingId}`);
        const buttons = actionDiv.querySelectorAll('button');
        
        // Disable buttons & show loading state
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.classList.contains(`btn-${status === 'confirmed' ? 'accept' : 'reject'}`)) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            }
        });

        try {
            const res = await fetch(`${CONFIG.API_BASE}/api/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vendorStatus: status })
            });

            const data = await res.json();

            if (res.ok) {
                showToast(`Booking successfully ${status}!`, 'success');
                // Replace action buttons with status indicator
                const indicatorClass = status === 'confirmed' ? 'indicator-confirmed' : 'indicator-rejected';
                const indicatorIcon = status === 'confirmed' ? 'fa-check-circle' : 'fa-times-circle';
                const indicatorText = status === 'confirmed' ? 'Accepted' : 'Rejected';
                
                actionDiv.outerHTML = `<div class="vendor-status-indicator ${indicatorClass}">
                    <i class="fas ${indicatorIcon}"></i> ${indicatorText}
                </div>`;
                
                // Optional: refresh data to update counts
                // fetchAssignedBookings();
            } else {
                showToast(data.message || 'Failed to update booking', 'error');
                // Re-enable buttons
                buttons.forEach(btn => btn.disabled = false);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            showToast('Network error while updating status', 'error');
            // Re-enable buttons
            buttons.forEach(btn => btn.disabled = false);
        }
    };

    // Initial Load
    showLoadingState();
    fetchAssignedBookings();
});
