// ============================================================
//  vendor.js — RAO Travels Vendor Portal
//  Shows bookings where status === 'Approved' (admin-approved)
//  and allows vendor to Accept or Reject each booking
// ============================================================

const API = CONFIG.API_BASE + '/api';
const formatPrice = (p) => '₹' + Number(p).toLocaleString('en-IN');
const formatDate  = (d) => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });

// ---- Toast ----
const showToast = (msg, type = 'success') => {
    const toast = document.getElementById('toast');
    toast.className = `toast ${type} show`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${msg}`;
    setTimeout(() => toast.classList.remove('show'), 3500);
};

// ---- State ----
let allBookings  = [];
let activeFilter = 'all';

// ---- Vendor status badge ----
const vBadge = (status) => {
    const map = {
        Pending:  { cls: 'badge-pending',   icon: 'fa-clock',        label: 'Awaiting Your Action' },
        Accepted: { cls: 'badge-confirmed', icon: 'fa-check-circle', label: 'Accepted' },
        Rejected: { cls: 'badge-rejected',  icon: 'fa-times-circle', label: 'Rejected' },
    };
    const s = map[status] || map.Pending;
    return `<span class="status-badge ${s.cls}"><i class="fas ${s.icon}"></i> ${s.label}</span>`;
};

// ---- Render cards ----
const renderCards = () => {
    const grid = document.getElementById('vendor-cards');

    let filtered = allBookings;
    if (activeFilter !== 'all') {
        filtered = allBookings.filter(b => b.vendorStatus === activeFilter);
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <i class="fas fa-inbox"></i>
                <h3 style="color:#e6e8ec;margin-bottom:8px;">No bookings here</h3>
                <p>${activeFilter === 'all' ? 'No bookings have been assigned to you yet.' : `No bookings with status "${activeFilter}".`}</p>
            </div>`;
        return;
    }

    grid.innerHTML = filtered.map(b => {
        const tourName = b.tourId ? b.tourId.title : 'Unknown Tour';
        const location = b.tourId ? b.tourId.location : '—';
        const canAct   = b.vendorStatus === 'Pending';

        return `
        <div class="booking-card" id="vcard-${b._id}">
            <div class="booking-card-header">
                <div>
                    <h3>${b.name}</h3>
                    <div class="booking-card-meta">${b.email} · ${b.phone}</div>
                </div>
                ${vBadge(b.vendorStatus || 'Pending')}
            </div>
            <div class="booking-card-details">
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-map-marker-alt"></i> Tour</span>
                    <span class="detail-value">${tourName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-location-dot"></i> Location</span>
                    <span class="detail-value">${location}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-calendar"></i> Travel Date</span>
                    <span class="detail-value">${formatDate(b.date)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-users"></i> Travelers</span>
                    <span class="detail-value">${b.travelers} Person(s)</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-rupee-sign"></i> Total Amount</span>
                    <span class="detail-value gold">${formatPrice(b.totalPrice || 0)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-tag"></i> Assigned Vendor</span>
                    <span class="detail-value">${b.assignedVendor || '—'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-hashtag"></i> Booking ID</span>
                    <span class="detail-value" style="font-size:0.75rem;color:var(--text-muted);">${b._id}</span>
                </div>
            </div>
            ${canAct ? `
            <div class="card-actions">
                <button class="btn-accept" onclick="vendorAct('${b._id}', 'accept')">
                    <i class="fas fa-check"></i> Accept
                </button>
                <button class="btn-vendor-reject" onclick="vendorAct('${b._id}', 'reject')">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>` : `
            <div style="text-align:center;padding:10px 0;font-size:0.8rem;color:var(--text-muted);">
                <i class="fas fa-lock"></i> Action already taken
            </div>`}
        </div>`;
    }).join('');
};

// ---- Update mini-stats ----
const updateStats = () => {
    document.getElementById('v-total').textContent    = allBookings.length;
    document.getElementById('v-pending').textContent  = allBookings.filter(b => b.vendorStatus === 'Pending').length;
    document.getElementById('v-accepted').textContent = allBookings.filter(b => b.vendorStatus === 'Accepted').length;
    document.getElementById('v-rejected').textContent = allBookings.filter(b => b.vendorStatus === 'Rejected').length;
};

// ---- Load bookings assigned to vendors (status === Approved) ----
const loadVendorBookings = async () => {
    const grid = document.getElementById('vendor-cards');
    grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1;"><i class="fas fa-circle-notch"></i>Loading…</div>`;

    try {
        // Fetch all bookings — vendor sees only those that are Admin-Approved
        // In production you'd pass a vendor token here
        const res  = await fetch(`${API}/bookings`);
        const json = await res.json();

        if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load');

        // Filter: only bookings that admin has approved (status = Approved OR Confirmed)
        allBookings = (json.data || []).filter(b =>
            b.status === 'Approved' || b.status === 'Confirmed'
        );

        updateStats();
        renderCards();
    } catch (err) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <i class="fas fa-exclamation-circle" style="color:#ff4d4d;"></i>
                <h3 style="color:#e6e8ec;">Could not load bookings</h3>
                <p>${err.message}</p>
                <button onclick="loadVendorBookings()" style="margin-top:15px;padding:10px 24px;background:#667eea;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>`;
        console.error('Vendor load error:', err);
    }
};

// ---- Vendor Accept / Reject ----
window.vendorAct = async (id, action) => {
    const label = action === 'accept' ? 'Accept' : 'Reject';
    if (!confirm(`${label} this booking? This cannot be undone.`)) return;

    try {
        const res = await fetch(`${API}/bookings/${id}/vendor-action`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ action })
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Action failed');

        showToast(`Booking ${action === 'accept' ? 'Accepted ✓' : 'Rejected'} successfully!`);

        // Update local state and re-render without full reload
        const idx = allBookings.findIndex(b => b._id === id);
        if (idx !== -1) {
            allBookings[idx].vendorStatus = action === 'accept' ? 'Accepted' : 'Rejected';
            allBookings[idx].status = action === 'accept' ? 'Confirmed' : 'Approved';
        }
        updateStats();
        renderCards();

    } catch (err) {
        showToast(err.message, 'error');
    }
};

// ---- Filter chips ----
document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeFilter = chip.getAttribute('data-filter');
        renderCards();
    });
});

// ---- Init ----
loadVendorBookings();
