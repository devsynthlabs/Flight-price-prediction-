// SkyBooker Search Functionality
class FlightSearch {
    constructor() {
        this.tripType = 'roundtrip';
        this.init();
    }

    init() {
        // Check authentication
        this.checkAuth();
        
        // Set default dates
        this.setDefaultDates();
        
        // Bind events
        this.bindEvents();
    }

    checkAuth() {
        const user = sessionStorage.getItem('user');
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        const userData = JSON.parse(user);
        console.log('Welcome,', userData.name);
    }

    setDefaultDates() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        document.getElementById('departureDate').value = tomorrow.toISOString().split('T')[0];
        document.getElementById('returnDate').value = nextWeek.toISOString().split('T')[0];
        
        // Set minimum date to today
        document.getElementById('departureDate').min = today.toISOString().split('T')[0];
        document.getElementById('returnDate').min = tomorrow.toISOString().split('T')[0];
    }

    bindEvents() {
        // Trip type buttons
        document.querySelectorAll('.trip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTripTypeChange(e));
        });

        // Search form
        document.getElementById('searchForm').addEventListener('submit', (e) => this.handleSearch(e));

        // Date change events
        document.getElementById('departureDate').addEventListener('change', (e) => {
            const departureDate = new Date(e.target.value);
            const returnDateField = document.getElementById('returnDate');
            const nextDay = new Date(departureDate);
            nextDay.setDate(nextDay.getDate() + 1);
            returnDateField.min = nextDay.toISOString().split('T')[0];
            
            // Update return date if it's before departure
            if (returnDateField.value && new Date(returnDateField.value) <= departureDate) {
                returnDateField.value = nextDay.toISOString().split('T')[0];
            }
        });
    }

    handleTripTypeChange(e) {
        // Update active button
        document.querySelectorAll('.trip-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        this.tripType = e.target.dataset.type;
        
        // Show/hide return date field
        const returnField = document.getElementById('returnDateField');
        const returnInput = document.getElementById('returnDate');
        
        if (this.tripType === 'oneway') {
            returnField.style.display = 'none';
            returnInput.required = false;
        } else {
            returnField.style.display = 'block';
            returnInput.required = true;
        }
    }

    async handleSearch(e) {
        e.preventDefault();
        
        const formData = this.getFormData();
        
        // Validate form
        if (!this.validateForm(formData)) {
            return;
        }
        
        // Show loading
        this.showLoading(true);
        
        try {
            // Call backend API to search flights
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                throw new Error('Search failed');
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Store search results
                sessionStorage.setItem('searchResults', JSON.stringify(data));
                sessionStorage.setItem('searchData', JSON.stringify(formData));
                
                // Redirect to results
                window.location.href = 'results.html';
            } else {
                throw new Error(data.message || 'Search failed');
            }
            
        } catch (error) {
            this.showError('Search failed: ' + error.message + '. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    getFormData() {
        return {
            from: document.getElementById('fromCity').value,
            to: document.getElementById('toCity').value,
            departureDate: document.getElementById('departureDate').value,
            returnDate: this.tripType === 'roundtrip' ? document.getElementById('returnDate').value : null,
            passengers: parseInt(document.getElementById('passengers').value),
            class: document.getElementById('class').value,
            tripType: this.tripType,
            searchTime: new Date().toISOString()
        };
    }

    validateForm(data) {
        if (!data.from || !data.to) {
            this.showError('Please select both departure and destination cities.');
            return false;
        }
        
        if (data.from === data.to) {
            this.showError('Departure and destination cities cannot be the same.');
            return false;
        }
        
        if (!data.departureDate) {
            this.showError('Please select a departure date.');
            return false;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const departureDate = new Date(data.departureDate);
        
        if (departureDate < today) {
            this.showError('Departure date cannot be in the past.');
            return false;
        }
        
        if (this.tripType === 'roundtrip' && data.returnDate) {
            const returnDate = new Date(data.returnDate);
            if (returnDate <= departureDate) {
                this.showError('Return date must be after departure date.');
                return false;
            }
        }
        
        return true;
    }

    showLoading(show) {
        const searchBtn = document.querySelector('.search-flights-btn');
        
        if (show) {
            searchBtn.disabled = true;
            searchBtn.textContent = 'Searching Flights...';
            searchBtn.style.opacity = '0.7';
        } else {
            searchBtn.disabled = false;
            searchBtn.textContent = 'Search Flights';
            searchBtn.style.opacity = '1';
        }
    }

    showError(message) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.error-message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: 500;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// Global functions for HTML onclick events
function swapCities() {
    const fromSelect = document.getElementById('fromCity');
    const toSelect = document.getElementById('toCity');
    
    const fromValue = fromSelect.value;
    const toValue = toSelect.value;
    
    fromSelect.value = toValue;
    toSelect.value = fromValue;
    
    // Add animation effect
    const swapBtn = document.querySelector('.swap-btn');
    swapBtn.style.transform = 'rotate(180deg)';
    setTimeout(() => {
        swapBtn.style.transform = 'rotate(0deg)';
    }, 300);
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}

// Initialize search functionality
document.addEventListener('DOMContentLoaded', () => {
    new FlightSearch();
});
