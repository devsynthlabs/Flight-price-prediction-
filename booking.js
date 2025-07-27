// SkyBooker Booking Page
class FlightBooking {
    constructor() {
        this.selectedFlight = null;
        this.searchData = null;
        this.selectedSeats = [];
        this.baseFare = 0;
        this.taxes = 0;
        this.seatFee = 0;
        this.init();
    }

    init() {
        this.loadFlightData();
        this.generatePassengerForms();
        this.generateSeatMap();
        this.bindEvents();
        this.updateBookingSummary();
    }

    loadFlightData() {
        const flightData = sessionStorage.getItem('selectedFlight');
        if (!flightData) {
            window.location.href = 'search.html';
            return;
        }
        
        const data = JSON.parse(flightData);
        this.selectedFlight = data.flight;
        this.searchData = data.searchData;
        this.baseFare = this.selectedFlight.price;
        this.taxes = Math.round(this.baseFare * 0.18); // 18% taxes
        
        this.displayFlightSummary();
    }

    displayFlightSummary() {
        const summaryContainer = document.getElementById('flightSummary');
        const flight = this.selectedFlight;
        const search = this.searchData;
        
        // Calculate arrival time
        const arrivalTime = this.calculateArrivalTime(flight.departure_time, parseFloat(flight.duration));
        
        summaryContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div>
                    <h3 style="color: #333; margin-bottom: 5px;">${flight.airline} ${flight.flight_number || flight.airline.substring(0,2).toUpperCase() + '123'}</h3>
                    <p style="color: #666;">${search.from} (${search.from.substring(0,3).toUpperCase()}) → ${search.to} (${search.to.substring(0,3).toUpperCase()})</p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: #27ae60;">₹${flight.price.toLocaleString()}</div>
                    <div style="font-size: 0.8rem; color: #666;">per person</div>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 20px; align-items: center;">
                <div style="text-align: center;">
                    <div style="font-size: 1.2rem; font-weight: 600;">${flight.departure_time}</div>
                    <div style="color: #666; font-size: 0.9rem;">${search.from}</div>
                </div>
                <div style="text-align: center; color: #666;">
                    <div style="font-size: 0.9rem;">${flight.duration}h</div>
                    <div style="font-size: 0.8rem;">${flight.stops === 'zero' ? 'Nonstop' : flight.stops === 'one' ? '1 Stop' : '2+ Stops'}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.2rem; font-weight: 600;">${arrivalTime}</div>
                    <div style="color: #666; font-size: 0.9rem;">${search.to}</div>
                </div>
            </div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 0.9rem; color: #666;">
                Duration: ${flight.duration} hours • ${search.class} Class • Safety Score: ${flight.safety_score}/10
            </div>
        `;
    }

    calculateArrivalTime(departureTime, duration) {
        const [hours, minutes] = departureTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + (duration * 60);
        const arrivalHours = Math.floor(totalMinutes / 60) % 24;
        const arrivalMinutes = Math.floor(totalMinutes % 60);
        
        return `${arrivalHours.toString().padStart(2, '0')}:${arrivalMinutes.toString().padStart(2, '0')}`;
    }

    generateSeatMap() {
        const seatMap = document.getElementById('seatMap');
        const passengerCount = this.searchData.passengers || 1;
        const rows = 12;
        const seatsPerRow = 6;
        const seatLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
        
        // Update seat selection title
        const seatSection = document.querySelector('.form-section:nth-child(2) .section-title');
        seatSection.textContent = `Select Seats (${passengerCount} seat${passengerCount > 1 ? 's' : ''} required)`;
        
        seatMap.innerHTML = '';
        
        // Add seat map header
        const seatHeader = document.createElement('div');
        seatHeader.style.cssText = 'text-align: center; margin-bottom: 15px; color: #666; font-weight: 600;';
        seatHeader.innerHTML = `
            <div style="margin-bottom: 10px;">Aircraft Seat Map</div>
            <div style="font-size: 0.8rem; color: #999;">Select ${passengerCount} seat${passengerCount > 1 ? 's' : ''} for your passengers</div>
        `;
        seatMap.insertAdjacentElement('beforebegin', seatHeader);
        
        for (let row = 1; row <= rows; row++) {
            for (let col = 0; col < seatsPerRow; col++) {
                const seatId = `${row}${seatLabels[col]}`;
                const seat = document.createElement('div');
                seat.className = 'seat';
                seat.textContent = seatId;
                seat.dataset.seatId = seatId;
                
                // Randomly assign some seats as occupied (for demo)
                const isOccupied = Math.random() < 0.25;
                if (isOccupied) {
                    seat.classList.add('occupied');
                } else {
                    seat.classList.add('available');
                    seat.addEventListener('click', () => this.selectSeat(seatId));
                }
                
                seatMap.appendChild(seat);
            }
        }
        
        // Initialize selected seats array
        this.selectedSeats = [];
        this.updateBookingSummary();
    }

    selectSeat(seatId) {
        const passengerCount = this.searchData.passengers || 1;
        const seatElement = document.querySelector(`[data-seat-id="${seatId}"]`);
        
        // Check if seat is already selected
        if (this.selectedSeats.includes(seatId)) {
            // Deselect seat
            const index = this.selectedSeats.indexOf(seatId);
            this.selectedSeats.splice(index, 1);
            seatElement.classList.remove('selected');
            seatElement.classList.add('available');
        } else {
            // Check if we can select more seats
            if (this.selectedSeats.length >= passengerCount) {
                this.showSeatError(`You can only select ${passengerCount} seat${passengerCount > 1 ? 's' : ''} for ${passengerCount} passenger${passengerCount > 1 ? 's' : ''}.`);
                return;
            }
            
            // Select new seat
            this.selectedSeats.push(seatId);
            seatElement.classList.remove('available');
            seatElement.classList.add('selected');
        }
        
        // Calculate total seat fees
        this.calculateSeatFees();
        this.updateBookingSummary();
        
        // Update seat selection display
        this.updateSeatSelectionDisplay();
    }
    
    calculateSeatFees() {
        let totalSeatFee = 0;
        
        this.selectedSeats.forEach(seatId => {
            const row = parseInt(seatId);
            if (row <= 3) {
                totalSeatFee += 500; // Premium seats
            } else if (row <= 6) {
                totalSeatFee += 200; // Standard seats
            } else {
                totalSeatFee += 0; // Economy seats
            }
        });
        
        this.seatFee = totalSeatFee;
    }
    
    updateSeatSelectionDisplay() {
        const passengerCount = this.searchData.passengers || 1;
        const selectedCount = this.selectedSeats.length;
        
        // Find or create seat selection status
        let statusDiv = document.querySelector('.seat-selection-status');
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.className = 'seat-selection-status';
            statusDiv.style.cssText = 'text-align: center; margin-top: 15px; padding: 10px; border-radius: 8px; font-weight: 500;';
            document.querySelector('.seat-legend').insertAdjacentElement('afterend', statusDiv);
        }
        
        if (selectedCount === 0) {
            statusDiv.innerHTML = `<span style="color: #666;">Please select ${passengerCount} seat${passengerCount > 1 ? 's' : ''}</span>`;
            statusDiv.style.background = '#f8f9fa';
        } else if (selectedCount < passengerCount) {
            statusDiv.innerHTML = `<span style="color: #f39c12;">Selected ${selectedCount} of ${passengerCount} seats</span>`;
            statusDiv.style.background = '#fff3cd';
        } else {
            statusDiv.innerHTML = `<span style="color: #27ae60;">✓ All ${passengerCount} seats selected: ${this.selectedSeats.join(', ')}</span>`;
            statusDiv.style.background = '#d4edda';
        }
    }
    
    showSeatError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'seat-error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 500;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            z-index: 1001;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 3000);
    }

    updateBookingSummary() {
        const summaryContainer = document.getElementById('bookingSummary');
        const total = this.baseFare + this.taxes + this.seatFee;
        
        const passengerCount = this.searchData.passengers || 1;
        const totalBaseFare = this.baseFare * passengerCount;
        const totalTaxes = this.taxes * passengerCount;
        const totalSeatFee = this.seatFee * passengerCount;
        const grandTotal = totalBaseFare + totalTaxes + totalSeatFee;
        
        summaryContainer.innerHTML = `
            <h3 style="margin-bottom: 15px; color: #333;">Booking Summary</h3>
            <div class="summary-row">
                <span>Base Fare (${passengerCount} passenger${passengerCount > 1 ? 's' : ''})</span>
                <span>₹${totalBaseFare.toLocaleString()}</span>
            </div>
            <div class="summary-row">
                <span>Taxes & Fees</span>
                <span>₹${totalTaxes.toLocaleString()}</span>
            </div>
            <div class="summary-row">
                <span>Seat Selection${this.selectedSeats.length > 0 ? ` (${this.selectedSeats.join(', ')})` : ''}</span>
                <span>₹${totalSeatFee.toLocaleString()}</span>
            </div>
            <div class="summary-row summary-total">
                <span>Total Amount</span>
                <span>₹${grandTotal.toLocaleString()}</span>
            </div>
        `;
    }

    generatePassengerForms() {
        const passengerCount = this.searchData.passengers || 1;
        const passengerSection = document.querySelector('.form-section');
        
        // Update section title
        const sectionTitle = passengerSection.querySelector('.section-title');
        sectionTitle.textContent = `Passenger Information (${passengerCount} Passenger${passengerCount > 1 ? 's' : ''})`;
        
        // Clear existing form grids and passenger headings
        const existingGrids = passengerSection.querySelectorAll('.form-grid');
        const existingHeadings = passengerSection.querySelectorAll('h4');
        existingGrids.forEach(grid => grid.remove());
        existingHeadings.forEach(heading => heading.remove());
        
        // Generate forms for each passenger
        let lastInsertedElement = sectionTitle;
        
        for (let i = 0; i < passengerCount; i++) {
            // Create passenger heading (except for first passenger)
            if (i > 0) {
                const passengerHeading = document.createElement('h4');
                passengerHeading.style.cssText = 'margin: 25px 0 15px 0; color: #666; border-top: 1px solid #ddd; padding-top: 20px; font-weight: 600;';
                passengerHeading.textContent = `Passenger ${i + 1}`;
                lastInsertedElement.insertAdjacentElement('afterend', passengerHeading);
                lastInsertedElement = passengerHeading;
            }
            
            // Create form grids for this passenger
            const formGrids = [
                // Name fields
                `<div class="form-grid">
                    <div class="form-field">
                        <label class="field-label">First Name</label>
                        <input type="text" class="field-input" id="firstName${i}" placeholder="Enter first name" required>
                    </div>
                    <div class="form-field">
                        <label class="field-label">Last Name</label>
                        <input type="text" class="field-input" id="lastName${i}" placeholder="Enter last name" required>
                    </div>
                </div>`,
                // Contact fields
                `<div class="form-grid">
                    <div class="form-field">
                        <label class="field-label">Email</label>
                        <input type="email" class="field-input" id="email${i}" placeholder="Enter email address" required>
                    </div>
                    <div class="form-field">
                        <label class="field-label">Phone Number</label>
                        <input type="tel" class="field-input" id="phone${i}" placeholder="Enter phone number" required>
                    </div>
                </div>`,
                // Personal details
                `<div class="form-grid">
                    <div class="form-field">
                        <label class="field-label">Date of Birth</label>
                        <input type="date" class="field-input" id="dateOfBirth${i}" required>
                    </div>
                    <div class="form-field">
                        <label class="field-label">Gender</label>
                        <select class="field-select" id="gender${i}" required>
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>`
            ];
            
            // Insert each form grid
            formGrids.forEach(gridHTML => {
                const gridDiv = document.createElement('div');
                gridDiv.innerHTML = gridHTML;
                const gridElement = gridDiv.firstElementChild;
                lastInsertedElement.insertAdjacentElement('afterend', gridElement);
                lastInsertedElement = gridElement;
            });
        }
        
        // Pre-fill first passenger with user data
        this.prefillUserData();
    }

    prefillUserData() {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        
        // Only pre-fill first passenger (index 0) with user data if not guest
        if (!user.isGuest && user.email) {
            const firstName = document.getElementById('firstName0');
            const email = document.getElementById('email0');
            
            if (firstName) firstName.value = user.name ? user.name.split(' ')[0] : '';
            if (email) email.value = user.email || '';
        }
    }

    bindEvents() {
        document.getElementById('passengerForm').addEventListener('submit', (e) => this.handleBooking(e));
    }

    async handleBooking(e) {
        e.preventDefault();
        
        const passengerCount = this.searchData.passengers || 1;
        if (this.selectedSeats.length !== passengerCount) {
            this.showError(`Please select ${passengerCount} seat${passengerCount > 1 ? 's' : ''} for ${passengerCount} passenger${passengerCount > 1 ? 's' : ''}.`);
            return;
        }
        
        const formData = this.getFormData();
        const submitBtn = e.target.querySelector('.proceed-btn');
        
        // Show loading state
        this.setLoadingState(submitBtn, true);
        
        try {
            // Simulate booking process
            await this.delay(2000);
            
            // Store booking data
            const passengerCount = this.searchData.passengers || 1;
            const totalBaseFare = this.baseFare * passengerCount;
            const totalTaxes = this.taxes * passengerCount;
            const totalSeatFee = this.seatFee * passengerCount;
            
            const bookingData = {
                flight: this.selectedFlight,
                searchData: this.searchData,
                passengers: formData,
                seats: this.selectedSeats,
                pricing: {
                    baseFare: this.baseFare,
                    totalBaseFare: totalBaseFare,
                    taxes: this.taxes,
                    totalTaxes: totalTaxes,
                    seatFee: this.seatFee,
                    totalSeatFee: totalSeatFee,
                    total: totalBaseFare + totalTaxes + totalSeatFee,
                    passengerCount: passengerCount
                },
                bookingTime: new Date().toISOString()
            };
            
            sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
            
            // Redirect to payment
            window.location.href = 'payment.html';
            
        } catch (error) {
            this.showError('Booking failed. Please try again.');
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    getFormData() {
        const passengerCount = this.searchData.passengers || 1;
        const passengers = [];
        
        for (let i = 0; i < passengerCount; i++) {
            passengers.push({
                firstName: document.getElementById(`firstName${i}`).value,
                lastName: document.getElementById(`lastName${i}`).value,
                email: document.getElementById(`email${i}`).value,
                phone: document.getElementById(`phone${i}`).value,
                dateOfBirth: document.getElementById(`dateOfBirth${i}`).value,
                gender: document.getElementById(`gender${i}`).value
            });
        }
        
        return passengers;
    }

    setLoadingState(button, loading) {
        if (loading) {
            button.disabled = true;
            button.textContent = 'Processing...';
            button.style.opacity = '0.7';
        } else {
            button.disabled = false;
            button.textContent = 'Proceed to Payment';
            button.style.opacity = '1';
        }
    }

    showError(message) {
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
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize booking page
document.addEventListener('DOMContentLoaded', () => {
    new FlightBooking();
});
