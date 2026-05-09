// ============================================================
//  vendor.js — Logic for Vendor Dashboard (Premium SaaS UI)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    // ── 1. Auth Guard ────────────────────────────────────────
    const token = localStorage.getItem('vendorToken');
    if (!token) {
        window.location.href = 'vendor-login.html';
        return;
    }

    // ── 2. DOM References ────────────────────────────────────
    const logoutBtn      = document.getElementById('logout-btn');
    const loadingState   = document.getElementById('loading-state');
    const emptyState     = document.getElementById('empty-state');
    const bookingsGrid   = document.getElementById('bookings-grid');
    const toastContainer = document.getElementById('toast-container');

    const statTotal    = document.getElementById('stat-total');
    const statPending  = document.getElementById('stat-pending');
    const statAccepted = document.getElementById('stat-accepted');

    // ── 3. Logout ─────────────────────────────────────────────
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('vendorToken');
        window.location.href = 'vendor-login.html';
    });

    // ── 4. Toast System ──────────────────────────────────────
    function showToast(message, type = 'success') {
        const iconMap = {
            success: 'fa-check-circle',
            error:   'fa-exclamation-circle',
            info:    'fa-info-circle'
        };
        const icon = iconMap[type] || 'fa-info-circle';

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon"><i class="fas ${icon}"></i></div>
            <span class="toast-text">${message}</span>
        `;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastFadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // ── 5. Fetch Bookings ─────────────────────────────────────
    async function fetchAssignedBookings() {
        showLoadingState();
        try {
            const apiBase = typeof CONFIG !== 'undefined'
                ? CONFIG.API_BASE
                : 'https://raotravels-backend.onrender.com';

            const res  = await fetch(`${apiBase}/api/vendor/bookings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                const list = Array.isArray(data.data ? data.data : data)
                    ? (data.data || data)
                    : [];

                // Only show bookings approved by admin (or confirmed)
                const assigned = list.filter(b =>
                    b.status === 'approved' || b.status === 'confirmed'
                );
                renderBookings(assigned);
            } else {
                showToast(data.message || 'Failed to load bookings', 'error');
                showEmptyState();
            }
        } catch (err) {
            console.error('Fetch error:', err);
            showToast('Network error — please try again', 'error');
            showEmptyState();
        }
    }

    // ── 6. UI State Helpers ───────────────────────────────────
    function showLoadingState() {
        loadingState.style.display = 'flex';
        bookingsGrid.style.display = 'none';
        emptyState.style.display   = 'none';
    }

    function showEmptyState() {
        loadingState.style.display = 'none';
        bookingsGrid.style.display = 'none';
        emptyState.style.display   = 'flex';
        setStats(0, 0, 0);
    }

    function setStats(total, pending, accepted) {
        if (statTotal)    statTotal.textContent    = total;
        if (statPending)  statPending.textContent  = pending;
        if (statAccepted) statAccepted.textContent = accepted;
    }

    // ── 7. Render Bookings ────────────────────────────────────
    function renderBookings(bookings) {
        if (!bookings || bookings.length === 0) {
            showEmptyState();
            return;
        }

        loadingState.style.display = 'none';
        emptyState.style.display   = 'none';
        bookingsGrid.style.display = 'grid';
        bookingsGrid.innerHTML     = '';

        // Compute stats
        const pendingCount  = bookings.filter(b => !b.vendorStatus || b.vendorStatus === 'pending').length;
        const acceptedCount = bookings.filter(b => b.vendorStatus === 'accepted').length;
        setStats(bookings.length, pendingCount, acceptedCount);

        bookings.forEach((booking, idx) => {
            const card = buildCard(booking, idx);
            bookingsGrid.appendChild(card);
        });
    }

    // ── 8. Build a Single Card ────────────────────────────────
    function buildCard(booking, idx) {
        const vendorStatus = booking.vendorStatus || 'pending';
        const price = booking.totalPrice
            ? `₹${Number(booking.totalPrice).toLocaleString('en-IN')}`
            : 'N/A';

        const date = new Date(
            booking.date || booking.bookingDate || booking.createdAt
        ).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

        const tourName = (booking.tourId && booking.tourId.title)
            ? booking.tourId.title
            : (booking.tourName || 'Custom Tour');

        const customerName = (booking.name && booking.name !== 'undefined')
            ? booking.name
            : 'Unknown Customer';

        // Status config
        const statusCfg = {
            pending:  { cls: 'status-pending',  icon: 'fa-clock',        text: 'Pending Action',   accent: 'accent-pending'  },
            approved: { cls: 'status-approved', icon: 'fa-shield-alt',   text: 'Admin Approved',   accent: 'accent-approved' },
            accepted: { cls: 'status-accepted', icon: 'fa-check-circle', text: 'Accepted',         accent: 'accent-accepted' },
            rejected: { cls: 'status-rejected', icon: 'fa-times-circle', text: 'Rejected',         accent: 'accent-rejected' }
        };

        // vendorStatus drives the badge; if still pending admin shows approved
        const badgeKey = (vendorStatus === 'pending' && booking.status === 'approved')
            ? 'approved'
            : vendorStatus;
        const cfg = statusCfg[badgeKey] || statusCfg.pending;
        const accentCls = statusCfg[badgeKey]
            ? statusCfg[badgeKey].accent
            : 'accent-pending';

        // Action area
        let footerHTML = '';
        if (vendorStatus === 'pending') {
            footerHTML = `
                <div class="card-actions" id="actions-${booking._id}">
                    <button class="btn-action btn-accept"
                        onclick="handleVendorAction('${booking._id}', 'accepted')">
                        <i class="fas fa-check"></i> Accept
                    </button>
                    <button class="btn-action btn-reject"
                        onclick="handleVendorAction('${booking._id}', 'rejected')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>`;
        } else {
            const indCls  = vendorStatus === 'accepted' ? 'indicator-confirmed' : 'indicator-rejected';
            const indIcon = vendorStatus === 'accepted' ? 'fa-check-circle'     : 'fa-times-circle';
            const indText = vendorStatus === 'accepted' ? 'Booking Confirmed'   : 'Booking Rejected';
            footerHTML = `
                <div class="vendor-status-indicator ${indCls}">
                    <i class="fas ${indIcon}"></i> ${indText}
                </div>`;
        }

        const card = document.createElement('div');
        card.className = 'booking-card';
        card.dataset.id = booking._id;
        card.style.animationDelay = `${idx * 0.07}s`;

        card.innerHTML = `
            <div class="card-accent ${accentCls}"></div>

            <div class="card-header">
                <div class="tour-info">
                    <h3 title="${tourName}">${tourName}</h3>
                    <span class="date-tag">
                        <i class="far fa-calendar-alt"></i> ${date}
                    </span>
                </div>
                <span class="status-badge ${cfg.cls}">
                    <i class="fas ${cfg.icon}"></i> ${cfg.text}
                </span>
            </div>

            <div class="card-body">
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">
                            <i class="fas fa-user-circle"></i> Customer
                        </span>
                        <span class="detail-value">${customerName}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">
                            <i class="fas fa-phone-alt"></i> Phone
                        </span>
                        <span class="detail-value">${booking.phone || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">
                            <i class="fas fa-users"></i> Travelers
                        </span>
                        <span class="detail-value">${booking.travelers || 1} Person${(booking.travelers || 1) > 1 ? 's' : ''}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">
                            <i class="fas fa-hashtag"></i> Booking ID
                        </span>
                        <span class="detail-value" style="font-size:0.75rem; color: var(--text-sub);">${booking._id ? booking._id.slice(-8).toUpperCase() : '—'}</span>
                    </div>
                </div>

                <div class="price-row">
                    <span class="price-label">Total Value</span>
                    <span class="price-value">${price}</span>
                </div>
            </div>

            <div class="card-footer">
                ${footerHTML}
            </div>
        `;

        // Add click handler to view full details
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-action')) {
                window.location.href = `booking-details.html?id=${booking._id}`;
            }
        });

        return card;
    }

    // ── 9. Accept / Reject Handler ────────────────────────────
    window.handleVendorAction = async function(bookingId, status) {
        const actionDiv = document.getElementById(`actions-${bookingId}`);
        if (!actionDiv) return;

        const buttons = actionDiv.querySelectorAll('button');
        const activeBtn = actionDiv.querySelector(
            status === 'accepted' ? '.btn-accept' : '.btn-reject'
        );

        // Disable all & show spinner on active button
        buttons.forEach(btn => { btn.disabled = true; });
        if (activeBtn) {
            activeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        }

        try {
            const apiBase = typeof CONFIG !== 'undefined'
                ? CONFIG.API_BASE
                : 'https://raotravels-backend.onrender.com';

            const res = await fetch(`${apiBase}/api/vendor/update-status/${bookingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ vendorStatus: status })
            });

            const data = await res.json();

            if (res.ok) {
                const msg = status === 'accepted'
                    ? '✅ Booking accepted successfully!'
                    : '❌ Booking rejected.';
                showToast(msg, status === 'accepted' ? 'success' : 'error');

                // Swap action area → status indicator
                const indCls  = status === 'accepted' ? 'indicator-confirmed' : 'indicator-rejected';
                const indIcon = status === 'accepted' ? 'fa-check-circle'     : 'fa-times-circle';
                const indText = status === 'accepted' ? 'Booking Confirmed'   : 'Booking Rejected';

                actionDiv.style.animation = 'toastFadeOut 0.2s ease forwards';
                setTimeout(() => {
                    actionDiv.outerHTML = `
                        <div class="vendor-status-indicator ${indCls}">
                            <i class="fas ${indIcon}"></i> ${indText}
                        </div>`;
                }, 200);

                // Update accent bar color on the card
                const card = document.querySelector(`.booking-card[data-id="${bookingId}"]`);
                if (card) {
                    const accent = card.querySelector('.card-accent');
                    if (accent) {
                        accent.className = `card-accent accent-${status}`;
                    }
                }

                // Recalculate stats
                const allCards = document.querySelectorAll('.booking-card');
                const total = allCards.length;
                // Count remaining pending (approximate until next refresh)
                const stillPending = document.querySelectorAll('.status-pending').length - 1;
                const nowAccepted  = document.querySelectorAll('.indicator-confirmed').length + (status === 'accepted' ? 1 : 0);
                setStats(total, Math.max(0, stillPending), nowAccepted);

            } else {
                showToast(data.message || 'Something went wrong', 'error');
                buttons.forEach(btn => {
                    btn.disabled = false;
                    const isAccept = btn.classList.contains('btn-accept');
                    btn.innerHTML = `<i class="fas ${isAccept ? 'fa-check' : 'fa-times'}"></i> ${isAccept ? 'Accept' : 'Reject'}`;
                });
            }
        } catch (err) {
            console.error('Action error:', err);
            showToast('Network error — please try again', 'error');
            buttons.forEach(btn => { btn.disabled = false; });
        }
    };

    // ── Init ──────────────────────────────────────────────────
    fetchAssignedBookings();
});
