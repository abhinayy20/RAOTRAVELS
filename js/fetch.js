// ============================================================
//  fetch.js — Dynamically loads tour cards from the backend API
//             Now with search & filter support
// ============================================================

const API_URL = CONFIG.API_BASE + '/api/tours';

// Helper: Format numbers as Indian currency  
const formatPrice = (price) => {
    return '₹' + price.toLocaleString('en-IN');
};

// Helper: Build one card's HTML from a tour object
const createTourCard = (tour, index) => {
    const image = (tour.images && tour.images.length > 0)
        ? tour.images[0]
        : 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80';

    const waText = encodeURIComponent(`Hello, I'm interested in booking the ${tour.title} package!`);
    const delayClass = index === 1 ? 'reveal-delay-1' : index === 2 ? 'reveal-delay-2' : '';
    const detailsUrl = `package-details.html?id=${tour._id}`;

    return `
        <div class="package-card glass reveal ${delayClass}" data-category="${tour.category || 'Standard'}">
            <div class="discount-badge">${tour.category || 'OFFER'}</div>
            <img src="${image}" alt="${tour.title}" class="package-img">
            <div class="package-content">
                <h3 class="package-title">${tour.title}</h3>
                <div class="package-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${tour.location}</span>
                    <span><i class="fas fa-star"></i> ${tour.rating || '4.8'}</span>
                </div>
                <div class="package-meta" style="margin-top: 6px;">
                    <span><i class="far fa-clock"></i> ${tour.duration}</span>
                </div>
                <div class="package-price">${formatPrice(tour.price)}</div>
                <div class="package-actions">
                    <a href="${detailsUrl}" class="btn-outline" style="flex:1; text-align:center;">Details</a>
                    <a href="https://wa.me/917985815601?text=${waText}" target="_blank" class="btn-primary" style="flex:1; text-align:center;">Book</a>
                </div>
            </div>
        </div>
    `;
};

// Show skeleton loading inside the grid
const showLoading = (grid) => {
    grid.innerHTML = `
        <div class="loading-cards">
            <div class="skeleton-card glass"></div>
            <div class="skeleton-card glass"></div>
            <div class="skeleton-card glass"></div>
        </div>
    `;
};

// Show error state inside the grid
const showError = (grid) => {
    grid.innerHTML = `
        <div class="api-error" style="
            grid-column: 1/-1;
            text-align: center;
            padding: 60px 20px;
            color: var(--text-muted);
        ">
            <i class="fas fa-exclamation-circle" style="font-size:3rem; color: var(--gold); margin-bottom:15px; display:block;"></i>
            <h3 style="color: var(--text-primary); margin-bottom:10px;">Could Not Load Tours</h3>
            <p>Make sure the backend server is running on port 5000.<br>
            <code style="color: var(--teal);">cd backend && npm run dev</code></p>
        </div>
    `;
};

// Show "no results" state
const showNoResults = (grid, query) => {
    grid.innerHTML = `
        <div style="
            grid-column: 1/-1;
            text-align: center;
            padding: 60px 20px;
            color: var(--text-muted);
        ">
            <i class="fas fa-search" style="font-size:3rem; color: var(--gold); margin-bottom:15px; display:block;"></i>
            <h3 style="color: var(--text-primary); margin-bottom:10px;">No Tours Found</h3>
            <p>We couldn't find any tours matching "${query}".<br>Try a different search or browse all packages.</p>
            <button onclick="fetchAndRenderTours()" class="btn-primary" style="margin-top:20px; cursor:pointer;">
                Show All Tours
            </button>
        </div>
    `;
};

// Re-apply scroll reveal animation on dynamic cards
const reapplyReveal = (grid) => {
    const newRevealEls = grid.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    newRevealEls.forEach(el => observer.observe(el));
};

// ============================================================
//  Main fetch function (supports optional query string)
// ============================================================
const fetchAndRenderTours = async (queryString = '') => {
    const grid = document.getElementById('packages-grid');
    if (!grid) return;

    showLoading(grid);

    try {
        const url = queryString ? `${API_URL}?${queryString}` : API_URL;
        const response = await fetch(url);

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const json = await response.json();
        const tours = json.data;

        if (!tours || tours.length === 0) {
            showNoResults(grid, queryString || 'your search');
            return;
        }

        // Render all tour cards
        grid.innerHTML = tours.map((tour, i) => createTourCard(tour, i)).join('');

        // Re-run scroll reveal on new cards
        reapplyReveal(grid);

        // Re-apply filter button logic
        applyFilterLogic();

    } catch (error) {
        console.warn('Backend not available, showing error state:', error.message);
        showError(grid);
    }
};

// ============================================================
//  Category filter buttons (below section header)
// ============================================================
const applyFilterLogic = () => {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        // Remove old listeners by cloning
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', () => {
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            newBtn.classList.add('active');

            const category = newBtn.textContent.trim();

            if (category === 'All') {
                fetchAndRenderTours();
            } else {
                fetchAndRenderTours(`category=${encodeURIComponent(category)}`);
            }
        });
    });
};

// ============================================================
//  Hero Search Bar
// ============================================================
const setupSearch = () => {
    const searchBtn = document.getElementById('search-btn');
    const locationInput = document.getElementById('search-location');
    const budgetSelect = document.getElementById('search-budget');

    if (!searchBtn) return;

    const performSearch = () => {
        const params = new URLSearchParams();

        // Location
        const location = locationInput ? locationInput.value.trim() : '';
        if (location) params.append('location', location);

        // Budget range
        const budget = budgetSelect ? budgetSelect.value : '';
        if (budget) {
            const [min, max] = budget.split('-');
            if (min) params.append('minPrice', min);
            if (max) params.append('maxPrice', max);
        }

        const queryString = params.toString();

        // Smooth scroll to packages section
        const packagesSection = document.getElementById('packages');
        if (packagesSection) {
            packagesSection.scrollIntoView({ behavior: 'smooth' });
        }

        // Fetch with filters after a tiny delay for smooth scroll
        setTimeout(() => {
            fetchAndRenderTours(queryString);
        }, 400);
    };

    // Search button click
    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        performSearch();
    });

    // Enter key in location input
    if (locationInput) {
        locationInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }
};

// ============================================================
//  Popular Search Chips (Ladakh, Bali, Kashmir, etc.)
// ============================================================
const setupChips = () => {
    const chips = document.querySelectorAll('.chip[data-search]');
    const locationInput = document.getElementById('search-location');

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.getAttribute('data-search');

            // Fill the search input for visual feedback
            if (locationInput) locationInput.value = query;

            // Scroll to packages
            const packagesSection = document.getElementById('packages');
            if (packagesSection) {
                packagesSection.scrollIntoView({ behavior: 'smooth' });
            }

            // Fetch filtered tours
            setTimeout(() => {
                fetchAndRenderTours(`location=${encodeURIComponent(query)}`);
            }, 400);
        });
    });
};

// ============================================================
//  Initialize everything on page load
// ============================================================
fetchAndRenderTours();
setupSearch();
setupChips();
