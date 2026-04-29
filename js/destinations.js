// ============================================================
//  destinations.js — Fetches all tours and powers the
//  search + category filter on the Destinations page.
// ============================================================

const DEST_API = CONFIG.API_BASE + '/api/tours';

// ---- Helpers -----------------------------------------------

const formatPrice = (price) =>
    '₹' + Number(price).toLocaleString('en-IN');

// Build a single tour card (same visual style as fetch.js)
const buildCard = (tour, index) => {
    const image = (tour.images && tour.images.length > 0)
        ? tour.images[0]
        : 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80';

    const waText = encodeURIComponent(`Hello, I'm interested in booking the ${tour.title} package!`);
    const detailsUrl = `package-details.html?id=${tour._id}`;
    const delayClass = index % 3 === 1 ? 'reveal-delay-1' : index % 3 === 2 ? 'reveal-delay-2' : '';

    return `
        <div class="package-card glass reveal ${delayClass}"
             data-title="${(tour.title || '').toLowerCase()}"
             data-location="${(tour.location || '').toLowerCase()}"
             data-category="${(tour.category || '').toLowerCase()}">

            <div class="discount-badge">${tour.category || 'TOUR'}</div>

            <a href="${detailsUrl}" style="display:block; text-decoration:none;">
                <img src="${image}" alt="${tour.title}" class="package-img">
            </a>

            <div class="package-content">
                <h3 class="package-title">
                    <a href="${detailsUrl}" style="color:inherit; text-decoration:none;">${tour.title}</a>
                </h3>

                <div class="package-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${tour.location}</span>
                    <span><i class="fas fa-star"></i> ${tour.rating || '4.8'}</span>
                </div>

                <div class="package-meta" style="margin-top:6px;">
                    <span><i class="far fa-clock"></i> ${tour.duration}</span>
                </div>

                <div class="package-price">${formatPrice(tour.price)}</div>

                <div class="package-actions">
                    <a href="${detailsUrl}" class="btn-outline" style="flex:1; text-align:center;">Details</a>
                    <a href="https://wa.me/917985815601?text=${waText}"
                       target="_blank" class="btn-primary" style="flex:1; text-align:center;">Book</a>
                </div>
            </div>
        </div>
    `;
};

// Skeleton loaders
const showSkeleton = (grid, count = 6) => {
    grid.innerHTML = `<div class="loading-cards">` +
        Array.from({ length: count }, () => `<div class="skeleton-card glass"></div>`).join('') +
        `</div>`;
};

// Error state
const showError = (grid) => {
    grid.innerHTML = `
        <div class="dest-error" style="grid-column:1/-1;">
            <i class="fas fa-exclamation-circle"></i>
            <h3>Could Not Load Tours</h3>
            <p>Using demo data as the server is currently unreachable.<br>
            <code>${DEST_API}</code></p>
            <button onclick="loadAllTours()" class="btn-primary" style="margin-top:20px; cursor:pointer;">
                <i class="fas fa-redo"></i> Retry Connection
            </button>
        </div>`;
};

// No results state
const showNoResults = (grid, query) => {
    grid.innerHTML = `
        <div class="dest-no-results" style="grid-column:1/-1;">
            <i class="fas fa-search"></i>
            <h3>No Tours Found</h3>
            <p>We couldn't find any tours matching <strong>"${query}"</strong>.<br>
            Try a different keyword or browse all packages.</p>
            <button onclick="resetAll()" class="btn-primary" style="margin-top:20px; cursor:pointer;">
                Show All Tours
            </button>
        </div>`;
};

// Re-apply scroll reveal
const reapplyReveal = (grid) => {
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('active');
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.08 });
    grid.querySelectorAll('.reveal').forEach(el => obs.observe(el));
};

// ---- Fallback sample data (shown when backend is offline) ----
const SAMPLE_TOURS = [
    { _id: 'sample-1', title: 'Kashmir Paradise', location: 'Kashmir', category: 'Adventure', price: 28000, duration: '6 Days / 5 Nights', rating: '4.9', images: ['https://images.unsplash.com/photo-1566837945700-3005dea52769?auto=format&fit=crop&w=800&q=80'] },
    { _id: 'sample-2', title: 'Bali Honeymoon Escape', location: 'Bali, Indonesia', category: 'Honeymoon', price: 75000, duration: '7 Days / 6 Nights', rating: '4.8', images: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80'] },
    { _id: 'sample-3', title: 'Dubai City Glam', location: 'Dubai, UAE', category: 'International', price: 55000, duration: '5 Days / 4 Nights', rating: '4.7', images: ['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80'] },
    { _id: 'sample-4', title: 'Maldives Overwater Bliss', location: 'Maldives', category: 'Honeymoon', price: 90000, duration: '6 Days / 5 Nights', rating: '5.0', images: ['https://images.unsplash.com/photo-1582686115763-eb0429f6d71b?auto=format&fit=crop&w=800&q=80'] },
    { _id: 'sample-5', title: 'Ladakh Bike Expedition', location: 'Ladakh', category: 'Adventure', price: 32000, duration: '8 Days / 7 Nights', rating: '4.9', images: ['https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=800&q=80'] },
    { _id: 'sample-6', title: 'Kerala Backwaters Family Tour', location: 'Kerala', category: 'Family', price: 22000, duration: '5 Days / 4 Nights', rating: '4.8', images: ['https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80'] },
    { _id: 'sample-7', title: 'Royal Rajasthan Group', location: 'Rajasthan', category: 'Group', price: 15500, duration: '7 Days / 6 Nights', rating: '4.7', images: ['https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80'] },
    { _id: 'sample-8', title: 'Goa Beach Fiesta', location: 'Goa', category: 'Group', price: 9999, duration: '4 Days / 3 Nights', rating: '4.6', images: ['https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80'] },
    { _id: 'sample-9', title: 'Shimla–Manali Retreat', location: 'Himachal Pradesh', category: 'Family', price: 18500, duration: '6 Days / 5 Nights', rating: '4.8', images: ['https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80'] },
];

// ---- State -------------------------------------------------
let allTours = [];          // full list from API
let currentSearch = '';
let currentCategory = 'all';

const grid = document.getElementById('dest-grid');
const resultInfo = document.getElementById('dest-result-info');
const resultCount = document.getElementById('dest-result-count');
const clearBtn = document.getElementById('dest-clear-btn');

// ---- Render filtered results --------------------------------
const renderFiltered = () => {
    const search = currentSearch.trim().toLowerCase();
    const cat = currentCategory.toLowerCase();

    const filtered = allTours.filter(tour => {
        const matchSearch = !search ||
            (tour.title || '').toLowerCase().includes(search) ||
            (tour.location || '').toLowerCase().includes(search);

        const matchCat = cat === 'all' ||
            (tour.category || '').toLowerCase() === cat;

        return matchSearch && matchCat;
    });

    const hasFilter = search || cat !== 'all';

    if (hasFilter) {
        resultInfo.style.display = 'flex';
        const desc = [
            search ? `"${search}"` : null,
            cat !== 'all' ? `Category: ${currentCategory}` : null
        ].filter(Boolean).join(' + ');
        resultCount.textContent = `${filtered.length} tour${filtered.length !== 1 ? 's' : ''} found for ${desc}`;
    } else {
        resultInfo.style.display = 'none';
    }

    if (filtered.length === 0) {
        showNoResults(grid, search || currentCategory);
        return;
    }

    grid.innerHTML = filtered.map((t, i) => buildCard(t, i)).join('');
    reapplyReveal(grid);
};

// ---- Fetch all tours once -----------------------------------
const loadAllTours = async () => {
    showSkeleton(grid, 6);
    try {
        const res = await fetch(DEST_API);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        allTours = json.data || [];

        if (allTours.length === 0) {
            // API returned empty — use sample data so grid isn't blank
            allTours = SAMPLE_TOURS;
        }

        renderFiltered();
    } catch (err) {
        console.warn('Destinations: backend offline, using sample data.', err.message);
        allTours = SAMPLE_TOURS;
        renderFiltered();
    }
};

// ---- Search button -----------------------------------------
const searchBtn = document.getElementById('dest-search-btn');
const searchInput = document.getElementById('dest-search-input');

searchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    currentSearch = searchInput.value;
    renderFiltered();
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        currentSearch = searchInput.value;
        renderFiltered();
    }
});

// Live search (debounced 350ms)
let debounceTimer;
searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        currentSearch = searchInput.value;
        renderFiltered();
    }, 350);
});

// ---- Category filter buttons --------------------------------
const filterBtns = document.querySelectorAll('.dest-filter-wrap .filter-btn');
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-category') || 'all';
        renderFiltered();
    });
});

// ---- Clear all filters -------------------------------------
const resetAll = () => {
    currentSearch = '';
    currentCategory = 'all';
    searchInput.value = '';
    filterBtns.forEach(b => b.classList.remove('active'));
    document.getElementById('filter-all').classList.add('active');
    resultInfo.style.display = 'none';
    renderFiltered();
};

clearBtn.addEventListener('click', resetAll);

// ---- URL param: pre-fill search from ?location=Kashmir -----
const urlParams = new URLSearchParams(window.location.search);
const preSearch = urlParams.get('location') || urlParams.get('search') || '';
if (preSearch) {
    searchInput.value = preSearch;
    currentSearch = preSearch;
}

// ---- Boot --------------------------------------------------
loadAllTours();
