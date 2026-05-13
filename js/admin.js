// ============================================================
//  admin.js — RAO Travels Admin Panel (Phase 5 Part 1)
// ============================================================

const API = CONFIG.API_BASE + '/api';
const formatPrice = (p) => '₹' + Number(p).toLocaleString('en-IN');
const formatDate  = (d) => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });

// ============================================================
//  Toast Notifications
// ============================================================
const showToast = (msg, type = 'success') => {
    const toast = document.getElementById('toast');
    toast.className = `toast ${type} show`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${msg}`;
    setTimeout(() => toast.classList.remove('show'), 3500);
};

// ============================================================
//  Status badge helpers
// ============================================================
const statusBadge = (status) => {
    const sStr = (status || 'pending').toLowerCase();
    const map = {
        pending:   { cls: 'badge-pending',   icon: 'fa-clock' },
        approved:  { cls: 'badge-approved',  icon: 'fa-thumbs-up' },
        rejected:  { cls: 'badge-rejected',  icon: 'fa-times-circle' },
        confirmed: { cls: 'badge-confirmed', icon: 'fa-check-circle' },
        cancelled: { cls: 'badge-rejected',  icon: 'fa-ban' },
    };
    const s = map[sStr] || map.pending;
    return `<span class="status-badge ${s.cls}"><i class="fas ${s.icon}"></i> ${status}</span>`;
};

const vendorBadge = (status) => {
    const sStr = (status || 'pending').toLowerCase();
    const map = {
        pending:  { cls: 'badge-pending',   icon: 'fa-clock' },
        accepted: { cls: 'badge-confirmed', icon: 'fa-check' },
        rejected: { cls: 'badge-rejected',  icon: 'fa-times' },
    };
    const s = map[sStr] || map.pending;
    return `<span class="status-badge ${s.cls}"><i class="fas ${s.icon}"></i> ${status}</span>`;
};

// ============================================================
//  Auth header
// ============================================================
const authHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
});

// ============================================================
//  Tab Navigation
// ============================================================
const navItems    = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const pageTitle   = document.getElementById('page-title');
const tabNames    = { dashboard: 'Dashboard', tours: 'Manage Tours', bookings: 'Bookings' };

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navItems.forEach(n => n.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active'));
        item.classList.add('active');
        const tab = item.getAttribute('data-tab');
        document.getElementById(`tab-${tab}`).classList.add('active');
        pageTitle.textContent = tabNames[tab] || 'Dashboard';
        document.getElementById('sidebar').classList.remove('open');
    });
});

document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

// ============================================================
//  DASHBOARD
// ============================================================
const loadDashboard = async () => {
    try {
        const [toursRes, bookingsRes] = await Promise.all([
            fetch(`${API}/tours`).then(r => r.json()),
            fetch(`${API}/bookings`, { headers: authHeader() }).then(r => r.json())
        ]);

        const tours    = toursRes.data    || [];
        const bookings = bookingsRes.data || [];

        document.getElementById('stat-tours').textContent    = tours.length;
        document.getElementById('stat-bookings').textContent = bookings.length;

        const pending   = bookings.filter(b => b.status === 'pending').length;
        const approved  = bookings.filter(b => b.status === 'approved').length;
        const confirmed = bookings.filter(b => b.status === 'confirmed').length;

        document.getElementById('stat-pending').textContent   = pending;
        document.getElementById('stat-approved').textContent  = approved;
        document.getElementById('stat-confirmed').textContent = confirmed;

        const revenue = bookings
            .filter(b => b.status === 'confirmed')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        document.getElementById('stat-revenue').textContent = formatPrice(revenue);

        // Recent bookings
        const recent    = bookings.slice(0, 5);
        const recentDiv = document.getElementById('recent-bookings');

        if (recent.length === 0) {
            recentDiv.innerHTML = '<p style="color:var(--text-muted);">No bookings yet.</p>';
            return;
        }

        recentDiv.innerHTML = `
            <table>
                <thead><tr>
                    <th>Name</th><th>Tour</th><th>Date</th><th>Amount</th>
                    <th>Status</th><th>Vendor</th>
                </tr></thead>
                <tbody>
                    ${recent.map(b => `
                        <tr>
                            <td><strong>${b.name}</strong></td>
                            <td>${b.tourId ? b.tourId.title : 'N/A'}</td>
                            <td>${formatDate(b.date)}</td>
                            <td>${formatPrice(b.totalPrice || 0)}</td>
                            <td>${statusBadge(b.status)}</td>
                            <td>${b.assignedVendorName
                                ? `<span class="vendor-label"><i class="fas fa-store" style="margin-right:4px;color:var(--teal);"></i>${b.assignedVendorName}</span>`
                                : `<span class="vendor-label" style="color:var(--text-muted);">—</span>`}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        console.error('Dashboard load error:', err);
    }
};

// ============================================================
//  TOURS MANAGEMENT
// ============================================================
let editingTourId = null;

const loadTours = async () => {
    try {
        const res   = await fetch(`${API}/tours`);
        const json  = await res.json();
        const tours = json.data || [];
        const tbody = document.getElementById('tours-table-body');

        if (tours.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">No tours found. Add one above.</td></tr>';
            return;
        }

        tbody.innerHTML = tours.map(t => `
            <tr>
                <td><img src="${(t.images && t.images[0]) || ''}" alt="" class="tour-thumb"></td>
                <td><strong>${t.title}</strong></td>
                <td>${t.location}</td>
                <td>${formatPrice(t.price)}</td>
                <td>${t.category || 'Standard'}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-sm btn-edit" onclick="editTour('${t._id}')"><i class="fas fa-pen"></i> Edit</button>
                        <button class="btn btn-sm btn-delete" onclick="deleteTour('${t._id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Load tours error:', err);
    }
};

document.getElementById('tour-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const tourData = {
        title:       document.getElementById('t-title').value.trim(),
        price:       Number(document.getElementById('t-price').value),
        location:    document.getElementById('t-location').value.trim(),
        duration:    document.getElementById('t-duration').value.trim(),
        category:    document.getElementById('t-category').value,
        images:      [document.getElementById('t-image').value.trim()],
        description: document.getElementById('t-description').value.trim()
    };

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;

    try {
        const url    = editingTourId ? `${API}/tours/${editingTourId}` : `${API}/tours`;
        const method = editingTourId ? 'PUT' : 'POST';
        const res    = await fetch(url, { method, headers: authHeader(), body: JSON.stringify(tourData) });
        const json   = await res.json();

        if (!res.ok || !json.success) throw new Error(json.message || 'Save failed');

        showToast(editingTourId ? 'Tour updated!' : 'Tour created!');
        cancelEdit();
        document.getElementById('tour-form').reset();
        loadTours();
        loadDashboard();

    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Tour';
        submitBtn.disabled = false;
    }
});

window.editTour = async (id) => {
    try {
        const res  = await fetch(`${API}/tours/${id}`);
        const json = await res.json();
        const t    = json.data;

        editingTourId = id;
        document.getElementById('t-title').value       = t.title;
        document.getElementById('t-price').value       = t.price;
        document.getElementById('t-location').value    = t.location;
        document.getElementById('t-duration').value    = t.duration;
        document.getElementById('t-category').value    = t.category || 'Standard';
        document.getElementById('t-image').value       = (t.images && t.images[0]) || '';
        document.getElementById('t-description').value = t.description;

        document.getElementById('form-title').innerHTML      = '<i class="fas fa-edit"></i> Edit Tour';
        document.getElementById('cancel-edit').style.display = 'inline-flex';
        document.getElementById('submit-btn').innerHTML      = '<i class="fas fa-save"></i> Update Tour';
        document.getElementById('tour-form').scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
        showToast('Failed to load tour for editing', 'error');
    }
};

window.cancelEdit = () => {
    editingTourId = null;
    document.getElementById('tour-form').reset();
    document.getElementById('form-title').innerHTML      = '<i class="fas fa-plus-circle"></i> Add New Tour';
    document.getElementById('cancel-edit').style.display = 'none';
    document.getElementById('submit-btn').innerHTML      = '<i class="fas fa-save"></i> Save Tour';
};

window.deleteTour = async (id) => {
    if (!confirm('Delete this tour? This cannot be undone.')) return;
    try {
        const res  = await fetch(`${API}/tours/${id}`, { method: 'DELETE', headers: authHeader() });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Delete failed');
        showToast('Tour deleted!');
        loadTours();
        loadDashboard();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// ============================================================
//  BOOKINGS MANAGEMENT
// ============================================================
let allBookings = [];

const loadBookings = async () => {
    try {
        const res   = await fetch(`${API}/bookings`, { headers: authHeader() });
        const json  = await res.json();
        allBookings = json.data || [];
        renderBookingsTable(allBookings);
    } catch (err) {
        console.error('Load bookings error:', err);
    }
};

const renderBookingsTable = (bookings) => {
    const tbody = document.getElementById('bookings-table-body');

    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;color:var(--text-muted);">No bookings found.</td></tr>';
        return;
    }

    tbody.innerHTML = bookings.map(b => {
        const price    = b.totalPrice || 0;
        const vComm    = b.vendorCommission   || Math.round(price * 0.8);
        const pComm    = b.platformCommission || Math.round(price * 0.2);
        const assigned = b.assignedVendorName || b.assignedVendor || '';

        return `
        <tr id="row-${b._id}">
            <td><strong>${b.name}</strong><br><small style="color:var(--text-muted);">${b.email}</small></td>
            <td>${b.phone}</td>
            <td>${b.tourId ? b.tourId.title : 'Deleted Tour'}</td>
            <td>${formatDate(b.date)}</td>
            <td>${b.travelers}</td>
            <td>${formatPrice(price)}</td>
            <td>
                ${assigned
                    ? `<div class="commission-cell">
                           <span class="comm-vendor" title="Vendor share">V: ${formatPrice(vComm)}</span>
                           <span class="comm-platform" title="Platform share">P: ${formatPrice(pComm)}</span>
                       </div>`
                    : `<span style="color:var(--text-muted);font-size:0.8rem;">—</span>`
                }
            </td>
            <td>${statusBadge(b.status)}</td>
            <td>${vendorBadge(b.vendorStatus)}</td>
            <td>
                ${assigned
                    ? `<div class="assigned-vendor-cell">
                           <i class="fas fa-store"></i>
                           <span>${assigned}</span>
                       </div>`
                    : `<span class="vendor-label">—</span>`
                }
            </td>
            <td>
                <div class="action-btns" style="flex-wrap:wrap;gap:6px;">
                    ${b.status === 'pending' ? `
                        <button class="btn btn-sm btn-approve" onclick="adminBookingAction('${b._id}', 'approve')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-sm btn-delete" onclick="adminBookingAction('${b._id}', 'reject')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : b.status === 'approved' ? `
                        <button class="btn btn-sm btn-assign" onclick="openVendorModal('${b._id}', '${(b.tourId ? b.tourId.title : 'Tour').replace(/'/g,"\\'")}', ${price})">
                            <i class="fas fa-user-tie"></i> ${assigned ? 'Reassign' : 'Assign Vendor'}
                        </button>
                        <button class="btn btn-sm btn-delete" onclick="adminBookingAction('${b._id}', 'reject')" style="margin-top:0;">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : b.status === 'confirmed' ? `
                        <span style="color:#00d4b4;font-size:0.82rem;"><i class="fas fa-check-double"></i> Confirmed</span>
                    ` : `
                        <span style="color:#ff4d4d;font-size:0.82rem;text-transform:capitalize;"><i class="fas fa-times-circle"></i> ${b.status}</span>
                    `}
                </div>
            </td>
        </tr>`;
    }).join('');
};

const applyBookingsFilter = () => {
    const searchTerm   = (document.getElementById('admin-search-bookings')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('admin-status-filter')?.value || '';
    const vendorFilter = document.getElementById('admin-vendor-filter')?.value || '';

    const filtered = allBookings.filter(b => {
        const matchesSearch = !searchTerm ||
            b.name.toLowerCase().includes(searchTerm) ||
            b._id.toLowerCase().includes(searchTerm) ||
            (b.email && b.email.toLowerCase().includes(searchTerm));
        const matchesStatus = !statusFilter || (b.status === statusFilter);
        const matchesVendor = !vendorFilter || (b.vendorStatus === vendorFilter);
        return matchesSearch && matchesStatus && matchesVendor;
    });

    renderBookingsTable(filtered);
};

document.addEventListener('DOMContentLoaded', () => {
    const searchInput  = document.getElementById('admin-search-bookings');
    const statusFilter = document.getElementById('admin-status-filter');
    const vendorFilter = document.getElementById('admin-vendor-filter');
    if (searchInput)  searchInput.addEventListener('input', applyBookingsFilter);
    if (statusFilter) statusFilter.addEventListener('change', applyBookingsFilter);
    if (vendorFilter) vendorFilter.addEventListener('change', applyBookingsFilter);
});

// Admin Approve / Reject (NO prompt — clean API calls only)
window.adminBookingAction = async (id, action) => {
    const label = action === 'approve' ? 'Approve' : 'Reject';
    if (!confirm(`${label} this booking?`)) return;

    try {
        const endpoint = action === 'approve'
            ? `/admin/bookings/${id}/approve`
            : `/admin/bookings/${id}/reject`;

        const res  = await fetch(`${API}${endpoint}`, { method: 'PUT', headers: authHeader() });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Action failed');

        showToast(`Booking ${action === 'approve' ? 'Approved' : 'Rejected'} successfully!`);

        // After approving, auto-open vendor modal to prompt assignment
        if (action === 'approve') {
            const b = allBookings.find(b => b._id === id);
            if (b) {
                await loadBookings();
                const tourTitle = b.tourId ? b.tourId.title : 'Tour';
                openVendorModal(id, tourTitle, b.totalPrice || 0);
                return;
            }
        }

        loadBookings();
        loadDashboard();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// ============================================================
//  VENDOR ASSIGNMENT MODAL
// ============================================================
let _modalBookingId    = null;
let _modalBookingPrice = 0;
let _allVendors        = [];

window.openVendorModal = async (bookingId, tourTitle, price) => {
    _modalBookingId    = bookingId;
    _modalBookingPrice = price || 0;

    // Update modal info
    document.getElementById('modal-booking-info').textContent =
        `Booking for: ${tourTitle} · ${formatPrice(_modalBookingPrice)}`;

    // Reset state
    document.getElementById('vendor-card').style.display    = 'none';
    document.getElementById('no-vendors-msg').style.display = 'none';
    document.getElementById('commission-preview').style.display = 'none';
    document.getElementById('assign-vendor-btn').disabled   = true;
    document.getElementById('vendor-dropdown').value        = '';

    // Show modal
    document.getElementById('vendor-modal-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';

    // Load vendors from DB
    await fetchAndPopulateVendors();
};

window.closeVendorModal = () => {
    document.getElementById('vendor-modal-overlay').classList.remove('active');
    document.body.style.overflow = '';
    _modalBookingId = null;
};

// Close on overlay click
document.getElementById('vendor-modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('vendor-modal-overlay')) closeVendorModal();
});

// Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeVendorModal();
});

const fetchAndPopulateVendors = async () => {
    const dropdown = document.getElementById('vendor-dropdown');
    dropdown.innerHTML = '<option value="">Loading vendors...</option>';
    dropdown.disabled  = true;

    try {
        const res  = await fetch(`${API}/admin/vendors`, { headers: authHeader() });
        const json = await res.json();
        _allVendors = json.data || [];

        if (_allVendors.length === 0) {
            dropdown.innerHTML = '<option value="">No vendors registered</option>';
            document.getElementById('no-vendors-msg').style.display = 'flex';
            return;
        }

        dropdown.innerHTML = `
            <option value="">— Select a vendor —</option>
            ${_allVendors.map(v => `<option value="${v._id}">${v.name} (${v.email})</option>`).join('')}
        `;
        dropdown.disabled = false;

    } catch (err) {
        dropdown.innerHTML = '<option value="">Failed to load vendors</option>';
        showToast('Could not load vendors', 'error');
    }
};

// When admin picks a vendor from dropdown
window.onVendorDropdownChange = () => {
    const dropdown  = document.getElementById('vendor-dropdown');
    const vendorId  = dropdown.value;
    const vendor    = _allVendors.find(v => v._id === vendorId);
    const card      = document.getElementById('vendor-card');
    const assignBtn = document.getElementById('assign-vendor-btn');
    const commPrev  = document.getElementById('commission-preview');

    if (!vendor) {
        card.style.display     = 'none';
        commPrev.style.display = 'none';
        assignBtn.disabled     = true;
        return;
    }

    // Populate vendor card
    const initial = vendor.name.charAt(0).toUpperCase();
    document.getElementById('vendor-card-avatar').textContent = initial;
    document.getElementById('vendor-card-name').textContent   = vendor.name;
    document.getElementById('vendor-card-email').textContent  = vendor.email;
    card.style.display = 'flex';

    // Animate in
    card.style.animation = 'none';
    card.offsetHeight;   // force reflow
    card.style.animation = '';

    // Commission preview
    const vendorShare   = Math.round(_modalBookingPrice * 0.80);
    const platformShare = Math.round(_modalBookingPrice * 0.20);
    document.getElementById('cp-total').textContent    = formatPrice(_modalBookingPrice);
    document.getElementById('cp-vendor').textContent   = formatPrice(vendorShare);
    document.getElementById('cp-platform').textContent = formatPrice(platformShare);
    commPrev.style.display = 'grid';

    assignBtn.disabled = false;
};

window.confirmVendorAssignment = async () => {
    const vendorId  = document.getElementById('vendor-dropdown').value;
    const vendor    = _allVendors.find(v => v._id === vendorId);
    const assignBtn = document.getElementById('assign-vendor-btn');

    if (!vendorId || !vendor) {
        showToast('Please select a vendor first', 'error');
        return;
    }

    assignBtn.innerHTML  = '<i class="fas fa-spinner fa-spin"></i> Assigning...';
    assignBtn.disabled   = true;

    try {
        const res  = await fetch(`${API}/admin/bookings/${_modalBookingId}/assign-vendor`, {
            method:  'PUT',
            headers: authHeader(),
            body:    JSON.stringify({ vendorId })
        });
        const json = await res.json();

        if (!res.ok || !json.success) throw new Error(json.message || 'Assignment failed');

        showToast(`✓ Assigned to ${vendor.name} — Vendor gets ${formatPrice(json.commission?.vendor || 0)}`);
        closeVendorModal();
        loadBookings();
        loadDashboard();

    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        assignBtn.innerHTML = '<i class="fas fa-user-check"></i> Assign Vendor';
        assignBtn.disabled  = false;
    }
};

// ============================================================
//  Initialize
// ============================================================
loadDashboard();
loadTours();
loadBookings();
