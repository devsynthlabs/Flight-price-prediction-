// SkyBooker Results Page
class FlightResults {
    constructor() {
        this.flights = [];
        this.searchData = null;
        this.currentSort = 'price';
        this.init();
    }

    init() {
        // Load search data and results
        this.loadSearchData();
        this.loadFlights();
        this.bindEvents();
    }

    loadSearchData() {
        const searchData = sessionStorage.getItem('searchData');
        if (!searchData) {
            window.location.href = 'search.html';
            return;
        }
        this.searchData = JSON.parse(searchData);
        this.updateResultsInfo();
    }

    async loadFlights() {
        try {
            // Show loading state
            document.getElementById('loadingState').style.display = 'block';
            document.getElementById('flightsContainer').style.display = 'none';
            
            // Try to get cached results first
            const cachedResults = sessionStorage.getItem('searchResults');
            if (cachedResults) {
                const data = JSON.parse(cachedResults);
                this.flights = data.results || [];
                this.displayFlights();
                return;
            }
            
            // If no cached results, make API call
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.searchData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to load flights');
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.flights = data.results || [];
                this.displayFlights();
            } else {
                throw new Error(data.message || 'No flights found');
            }
            
        } catch (error) {
            console.error('Error loading flights:', error);
            this.showNoResults();
        } finally {
            document.getElementById('loadingState').style.display = 'none';
        }
    }

    updateResultsInfo() {
        const info = document.getElementById('resultsInfo');
        const { from, to, departureDate, passengers, tripType } = this.searchData;
        
        let infoText = `${from} to ${to} • ${this.formatDate(departureDate)}`;
        if (tripType === 'roundtrip' && this.searchData.returnDate) {
            infoText += ` - ${this.formatDate(this.searchData.returnDate)}`;
        }
        infoText += ` • ${passengers} Passenger${passengers > 1 ? 's' : ''}`;
        
        info.textContent = infoText;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }

    bindEvents() {
        // Sort buttons
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleSort(e));
        });
    }

    handleSort(e) {
        // Update active button
        document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        this.currentSort = e.target.dataset.sort;
        this.sortFlights();
        this.displayFlights();
    }

    sortFlights() {
        this.flights.sort((a, b) => {
            switch (this.currentSort) {
                case 'price':
                    return a.price - b.price;
                case 'duration':
                    return parseFloat(a.duration) - parseFloat(b.duration);
                case 'departure':
                    return a.departure_time.localeCompare(b.departure_time);
                case 'safety':
                    return b.safety_score - a.safety_score;
                default:
                    return 0;
            }
        });
    }

    displayFlights() {
        const container = document.getElementById('flightsContainer');
        
        if (!this.flights || this.flights.length === 0) {
            this.showNoResults();
            return;
        }
        
        container.style.display = 'block';
        container.innerHTML = '';
        
        this.flights.forEach((flight, index) => {
            const flightCard = this.createFlightCard(flight, index);
            container.appendChild(flightCard);
        });
    }

    createFlightCard(flight, index) {
        const card = document.createElement('div');
        card.className = 'flight-card';
        
        // Calculate arrival time (simplified)
        const departureTime = flight.departure_time;
        const duration = parseFloat(flight.duration);
        const arrivalTime = this.calculateArrivalTime(departureTime, duration);
        
        // Get airline logo/initials
        const airlineCode = flight.airline.substring(0, 2).toUpperCase();
        
        // Format stops
        const stopsText = flight.stops === 'zero' ? 'Nonstop' : 
                         flight.stops === 'one' ? '1 Stop' : '2+ Stops';
        
        // Safety rating
        const safetyRating = this.getSafetyRating(flight.safety_score);
        
        card.innerHTML = `
            <div class="flight-header">
                <div class="airline-info">
                    <div class="airline-logo">${airlineCode}</div>
                    <div>
                        <div class="airline-name">${flight.airline}</div>
                        <div style="font-size: 0.8rem; color: #666;">${flight.flight_number || flight.airline + ' ' + (100 + index)}</div>
                    </div>
                </div>
                <div class="flight-price">
                    ₹${flight.price.toLocaleString()}
                    <div class="price-label">per person</div>
                </div>
            </div>
            
            <div class="flight-details">
                <div class="flight-time">
                    <div class="time">${departureTime}</div>
                    <div class="airport">${this.searchData.from}</div>
                </div>
                
                <div class="flight-duration">
                    <div class="duration">${flight.duration}h</div>
                    <div class="stops">${stopsText}</div>
                </div>
                
                <div class="flight-time">
                    <div class="time">${arrivalTime}</div>
                    <div class="airport">${this.searchData.to}</div>
                </div>
            </div>
            
            <div class="flight-features">
                <div class="feature">
                    <span>✓</span> Safety Score: ${flight.safety_score}/10 (${safetyRating})
                </div>
                <div class="feature">
                    <span>✓</span> Value Score: ${flight.value_score}/10
                </div>
                <div class="feature">
                    <span>✓</span> ${this.searchData.class} Class
                </div>
                ${flight.amenities ? flight.amenities.map(amenity => `
                    <div class="feature">
                        <span>✓</span> ${amenity}
                    </div>
                `).join('') : ''}
            </div>
            
            <button class="select-flight-btn" onclick="selectFlight(${index})">
                Select Flight
            </button>
        `;
        
        return card;
    }

    calculateArrivalTime(departureTime, duration) {
        // Simple time calculation (assumes same day)
        const [hours, minutes] = departureTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + (duration * 60);
        const arrivalHours = Math.floor(totalMinutes / 60) % 24;
        const arrivalMinutes = Math.floor(totalMinutes % 60);
        
        return `${arrivalHours.toString().padStart(2, '0')}:${arrivalMinutes.toString().padStart(2, '0')}`;
    }

    getSafetyRating(score) {
        if (score >= 9) return 'Excellent';
        if (score >= 8) return 'Very Good';
        if (score >= 7) return 'Good';
        if (score >= 6) return 'Fair';
        return 'Basic';
    }

    showNoResults() {
        document.getElementById('flightsContainer').style.display = 'none';
        document.getElementById('noResults').style.display = 'block';
    }
}

// Global function for flight selection
function selectFlight(index) {
    const flightResults = window.flightResultsInstance;
    const selectedFlight = flightResults.flights[index];
    const searchData = flightResults.searchData;
    
    // Store selected flight data
    sessionStorage.setItem('selectedFlight', JSON.stringify({
        flight: selectedFlight,
        searchData: searchData,
        selectionTime: new Date().toISOString()
    }));
    
    // Redirect to booking page
    window.location.href = 'booking.html';
}

// Initialize results page
let flightResultsInstance;
document.addEventListener('DOMContentLoaded', () => {
    flightResultsInstance = new FlightResults();
    window.flightResultsInstance = flightResultsInstance;
});
