// ============================================================
//  details.js — Fetches a single tour by ID from the API
//               and renders the full details page dynamically
// ============================================================

const API_BASE = CONFIG.API_BASE + '/api/tours';

// Format number as Indian currency
const formatPrice = (price) => '₹' + Number(price).toLocaleString('en-IN');

// Read ?id= from the URL
const getTourIdFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
};

// Render the full tour into the page
const renderTour = (tour) => {
    // Update browser tab title
    document.title = `${tour.title} | RAO TRAVELS`;

    // Update the hero background + heading
    const pageHero = document.querySelector('.page-hero');
    if (pageHero && tour.images && tour.images[0]) {
        pageHero.style.backgroundImage = `url('${tour.images[0]}')`;
    }
    const heroH1 = document.querySelector('.page-hero h1');
    if (heroH1) heroH1.textContent = tour.title;

    // Update breadcrumb last item
    const breadcrumbSpan = document.querySelector('.breadcrumbs span');
    if (breadcrumbSpan) breadcrumbSpan.textContent = tour.location || tour.title;

    // --- Sidebar ---
    const priceAmount = document.querySelector('.price-amount');
    if (priceAmount) priceAmount.innerHTML = `${formatPrice(tour.price)} <span class="old-price"></span>`;

    const waBookLink = document.querySelector('.booking-widget .w-100');
    if (waBookLink) {
        const waText = encodeURIComponent(`Hello, I want to book the ${tour.title} for ${formatPrice(tour.price)}.`);
        waBookLink.href = `https://wa.me/917985815601?text=${waText}`;
    }

    // --- Main Content ---
    // Overview meta items
    const durationEl = document.querySelector('.meta-item strong:nth-of-type(1)');
    const locationEl = document.querySelector('.meta-item strong:nth-of-type(2)');

    // More robust: select all meta-item strong tags and fill by position
    const metaStrongs = document.querySelectorAll('.meta-item strong');
    if (metaStrongs[0]) metaStrongs[0].textContent = tour.duration || 'N/A';
    if (metaStrongs[1]) metaStrongs[1].textContent = tour.location || 'N/A';

    // Overview description
    const overviewP = document.querySelector('.content-card p');
    if (overviewP) overviewP.textContent = tour.description || 'Full details coming soon.';

    // Gallery: fill all 4 slots with the first image if only one is provided
    const galleryImgs = document.querySelectorAll('.gallery-grid img');
    galleryImgs.forEach((img, i) => {
        const src = (tour.images && tour.images[i]) ? tour.images[i] : (tour.images && tour.images[0]) || '';
        if (src) {
            img.src = src;
            img.alt = `${tour.title} - photo ${i + 1}`;
        }
    });
};

// Show a helpful error message in the hero area
const renderError = (message) => {
    document.title = 'Tour Not Found | RAO TRAVELS';
    const heroH1 = document.querySelector('.page-hero h1');
    if (heroH1) heroH1.textContent = 'Tour Not Found';

    const detailSection = document.querySelector('.package-detail-section');
    if (detailSection) {
        detailSection.innerHTML = `
            <div style="text-align:center; padding: 100px 20px; color: var(--text-muted);">
                <i class="fas fa-exclamation-circle" style="font-size:4rem; color:var(--gold); display:block; margin-bottom:20px;"></i>
                <h2 style="color:var(--text-primary); margin-bottom:15px;">Oops! ${message}</h2>
                <p style="margin-bottom:30px;">The tour you are looking for doesn't exist or the backend is offline.</p>
                <a href="index.html#packages" class="btn-primary" style="display:inline-block;">← Back to Packages</a>
            </div>
        `;
    }
};

// Main function
const loadTourDetails = async () => {
    const id = getTourIdFromURL();

    if (!id) {
        renderError('No tour ID provided.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/${id}`);

        if (response.status === 404) {
            renderError('Tour not found.');
            return;
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = await response.json();
        renderTour(json.data);

    } catch (error) {
        console.error('Failed to load tour details:', error.message);
        renderError('Could not connect to server. Make sure the backend is running.');
    }
};

// Run on page load
loadTourDetails();

// ============================================================
//  Booking Form Submission — with validation + spinner
// ============================================================

const BOOKING_API = CONFIG.API_BASE + '/api/bookings';

// ---- Validation helpers ------------------------------------
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => /^[+]?[\d\s\-()]{7,15}$/.test(v);

const setFieldError = (id, msg) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('input-error');
    let hint = el.parentElement.querySelector('.field-hint');
    if (!hint) {
        hint = document.createElement('span');
        hint.className = 'field-hint';
        el.parentElement.appendChild(hint);
    }
    hint.textContent = msg;
};

const clearFieldError = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('input-error');
    const hint = el.parentElement.querySelector('.field-hint');
    if (hint) hint.textContent = '';
};

const clearAllErrors = () => {
    ['b-name', 'b-email', 'b-phone', 'b-date'].forEach(clearFieldError);
};

const validateBookingForm = (data) => {
    let valid = true;
    clearAllErrors();

    if (!data.name || data.name.length < 2) {
        setFieldError('b-name', 'Please enter your full name (min 2 characters).');
        valid = false;
    }
    if (!data.email || !isValidEmail(data.email)) {
        setFieldError('b-email', 'Please enter a valid email address.');
        valid = false;
    }
    if (!data.phone || !isValidPhone(data.phone)) {
        setFieldError('b-phone', 'Please enter a valid phone number.');
        valid = false;
    }
    if (!data.date) {
        setFieldError('b-date', 'Please select a travel date.');
        valid = false;
    }
    return valid;
};

// ---- Spinner overlay ---------------------------------------
const showSpinner = () => {
    let overlay = document.getElementById('booking-spinner');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'booking-spinner';
        overlay.innerHTML = `
            <div class="spinner-ring"></div>
            <p>Confirming your booking…</p>
        `;
        document.querySelector('.booking-widget').appendChild(overlay);
    }
    overlay.style.display = 'flex';
};

const hideSpinner = () => {
    const overlay = document.getElementById('booking-spinner');
    if (overlay) overlay.style.display = 'none';
};

// ---- Form setup --------------------------------------------
const setupBookingForm = () => {
    const form = document.getElementById('booking-form');
    if (!form) return;

    // Set minimum date to today
    const dateInput = document.getElementById('b-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }

    // Live clear errors on input
    ['b-name', 'b-email', 'b-phone', 'b-date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => clearFieldError(id));
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const tourId = getTourIdFromURL();
        const errorDiv = document.getElementById('booking-error');
        const bookBtn  = document.getElementById('book-btn');

        if (!tourId) {
            errorDiv.textContent = 'Tour ID is missing. Please go back and try again.';
            errorDiv.style.display = 'block';
            return;
        }

        const bookingData = {
            name:      document.getElementById('b-name').value.trim(),
            email:     document.getElementById('b-email').value.trim(),
            phone:     document.getElementById('b-phone').value.trim(),
            tourId,
            date:      document.getElementById('b-date').value,
            travelers: document.getElementById('b-travelers').value
        };

        // Client-side validation
        if (!validateBookingForm(bookingData)) {
            // Scroll to first error
            const firstErr = form.querySelector('.input-error');
            if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // Show spinner & disable button
        bookBtn.disabled = true;
        bookBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processing…';
        errorDiv.style.display = 'none';
        showSpinner();

        try {
            const response = await fetch(BOOKING_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });

            const json = await response.json();

            if (!response.ok || !json.success) {
                throw new Error(json.message || 'Booking failed. Please try again.');
            }

            // Success — redirect
            window.location.href = `booking-success.html?id=${json.bookingId}`;

        } catch (error) {
            hideSpinner();
            errorDiv.textContent = error.message || 'Something went wrong. Please try again.';
            errorDiv.style.display = 'block';
            bookBtn.disabled = false;
            bookBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirm Booking';
        }
    });
};

// Initialize form after page loads
setupBookingForm();
