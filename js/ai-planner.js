// ============================================================
//  RAO Travels AI Travel Planner JS
//  Collects inputs → Calls POST /api/ai/planner
//  Renders a gorgeous interactive dashboard with timeline accordions
//  Includes resilient and context-aware Mock Itinerary engine
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
    let selectedInterests = ['Sightseeing'];
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
        "Initializing RAO travels custom AI engine...",
        "Scouring local databases for hidden offbeat paths...",
        "Vetting five-star accommodation alternatives...",
        "Optimizing budget allocations and trip logistics...",
        "Finalizing signature attraction recommendations...",
        "Structuring day-by-day travel map..."
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
        
        const message = `*🌟 Custom AI Travel Plan by RAO Travels 🌟*\n\n` +
                        `*Destination:* ${destination}\n` +
                        `*Duration:* ${days} Days\n` +
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
            if (c.getAttribute('data-interest') === 'Sightseeing') {
                c.classList.add('active');
            } else {
                c.classList.remove('active');
            }
        });
        selectedInterests = ['Sightseeing'];
    });

    // ---- 5. Itinerary Plan Rendering Engine ----
    const renderPlan = (data) => {
        generatedPlanData = data;

        // Elements to Inject
        document.getElementById('plan-dest-title').textContent = `Beside Journey: ${data.destination}`;
        document.getElementById('pill-days').innerHTML = `<i class="fas fa-calendar-alt"></i> ${data.days} Days`;
        document.getElementById('pill-budget').innerHTML = `<i class="fas fa-wallet"></i> ${data.budget}`;
        document.getElementById('plan-overview').textContent = data.overview;

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

    // ---- 6. High-Fidelity Mock Planning Fallback Engine ----
    const generateMockItinerary = (dest, days, budget, interests) => {
        const cleanDest = dest.trim().replace(/^./, str => str.toUpperCase());
        const interestList = interests.join(', ');

        const mockPlan = {
            destination: cleanDest,
            days: parseInt(days),
            budget: `₹${Number(budget).toLocaleString('en-IN')}`,
            overview: `An elegant, customized ${days}-day escape tailored specifically to explore the finest gems of ${cleanDest}. Crafted with focus on ${interestList}, this premium schedule balances iconic sights with curated leisure.`,
            itinerary: [],
            hotels: [
                {
                    name: `Royal ${cleanDest} Pavilion Resort`,
                    type: "Luxury",
                    priceRange: "₹8,500 - ₹12,000 per night",
                    reason: "Highly rated premium boutique resort that offers quick access to top hotspots while hosting relaxing wellness spa services."
                },
                {
                    name: `Heritage ${cleanDest} Residency`,
                    type: "Mid-range Boutique",
                    priceRange: "₹4,000 - ₹6,500 per night",
                    reason: "Charming boutique hotel with outstanding heritage aesthetic design, offering free local breakfast and stunning balcony views."
                }
            ],
            attractions: [
                {
                    name: `Central Sights of ${cleanDest}`,
                    description: "An unmissable architectural monument holding deep history and spectacular viewing angles. Entry fee is ₹100; recommended visit duration: 3 hours."
                },
                {
                    name: `${cleanDest} Secret Valley Path`,
                    description: "A gorgeous scenic route recommended for peaceful nature walks, sunset photography, and authentic street food experiences."
                }
            ],
            budgetAllocation: {
                accommodation: "35%",
                foodAndDining: "25%",
                transport: "20%",
                sightseeingAndActivities: "15%",
                shoppingAndMisc: "5%"
            }
        };

        // Populate days dynamically based on duration
        for (let d = 1; d <= days; d++) {
            let dayTitle = "";
            let activities = [];
            let tips = "";

            if (d === 1) {
                dayTitle = `Arrival & Panoramic Orientation`;
                activities = [
                    `Arrive in ${cleanDest} and enjoy private chauffeur transit to your premium hotel.`,
                    `Enjoy a warm signature welcome drink and ease into the cozy luxurious atmosphere.`,
                    `Evening walking tour along the vibrant central corridors to sample authentic gourmet delicacies.`
                ];
                tips = "Avoid hectic schedules today; staying hydrated is vital to acclimatize and enjoy the upcoming adventure.";
            } else if (d === days) {
                dayTitle = `Final Shopping & Farewell Departure`;
                activities = [
                    `Morning leisure session in the hotel garden or wellness gym facility.`,
                    `Visit a curated authentic local handicraft market to collect precious souvenirs.`,
                    `Board your private transfer back to the transit hub for departure.`
                ];
                tips = "Pack all local items securely and pre-book standard transit paths early to ensure a stress-free voyage.";
            } else {
                dayTitle = `Exploring Signature Gems & ${interestList} Sites`;
                activities = [
                    `Morning tour around popular scenic attraction points, perfect for high-quality photography.`,
                    `Bespoke lunch tasting session at a critically acclaimed local culinary venue.`,
                    `Exclusive afternoon interactive experience aligning with your interest in ${interests[0]}.`,
                    `Relaxing evening cruise or cultural musical show reflecting the region's vivid heritage.`
                ];
                tips = "Always carry cash for remote street vendors and check sunset schedules to secure the best photography spots.";
            }

            mockPlan.itinerary.push({
                day: d,
                title: dayTitle,
                activities: activities,
                tips: tips
            });
        }

        return mockPlan;
    };

    // ---- 7. Core Form Submission Action ----
    plannerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const destination = document.getElementById('destination').value.trim();
        const days        = document.getElementById('days').value;
        const budget      = document.getElementById('budget').value;

        if (!destination) return;

        // 1. Transition to Loading Screen
        formSection.classList.add('hidden');
        loadingSection.classList.remove('hidden');
        startStatusLoop();

        // Target API URL
        const API_BASE = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE : 'https://raotravels-backend.onrender.com';
        const plannerEndpoint = `${API_BASE}/api/ai/planner`;

        try {
            // Send API Request
            const response = await fetch(plannerEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destination,
                    days,
                    budget,
                    interests: selectedInterests
                })
            });

            const result = await response.json();

            // Check if response successful
            if (response.ok && result.success && result.data) {
                renderPlan(result.data);
            } else {
                // Backend responded with failure/error -> Fallback
                console.warn('Backend planner responded with error, falling back to mock engine...');
                const mockPlan = generateMockItinerary(destination, days, budget, selectedInterests);
                renderPlan(mockPlan);
            }

        } catch (error) {
            // Network failure or backend down -> Fallback
            console.warn('Network issue calling AI planner, triggering resilient mock engine...', error);
            const mockPlan = generateMockItinerary(destination, days, budget, selectedInterests);
            renderPlan(mockPlan);
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
