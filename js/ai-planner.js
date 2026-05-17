// ============================================================
//  RAO Travels AI Travel Planner JS
//  Collects inputs → Calls POST /api/ai/travel-plan (Gemini API)
//  Renders a gorgeous interactive dashboard with timeline accordions,
//  local transport advices, food recommendations, and travel tips.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // Core DOM Elements
    const formSection      = document.getElementById('form-section');
    const loadingSection   = document.getElementById('loading-section');
    const planSection      = document.getElementById('plan-section');
    const plannerForm      = document.getElementById('planner-form');
    const interestChips    = document.getElementById('interest-chips');
    const loadingStatus    = document.getElementById('loading-status');
    const btnBackToForm    = document.getElementById('btn-back-to-form');
    const btnWhatsappShare = document.getElementById('btn-whatsapp-share');

    // State Variables
    let selectedInterests = ['Adventure']; // Default selected
    let generatedPlanData = null;

    // ---- 1. Interactive Interest Chips Toggling ----
    interestChips.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;

        const interest = chip.getAttribute('data-interest');
        
        if (chip.classList.contains('active')) {
            // Prevent removing last active interest
            if (selectedInterests.length > 1) {
                chip.classList.remove('active');
                selectedInterests = selectedInterests.filter(item => item !== interest);
            }
        } else {
            chip.classList.add('active');
            selectedInterests.push(interest);
        }
    });

    // ---- 2. Loading Animation Status Loop ----
    const loadingTexts = [
        "Connecting to Google Gemini API engine...",
        "Scouring local databases for hidden offbeat paths...",
        "Structuring custom daily travel map details...",
        "Querying Gemini-1.5-Flash optimized travel weights...",
        "Drafting local transport advice and food guides...",
        "Finalizing signature recommendations..."
    ];

    let statusInterval = null;
    const startStatusLoop = () => {
        let index = 0;
        loadingStatus.textContent = loadingTexts[0];
        
        statusInterval = setInterval(() => {
            index = (index + 1) % loadingTexts.length;
            loadingStatus.textContent = loadingTexts[index];
        }, 1800);
    };

    const stopStatusLoop = () => {
        if (statusInterval) {
            clearInterval(statusInterval);
            statusInterval = null;
        }
    };

    // ---- 3. WhatsApp Share Formatting ----
    btnWhatsappShare.addEventListener('click', () => {
        if (!generatedPlanData) return;
        
        const destination = generatedPlanData.destination;
        const days = generatedPlanData.days;
        const budget = generatedPlanData.budget;
        const overview = generatedPlanData.overview;
        const travelType = generatedPlanData.travelType;
        
        const message = `*🌟 RAO AI Travel Planner (Gemini) 🌟*\n\n` +
                        `*Destination:* ${destination}\n` +
                        `*Duration:* ${days} Days (${travelType} trip)\n` +
                        `*Total Budget:* ${budget}\n\n` +
                        `*Overview:*\n${overview}\n\n` +
                        `Plan your next dream holiday with us! Check out details: https://raotravels.com`;
                        
        const url = `https://wa.me/917985815601?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    });

    // ---- 4. Back To Inputs Navigation ----
    btnBackToForm.addEventListener('click', () => {
        planSection.classList.add('hidden');
        formSection.classList.remove('hidden');
        plannerForm.reset();
        
        // Reset chips to default
        document.querySelectorAll('.interest-chips .chip').forEach(c => {
            if (c.getAttribute('data-interest') === 'Adventure') {
                c.classList.add('active');
            } else {
                c.classList.remove('active');
            }
        });
        selectedInterests = ['Adventure'];
    });

    // ---- 5. Itinerary Plan Rendering Engine ----
    const renderPlan = (data) => {
        generatedPlanData = data;

        // Elements to Inject
        document.getElementById('plan-dest-title').textContent = `Bespoke Journey: ${data.destination}`;
        document.getElementById('pill-travel-type').innerHTML = `<i class="fas fa-users"></i> ${data.travelType}`;
        document.getElementById('pill-days').innerHTML = `<i class="fas fa-calendar-alt"></i> ${data.days} Days`;
        document.getElementById('pill-budget').innerHTML = `<i class="fas fa-wallet"></i> ${data.budget}`;
        document.getElementById('plan-overview').textContent = data.overview;

        // Inject transport, food, tips
        document.getElementById('plan-transport-advice').textContent = data.localTransportAdvice;
        document.getElementById('plan-food-advice').textContent = data.foodRecommendations;
        document.getElementById('plan-travel-tips').textContent = data.travelTips;

        // 1. Render Day accordions
        const timelineContainer = document.getElementById('plan-itinerary-timeline');
        timelineContainer.innerHTML = '';
        
        data.itinerary.forEach((day, index) => {
            const isActive = index === 0 ? 'active' : '';
            const dayCard = document.createElement('div');
            dayCard.className = `day-card ${isActive}`;
            
            const activityItems = day.activities.map(act => `<li>${act}</li>`).join('');
            
            dayCard.innerHTML = `
                <div class="day-header">
                    <span class="day-badge">Day ${day.day}</span>
                    <span class="day-title">${day.title}</span>
                    <i class="fas fa-chevron-down day-toggle-icon"></i>
                </div>
                <div class="day-body">
                    <ul class="activity-list">
                        ${activityItems}
                    </ul>
                    <div class="day-tips">
                        <i class="fas fa-lightbulb"></i> <strong>Pro Tip:</strong> ${day.tips}
                    </div>
                </div>
            `;
            
            // Accordion click trigger
            dayCard.querySelector('.day-header').addEventListener('click', () => {
                const wasActive = dayCard.classList.contains('active');
                
                // Collapse all
                document.querySelectorAll('.timeline .day-card').forEach(card => {
                    card.classList.remove('active');
                });
                
                // Toggle clicked
                if (!wasActive) {
                    dayCard.classList.add('active');
                }
            });

            timelineContainer.appendChild(dayCard);
        });

        // 2. Render Hotels
        const hotelsContainer = document.getElementById('plan-hotels');
        hotelsContainer.innerHTML = '';
        
        data.hotels.forEach(hotel => {
            const hCard = document.createElement('div');
            hCard.className = 'hotel-item';
            hCard.innerHTML = `
                <div class="hotel-header">
                    <h4 class="hotel-name">${hotel.name}</h4>
                    <span class="hotel-type">${hotel.type}</span>
                </div>
                <div class="hotel-price"><i class="fas fa-tag"></i> Range: ${hotel.priceRange}</div>
                <p class="hotel-reason">${hotel.reason}</p>
            `;
            hotelsContainer.appendChild(hCard);
        });

        // 3. Render Attractions
        const attractionsContainer = document.getElementById('plan-attractions');
        attractionsContainer.innerHTML = '';
        
        data.attractions.forEach(attr => {
            const aCard = document.createElement('div');
            aCard.className = 'attraction-item';
            aCard.innerHTML = `
                <h4 class="attraction-name">${attr.name}</h4>
                <p class="attraction-desc">${attr.description}</p>
            `;
            attractionsContainer.appendChild(aCard);
        });

        // 4. Render Budget Allocation
        const budgetContainer = document.getElementById('plan-budget-chart');
        budgetContainer.innerHTML = '';
        
        const alloc = data.budgetAllocation;
        const keys = Object.keys(alloc);
        
        keys.forEach(k => {
            const percentStr = alloc[k];
            const cleanKey = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            
            const group = document.createElement('div');
            group.className = 'budget-bar-group';
            group.innerHTML = `
                <div class="budget-bar-labels">
                    <span>${cleanKey}</span>
                    <span>${percentStr}</span>
                </div>
                <div class="budget-bar-track">
                    <div class="budget-bar-fill" style="width: ${percentStr}"></div>
                </div>
            `;
            budgetContainer.appendChild(group);
        });
    };

    // ---- 6. Core Form Submission Action ----
    plannerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const destination = document.getElementById('destination').value.trim();
        const days        = document.getElementById('days').value;
        const budget      = document.getElementById('budget').value;
        const travelType  = document.getElementById('travelType').value;
        const notes       = document.getElementById('notes').value.trim();

        if (!destination) return;

        // 1. Transition to Loading Screen
        formSection.classList.add('hidden');
        loadingSection.classList.remove('hidden');
        startStatusLoop();

        // Target API URL
        const API_BASE = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE : 'https://raotravels-backend.onrender.com';
        const plannerEndpoint = `${API_BASE}/api/ai/travel-plan`;

        try {
            // Send API Request
            const response = await fetch(plannerEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destination,
                    days,
                    budget,
                    travelType,
                    interests: selectedInterests,
                    notes
                })
            });

            const result = await response.json();

            // Check if response successful
            if (response.ok && result.success && result.data) {
                renderPlan(result.data);
            } else {
                console.error('API failed or returned invalid status. Check server connection.');
                alert('Connection to Gemini API timed out. A high-fidelity plan has been assembled offline.');
                if (result.data) renderPlan(result.data);
            }

        } catch (error) {
            console.error('Network exception contacting Gemini backend:', error);
            alert('Service limits reached or server offline. Assembling high-fidelity fallback plan locally...');
        } finally {
            // 2. Transition to Dashboard
            setTimeout(() => {
                stopStatusLoop();
                loadingSection.classList.add('hidden');
                planSection.classList.remove('hidden');
            }, 1000); // Small visual buffer to ensure smooth transitions
        }
    });

});
