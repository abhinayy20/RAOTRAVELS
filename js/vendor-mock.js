/**
 * vendor-mock.js
 * Mock data system & section renderers for RAO Travels Vendor Dashboard
 * Activated automatically when the backend API is unavailable.
 */

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_VENDOR = {
    _id: 'mock_v001',
    fullName: 'Rajesh Kumar',
    companyName: 'Kumar Himalayan Travels',
    email: 'rajesh@kumartravels.in',
    phone: '+91 98765 43210',
    specialization: 'Adventure',
    region: 'North India',
    isApproved: true,
    createdAt: '2024-01-15T10:00:00.000Z'
};

const MOCK_BOOKINGS = [
    { _id:'BK2501', tourId:{title:'Ladakh Bike Expedition',category:'Adventure'},    customerName:'Amit Sharma',       customerEmail:'amit.sharma@gmail.com',     customerPhone:'+91 98111 22333', travelDate:'2026-06-15', travelers:2, totalAmount:64000,  vendorCommission:6400, vendorStatus:'pending',  tripStatus:'upcoming',   payoutStatus:'unpaid',  createdAt:'2026-05-10T09:00:00Z' },
    { _id:'BK2502', tourId:{title:'Kashmir Houseboat Experience',category:'Luxury'}, customerName:'Priya Mehta',        customerEmail:'priya.mehta@yahoo.com',     customerPhone:'+91 99222 33444', travelDate:'2026-06-22', travelers:4, totalAmount:96000,  vendorCommission:9600, vendorStatus:'pending',  tripStatus:'upcoming',   payoutStatus:'unpaid',  createdAt:'2026-05-11T11:00:00Z' },
    { _id:'BK2503', tourId:{title:'Manali Snow Trek',category:'Adventure'},          customerName:'Rohit Patel',        customerEmail:'rohit.patel@gmail.com',     customerPhone:'+91 97333 44555', travelDate:'2026-07-01', travelers:3, totalAmount:42000,  vendorCommission:4200, vendorStatus:'pending',  tripStatus:'upcoming',   payoutStatus:'unpaid',  createdAt:'2026-05-12T14:00:00Z' },
    { _id:'BK2504', tourId:{title:'Spiti Valley Expedition',category:'Adventure'},   customerName:'Sunita Verma',       customerEmail:'sunita.v@hotmail.com',      customerPhone:'+91 96444 55666', travelDate:'2026-06-10', travelers:2, totalAmount:52000,  vendorCommission:5200, vendorStatus:'accepted', tripStatus:'ongoing',    payoutStatus:'unpaid',  createdAt:'2026-05-05T08:00:00Z' },
    { _id:'BK2505', tourId:{title:'Chopta Chandrashila Trek',category:'Adventure'},  customerName:'Vikas Gupta',        customerEmail:'vikas.g@gmail.com',         customerPhone:'+91 95555 66777', travelDate:'2026-06-18', travelers:5, totalAmount:55000,  vendorCommission:5500, vendorStatus:'accepted', tripStatus:'upcoming',   payoutStatus:'unpaid',  createdAt:'2026-05-06T10:00:00Z' },
    { _id:'BK2506', tourId:{title:'Kedarnath Pilgrimage',category:'Spiritual'},      customerName:'Anita Joshi',        customerEmail:'anita.joshi@gmail.com',     customerPhone:'+91 94666 77888', travelDate:'2026-06-25', travelers:6, totalAmount:78000,  vendorCommission:7800, vendorStatus:'accepted', tripStatus:'upcoming',   payoutStatus:'unpaid',  createdAt:'2026-05-07T12:00:00Z' },
    { _id:'BK2507', tourId:{title:'Rishikesh White Water Rafting',category:'Adventure'}, customerName:'Deepak Singh',   customerEmail:'deepak.s@outlook.com',     customerPhone:'+91 93777 88999', travelDate:'2026-07-10', travelers:4, totalAmount:44000,  vendorCommission:4400, vendorStatus:'accepted', tripStatus:'upcoming',   payoutStatus:'unpaid',  createdAt:'2026-05-08T15:00:00Z' },
    { _id:'BK2508', tourId:{title:'Kullu Manali Getaway',category:'Family'},         customerName:'Neha Agarwal',       customerEmail:'neha.a@gmail.com',          customerPhone:'+91 92888 99000', travelDate:'2026-04-20', travelers:4, totalAmount:68000,  vendorCommission:6800, vendorStatus:'accepted', tripStatus:'completed',  payoutStatus:'paid',    createdAt:'2026-04-10T09:00:00Z', completedAt:'2026-04-26T10:00:00Z' },
    { _id:'BK2509', tourId:{title:'Dharamshala Wellness Retreat',category:'Wellness'}, customerName:'Raj Malhotra',     customerEmail:'raj.m@gmail.com',           customerPhone:'+91 91999 00111', travelDate:'2026-04-05', travelers:2, totalAmount:38000,  vendorCommission:3800, vendorStatus:'accepted', tripStatus:'completed',  payoutStatus:'paid',    createdAt:'2026-03-28T09:00:00Z', completedAt:'2026-04-10T12:00:00Z' },
    { _id:'BK2510', tourId:{title:'Nainital Lake Package',category:'Family'},        customerName:'Kavita Roy',         customerEmail:'kavita.r@yahoo.com',        customerPhone:'+91 90000 11222', travelDate:'2026-03-15', travelers:3, totalAmount:33000,  vendorCommission:3300, vendorStatus:'accepted', tripStatus:'completed',  payoutStatus:'paid',    createdAt:'2026-03-05T10:00:00Z', completedAt:'2026-03-19T11:00:00Z' },
    { _id:'BK2511', tourId:{title:'Mussoorie Honeymoon Special',category:'Honeymoon'}, customerName:'Sanjay & Pooja Kumar', customerEmail:'sanjay.pk@gmail.com', customerPhone:'+91 89111 22333', travelDate:'2026-03-01', travelers:2, totalAmount:42000,  vendorCommission:4200, vendorStatus:'accepted', tripStatus:'completed',  payoutStatus:'unpaid',  createdAt:'2026-02-20T11:00:00Z', completedAt:'2026-03-06T09:00:00Z' },
    { _id:'BK2512', tourId:{title:'Jim Corbett Wildlife Safari',category:'Adventure'}, customerName:'Meera Tiwari',    customerEmail:'meera.t@gmail.com',         customerPhone:'+91 88222 33444', travelDate:'2026-02-10', travelers:4, totalAmount:56000,  vendorCommission:5600, vendorStatus:'accepted', tripStatus:'completed',  payoutStatus:'unpaid',  createdAt:'2026-02-01T08:00:00Z', completedAt:'2026-02-15T10:00:00Z' }
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function fmt(date) {
    return date ? new Date(date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
}
function inr(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
}
function badge(text, type) {
    const colors = {
        pending:   'color:#f5c842;background:rgba(245,200,66,0.12);border:1px solid rgba(245,200,66,0.3)',
        accepted:  'color:#00d4b4;background:rgba(0,212,180,0.12);border:1px solid rgba(0,212,180,0.3)',
        completed: 'color:#34d399;background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.3)',
        rejected:  'color:#ff4d4d;background:rgba(255,77,77,0.12);border:1px solid rgba(255,77,77,0.3)',
        ongoing:   'color:#667eea;background:rgba(102,126,234,0.12);border:1px solid rgba(102,126,234,0.3)',
        paid:      'color:#34d399;background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.3)',
        unpaid:    'color:#ff4d4d;background:rgba(255,77,77,0.12);border:1px solid rgba(255,77,77,0.3)',
        upcoming:  'color:#fbbf24;background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.3)'
    };
    const style = colors[type] || colors['pending'];
    return `<span style="padding:3px 10px;border-radius:20px;font-size:0.78rem;font-weight:600;${style}">${text}</span>`;
}
function actionBtns(booking) {
    if (booking.vendorStatus === 'pending') {
        return `<button onclick="mockAccept('${booking._id}')" style="padding:5px 12px;background:#00d4b4;color:#0f1419;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.8rem;margin-right:6px;transition:opacity 0.2s" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1"><i class="fas fa-check"></i> Accept</button>
                <button onclick="mockReject('${booking._id}')" style="padding:5px 12px;background:rgba(255,77,77,0.15);color:#ff4d4d;border:1px solid rgba(255,77,77,0.3);border-radius:8px;cursor:pointer;font-weight:600;font-size:0.8rem;transition:opacity 0.2s" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1"><i class="fas fa-times"></i> Reject</button>`;
    }
    if (booking.vendorStatus === 'accepted' && booking.tripStatus !== 'completed') {
        return `<button onclick="mockComplete('${booking._id}')" style="padding:5px 14px;background:rgba(245,200,66,0.15);color:#f5c842;border:1px solid rgba(245,200,66,0.3);border-radius:8px;cursor:pointer;font-weight:600;font-size:0.8rem;transition:opacity 0.2s" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1"><i class="fas fa-flag-checkered"></i> Mark Complete</button>`;
    }
    return `<span style="color:#8b95a5;font-size:0.85rem">—</span>`;
}
function emptyRow(colspan, msg) {
    return `<tr><td colspan="${colspan}" style="text-align:center;padding:40px;color:#8b95a5;"><i class="fas fa-inbox" style="font-size:1.5rem;opacity:0.4;display:block;margin-bottom:10px"></i>${msg}</td></tr>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK ACTIONS (update in-memory array + refresh)
// ─────────────────────────────────────────────────────────────────────────────
window.mockAccept = function(id) {
    const b = bookingsData.find(x => x._id === id);
    if (b) { b.vendorStatus = 'accepted'; b.tripStatus = 'upcoming'; }
    renderAssigned(); renderAccepted();
    updateDashboard();
    showVendorToast('Trip accepted successfully!', 'success');
};
window.mockReject = function(id) {
    const idx = bookingsData.findIndex(x => x._id === id);
    if (idx !== -1) bookingsData.splice(idx, 1);
    renderAssigned();
    updateDashboard();
    showVendorToast('Trip rejected.', 'warning');
};
window.mockComplete = function(id) {
    const b = bookingsData.find(x => x._id === id);
    if (b) { b.tripStatus = 'completed'; b.vendorStatus = 'accepted'; b.completedAt = new Date().toISOString(); }
    renderAccepted(); renderCompleted();
    updateDashboard();
    showVendorToast('Trip marked as completed!', 'success');
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION RENDERERS
// ─────────────────────────────────────────────────────────────────────────────

window.renderAssigned = function() {
    const tbody = document.getElementById('assignedBody');
    const countEl = document.getElementById('assignedCount');
    if (!tbody) return;
    const list = bookingsData.filter(b => b.vendorStatus === 'pending');
    if (countEl) countEl.textContent = list.length + ' trip' + (list.length !== 1 ? 's' : '');
    if (!list.length) { tbody.innerHTML = emptyRow(6, 'No pending trips assigned'); return; }
    tbody.innerHTML = list.map(b => `
        <tr>
            <td><strong style="color:var(--primary)">${b._id}</strong></td>
            <td><div style="font-weight:600">${b.tourId.title}</div><div style="font-size:0.78rem;color:#8b95a5;margin-top:2px">${b.tourId.category}</div></td>
            <td><div>${b.customerName}</div><div style="font-size:0.78rem;color:#8b95a5">${b.customerEmail}</div></td>
            <td>${fmt(b.travelDate)}<div style="font-size:0.78rem;color:#8b95a5">${b.travelers} traveller${b.travelers!==1?'s':''}</div></td>
            <td>${badge(b.vendorStatus, b.vendorStatus)}</td>
            <td>${actionBtns(b)}</td>
        </tr>`).join('');
};

window.renderAccepted = function() {
    const tbody = document.getElementById('acceptedBody');
    const countEl = document.getElementById('acceptedCount');
    if (!tbody) return;
    const list = bookingsData.filter(b => b.vendorStatus === 'accepted' && b.tripStatus !== 'completed');
    if (countEl) countEl.textContent = list.length + ' trip' + (list.length !== 1 ? 's' : '');
    if (!list.length) { tbody.innerHTML = emptyRow(6, 'No active accepted trips'); return; }
    tbody.innerHTML = list.map(b => `
        <tr>
            <td><strong style="color:var(--primary)">${b._id}</strong></td>
            <td><div style="font-weight:600">${b.tourId.title}</div><div style="font-size:0.78rem;color:#8b95a5">${b.tourId.category}</div></td>
            <td><div>${b.customerName}</div><div style="font-size:0.78rem;color:#8b95a5">${b.customerPhone}</div></td>
            <td>${fmt(b.travelDate)}</td>
            <td><strong style="color:#34d399">${inr(b.vendorCommission)}</strong></td>
            <td>${badge(b.tripStatus, b.tripStatus)} ${actionBtns(b)}</td>
        </tr>`).join('');
};

window.renderCompleted = function() {
    const tbody = document.getElementById('completedBody');
    const countEl = document.getElementById('completedCount');
    if (!tbody) return;
    const list = bookingsData.filter(b => b.tripStatus === 'completed');
    if (countEl) countEl.textContent = list.length + ' trip' + (list.length !== 1 ? 's' : '');
    if (!list.length) { tbody.innerHTML = emptyRow(6, 'No completed trips yet'); return; }
    tbody.innerHTML = list.map(b => `
        <tr>
            <td><strong style="color:var(--primary)">${b._id}</strong></td>
            <td style="font-weight:600">${b.tourId.title}</td>
            <td>${b.customerName}</td>
            <td>${fmt(b.completedAt || b.travelDate)}</td>
            <td><strong style="color:#34d399">${inr(b.vendorCommission)}</strong></td>
            <td>${badge(b.payoutStatus === 'paid' ? 'Paid' : 'Unpaid', b.payoutStatus)}</td>
        </tr>`).join('');
};

window.renderPayouts = function() {
    const completed = bookingsData.filter(b => b.tripStatus === 'completed');
    const totalEarned  = completed.reduce((s, b) => s + (b.vendorCommission || 0), 0);
    const paidOut      = completed.filter(b => b.payoutStatus === 'paid').reduce((s, b) => s + (b.vendorCommission || 0), 0);
    const pendingPay   = totalEarned - paidOut;

    const se = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    se('totalEarned',  inr(totalEarned));
    se('pendingPayout', inr(pendingPay));
    se('paidOut',       inr(paidOut));

    const tbody = document.getElementById('payoutsBody');
    if (!tbody) return;
    if (!completed.length) { tbody.innerHTML = emptyRow(5, 'No payout records yet'); return; }
    tbody.innerHTML = completed.map(b => `
        <tr>
            <td><strong style="color:var(--primary)">${b._id}</strong></td>
            <td>${b.tourId.title}</td>
            <td><strong style="color:#34d399">${inr(b.vendorCommission)}</strong></td>
            <td>${badge(b.payoutStatus === 'paid' ? 'Paid' : 'Pending', b.payoutStatus === 'paid' ? 'paid' : 'unpaid')}</td>
            <td>${fmt(b.completedAt || b.travelDate)}</td>
        </tr>`).join('');
};

window.renderCommission = function() {
    const tbody = document.getElementById('commissionBody');
    if (!tbody) return;
    // Group by month
    const byMonth = {};
    bookingsData.filter(b => b.tripStatus === 'completed').forEach(b => {
        const key = new Date(b.completedAt || b.travelDate).toLocaleDateString('en-IN', { month:'long', year:'numeric' });
        if (!byMonth[key]) byMonth[key] = { trips: 0, gross: 0, commission: 0 };
        byMonth[key].trips++;
        byMonth[key].gross += b.totalAmount || 0;
        byMonth[key].commission += b.vendorCommission || 0;
    });
    const months = Object.entries(byMonth);
    if (!months.length) { tbody.innerHTML = emptyRow(5, 'No commission history yet'); return; }
    tbody.innerHTML = months.map(([month, d]) => {
        const rate = d.trips >= 25 ? '20%' : d.trips >= 10 ? '15%' : '10%';
        return `<tr>
            <td style="font-weight:600">${month}</td>
            <td>${d.trips}</td>
            <td>${badge(rate, d.trips >= 10 ? 'accepted' : 'pending')}</td>
            <td>${inr(d.gross)}</td>
            <td><strong style="color:#34d399">${inr(d.commission)}</strong></td>
        </tr>`;
    }).join('');
};

window.renderCustomers = function() {
    const tbody = document.getElementById('customersBody');
    const countEl = document.getElementById('customersCount');
    if (!tbody) return;
    // Unique customers (by email)
    const seen = new Set();
    const customers = bookingsData.filter(b => {
        if (seen.has(b.customerEmail)) return false;
        seen.add(b.customerEmail);
        return true;
    });
    if (countEl) countEl.textContent = customers.length + ' customer' + (customers.length !== 1 ? 's' : '');
    if (!customers.length) { tbody.innerHTML = emptyRow(6, 'No customer records yet'); return; }
    tbody.innerHTML = customers.map(b => `
        <tr>
            <td><div style="font-weight:600">${b.customerName}</div></td>
            <td><a href="mailto:${b.customerEmail}" style="color:var(--secondary)">${b.customerEmail}</a></td>
            <td>${b.customerPhone}</td>
            <td style="font-weight:600">${b.tourId.title}</td>
            <td>${fmt(b.createdAt)}</td>
            <td>${badge(b.tripStatus, b.tripStatus)}</td>
        </tr>`).join('');
};

// ─────────────────────────────────────────────────────────────────────────────
// INIT – called from vendor.js on API failure
// ─────────────────────────────────────────────────────────────────────────────
window.loadMockData = function() {
    vendorData   = MOCK_VENDOR;
    bookingsData = JSON.parse(JSON.stringify(MOCK_BOOKINGS)); // deep copy
};

// Toast helper (no-op if vendor-toast.js already loaded)
window.showVendorToast = window.showVendorToast || function(msg, type) {
    const c = document.getElementById('toastContainer');
    if (!c) return;
    const t = document.createElement('div');
    const icon = { success:'check-circle', error:'times-circle', warning:'exclamation-circle', info:'info-circle' }[type] || 'info-circle';
    t.className = `toast ${type || 'info'}`;
    t.innerHTML = `<i class="fas fa-${icon}"></i><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3500);
};
