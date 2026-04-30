// ============================================================
//  admin.js — RAO Travels Admin Panel (with workflow actions)
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
//  Status badge helper
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
const navItems   = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const pageTitle  = document.getElementById('page-title');
const tabNames   = { dashboard: 'Dashboard', tours: 'Manage Tours', bookings: 'Bookings' };

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

        const pending  = bookings.filter(b => b.status === 'pending').length;
        const approved = bookings.filter(b => b.status === 'approved').length;
        const confirmed = bookings.filter(b => b.status === 'confirmed').length;

        document.getElementById('stat-pending').textContent   = pending;
        document.getElementById('stat-approved').textContent  = approved;
        document.getElementById('stat-confirmed').textContent = confirmed;

        const revenue = bookings
            .filter(b => b.status === 'confirmed')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        document.getElementById('stat-revenue').textContent = formatPrice(revenue);

        // Recent bookings table
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
                            <td>${vendorBadge(b.vendorStatus)}</td>
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
        const res  = await fetch(`${API}/tours`);
        const json = await res.json();
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

        document.getElementById('form-title').innerHTML       = '<i class="fas fa-edit"></i> Edit Tour';
        document.getElementById('cancel-edit').style.display  = 'inline-flex';
        document.getElementById('submit-btn').innerHTML        = '<i class="fas fa-save"></i> Update Tour';
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
    document.getElementById('submit-btn').innerHTML       = '<i class="fas fa-save"></i> Save Tour';
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
//  BOOKINGS MANAGEMENT — with Approve / Reject workflow
// ============================================================
const loadBookings = async () => {
    try {
        const res     = await fetch(`${API}/bookings`, { headers: authHeader() });
        const json    = await res.json();
        const bookings = json.data || [];
        const tbody   = document.getElementById('bookings-table-body');

        if (bookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--text-muted);">No bookings yet.</td></tr>';
            return;
        }

        tbody.innerHTML = bookings.map(b => `
            <tr id="row-${b._id}">
                <td><strong>${b.name}</strong><br><small style="color:var(--text-muted);">${b.email}</small></td>
                <td>${b.phone}</td>
                <td>${b.tourId ? b.tourId.title : 'Deleted Tour'}</td>
                <td>${formatDate(b.date)}</td>
                <td>${b.travelers}</td>
                <td>${formatPrice(b.totalPrice || 0)}</td>
                <td>${statusBadge(b.status)}</td>
                <td>${vendorBadge(b.vendorStatus)}</td>
                <td><span class="vendor-label">${b.assignedVendor || '—'}</span></td>
                <td>
                    <div class="action-btns">
                        ${b.status === 'pending' ? `
                            <button class="btn btn-sm btn-approve" onclick="adminBookingAction('${b._id}', 'approve')">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button class="btn btn-sm btn-delete" onclick="adminBookingAction('${b._id}', 'reject')">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        ` : b.status === 'approved' ? `
                            <span style="color:var(--teal);font-size:0.82rem;"><i class="fas fa-hourglass-half"></i> Awaiting Vendor</span>
                            <button class="btn btn-sm btn-delete" onclick="adminBookingAction('${b._id}', 'reject')" style="margin-top:4px;">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        ` : b.status === 'confirmed' ? `
                            <span style="color:#00d4b4;font-size:0.82rem;"><i class="fas fa-check-double"></i> Confirmed</span>
                        ` : `
                            <span style="color:#ff4d4d;font-size:0.82rem;text-transform:capitalize;"><i class="fas fa-times-circle"></i> ${b.status}</span>
                        `}
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Load bookings error:', err);
    }
};

// Admin Approve / Reject
window.adminBookingAction = async (id, action) => {
    const label = action === 'approve' ? 'Approve' : 'Reject';
    let assignedVendor = '';

    if (action === 'approve') {
        assignedVendor = prompt('Assign vendor name (optional):', 'RAO Travels Local Team') || '';

    if (!confirm(`${label} this booking?`)) return;

    try {
        const endpoint = action === 'approve' ? `/admin/bookings/${id}/approve` : `/admin/bookings/${id}/reject`;
        const res = await fetch(`${API}${endpoint}`, {
            method:  'PUT',
            headers: authHeader()
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Action failed');

        showToast(`Booking ${action === 'approve' ? 'Approved' : 'Rejected'} successfully!`);
        loadBookings();
        loadDashboard();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// ============================================================
//  Initialize
// ============================================================
loadDashboard();
loadTours();
loadBookings();
