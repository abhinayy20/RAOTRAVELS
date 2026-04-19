// ============================================================
//  admin.js — RAO Travels Admin Panel
// ============================================================

const API = CONFIG.API_BASE + '/api';
const formatPrice = (p) => '₹' + Number(p).toLocaleString('en-IN');
const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });

// ============================================================
//  Toast Notifications
// ============================================================
const showToast = (msg, type = 'success') => {
    const toast = document.getElementById('toast');
    toast.className = `toast ${type} show`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${msg}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
};

// ============================================================
//  Tab Navigation
// ============================================================
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const pageTitle = document.getElementById('page-title');
const tabNames = { dashboard: 'Dashboard', tours: 'Manage Tours', bookings: 'Bookings' };

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navItems.forEach(n => n.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active'));
        item.classList.add('active');
        const tab = item.getAttribute('data-tab');
        document.getElementById(`tab-${tab}`).classList.add('active');
        pageTitle.textContent = tabNames[tab] || 'Dashboard';
        // Close sidebar on mobile
        document.getElementById('sidebar').classList.remove('open');
    });
});

// Mobile menu toggle
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
            fetch(`${API}/bookings`).then(r => r.json())
        ]);

        const tours = toursRes.data || [];
        const bookings = bookingsRes.data || [];

        document.getElementById('stat-tours').textContent = tours.length;
        document.getElementById('stat-bookings').textContent = bookings.length;

        const confirmed = bookings.filter(b => b.status === 'Confirmed');
        document.getElementById('stat-confirmed').textContent = confirmed.length;

        const revenue = confirmed.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        document.getElementById('stat-revenue').textContent = formatPrice(revenue);

        // Recent bookings (last 5)
        const recent = bookings.slice(0, 5);
        const recentDiv = document.getElementById('recent-bookings');

        if (recent.length === 0) {
            recentDiv.innerHTML = '<p style="color:var(--text-muted);">No bookings yet.</p>';
            return;
        }

        recentDiv.innerHTML = `
            <table>
                <thead><tr>
                    <th>Name</th><th>Tour</th><th>Date</th><th>Amount</th><th>Status</th>
                </tr></thead>
                <tbody>
                    ${recent.map(b => `
                        <tr>
                            <td>${b.name}</td>
                            <td>${b.tourId ? b.tourId.title : 'N/A'}</td>
                            <td>${formatDate(b.date)}</td>
                            <td>${formatPrice(b.totalPrice || 0)}</td>
                            <td><span class="status-select ${b.status}" style="cursor:default;">${b.status}</span></td>
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
        const res = await fetch(`${API}/tours`);
        const json = await res.json();
        const tours = json.data || [];
        const tbody = document.getElementById('tours-table-body');

        if (tours.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No tours found. Add one above.</td></tr>';
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

// Handle tour form submission (Create or Update)
document.getElementById('tour-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const tourData = {
        title: document.getElementById('t-title').value.trim(),
        price: Number(document.getElementById('t-price').value),
        location: document.getElementById('t-location').value.trim(),
        duration: document.getElementById('t-duration').value.trim(),
        category: document.getElementById('t-category').value,
        images: [document.getElementById('t-image').value.trim()],
        description: document.getElementById('t-description').value.trim()
    };

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;

    try {
        let url = `${API}/tours`;
        let method = 'POST';

        if (editingTourId) {
            url = `${API}/tours/${editingTourId}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tourData)
        });

        const json = await res.json();

        if (!res.ok || !json.success) throw new Error(json.message || 'Save failed');

        showToast(editingTourId ? 'Tour updated successfully!' : 'Tour created successfully!');
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

// Edit tour — load data into form
window.editTour = async (id) => {
    try {
        const res = await fetch(`${API}/tours/${id}`);
        const json = await res.json();
        const t = json.data;

        editingTourId = id;
        document.getElementById('edit-tour-id').value = id;
        document.getElementById('t-title').value = t.title;
        document.getElementById('t-price').value = t.price;
        document.getElementById('t-location').value = t.location;
        document.getElementById('t-duration').value = t.duration;
        document.getElementById('t-category').value = t.category || 'Standard';
        document.getElementById('t-image').value = (t.images && t.images[0]) || '';
        document.getElementById('t-description').value = t.description;

        document.getElementById('form-title').innerHTML = '<i class="fas fa-edit"></i> Edit Tour';
        document.getElementById('cancel-edit').style.display = 'inline-flex';
        document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save"></i> Update Tour';

        // Scroll to form
        document.getElementById('tour-form').scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
        showToast('Failed to load tour for editing', 'error');
    }
};

// Cancel edit — reset form state
window.cancelEdit = () => {
    editingTourId = null;
    document.getElementById('edit-tour-id').value = '';
    document.getElementById('tour-form').reset();
    document.getElementById('form-title').innerHTML = '<i class="fas fa-plus-circle"></i> Add New Tour';
    document.getElementById('cancel-edit').style.display = 'none';
    document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save"></i> Save Tour';
};

// Delete tour
window.deleteTour = async (id) => {
    if (!confirm('Are you sure you want to delete this tour? This cannot be undone.')) return;

    try {
        const res = await fetch(`${API}/tours/${id}`, { method: 'DELETE' });
        const json = await res.json();

        if (!res.ok || !json.success) throw new Error(json.message || 'Delete failed');

        showToast('Tour deleted successfully!');
        loadTours();
        loadDashboard();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// ============================================================
//  BOOKINGS MANAGEMENT
// ============================================================
const loadBookings = async () => {
    try {
        const res = await fetch(`${API}/bookings`);
        const json = await res.json();
        const bookings = json.data || [];
        const tbody = document.getElementById('bookings-table-body');

        if (bookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted);">No bookings yet.</td></tr>';
            return;
        }

        tbody.innerHTML = bookings.map(b => `
            <tr>
                <td><strong>${b.name}</strong></td>
                <td>${b.email}</td>
                <td>${b.phone}</td>
                <td>${b.tourId ? b.tourId.title : 'Deleted Tour'}</td>
                <td>${formatDate(b.date)}</td>
                <td>${b.travelers}</td>
                <td>${formatPrice(b.totalPrice || 0)}</td>
                <td>
                    <select class="status-select ${b.status}" onchange="updateBookingStatus('${b._id}', this.value, this)">
                        <option value="Pending" ${b.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Confirmed" ${b.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="Cancelled" ${b.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Load bookings error:', err);
    }
};

// Update booking status
window.updateBookingStatus = async (id, status, selectEl) => {
    try {
        const res = await fetch(`${API}/bookings/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Update failed');

        // Update dropdown color
        selectEl.className = `status-select ${status}`;
        showToast(`Booking ${status.toLowerCase()} successfully!`);
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
