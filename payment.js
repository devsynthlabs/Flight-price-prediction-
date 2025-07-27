// SkyBooker Payment Page
class PaymentProcessor {
    constructor() {
        this.bookingData = null;
        this.selectedPaymentMethod = 'card';
        this.init();
    }

    init() {
        this.loadBookingData();
        this.displayOrderSummary();
        this.prefillDemoData();
        this.bindEvents();
    }

    loadBookingData() {
        const data = sessionStorage.getItem('bookingData');
        if (!data) {
            alert('No booking data found. Redirecting to search.');
            window.location.href = 'search.html';
            return;
        }
        this.bookingData = JSON.parse(data);
    }

    displayOrderSummary() {
        if (!this.bookingData) {
            console.error('No booking data found');
            return;
        }

        const { flight, searchData, passengers, seats, pricing } = this.bookingData;
        
        // Flight info
        document.getElementById('flightInfoSummary').innerHTML = `
            <div style="font-weight: 600; color: #333; margin-bottom: 5px;">
                ${flight.airline} ${flight.flight_number || flight.airline.substring(0,2).toUpperCase() + '123'}
            </div>
            <div style="color: #666; font-size: 0.9rem;">
                ${searchData.from} → ${searchData.to} • ${flight.duration}h • ${flight.stops === 'zero' ? 'Nonstop' : flight.stops === 'one' ? '1 Stop' : '2+ Stops'}
            </div>
        `;

        // Passenger info - handle multiple passengers
        const passengerCount = passengers ? passengers.length : 1;
        let passengerInfoHTML = '';
        
        if (passengers && passengers.length > 0) {
            passengers.forEach((passenger, index) => {
                const seatInfo = seats && seats[index] ? seats[index] : 'Not selected';
                passengerInfoHTML += `
                    <div style="margin-bottom: 10px; padding: 8px; background: #f8f9fa; border-radius: 6px;">
                        <div style="font-weight: 600; color: #333;">${passenger.firstName} ${passenger.lastName}</div>
                        <div style="color: #666; font-size: 0.9rem;">Seat: ${seatInfo} • ${searchData.class} Class</div>
                        ${passenger.email ? `<div style="color: #666; font-size: 0.8rem;">${passenger.email}</div>` : ''}
                    </div>
                `;
            });
        } else {
            passengerInfoHTML = `
                <div style="font-weight: 600; color: #333;">Passenger Information</div>
                <div style="color: #666; font-size: 0.9rem;">Details not available</div>
            `;
        }
        
        document.getElementById('passengerInfoSummary').innerHTML = passengerInfoHTML;

        // Price breakdown - handle new pricing structure
        const totalBaseFare = pricing.totalBaseFare || pricing.baseFare || 0;
        const totalTaxes = pricing.totalTaxes || pricing.taxes || 0;
        const totalSeatFee = pricing.totalSeatFee || pricing.seatFee || 0;
        const total = pricing.total || (totalBaseFare + totalTaxes + totalSeatFee);
        const passengerCountText = pricing.passengerCount || passengerCount;
        
        document.getElementById('priceBreakdownSummary').innerHTML = `
            <div class="price-row">
                <span>Base Fare (${passengerCountText} passenger${passengerCountText > 1 ? 's' : ''})</span>
                <span>₹${totalBaseFare.toLocaleString()}</span>
            </div>
            <div class="price-row">
                <span>Taxes & Fees</span>
                <span>₹${totalTaxes.toLocaleString()}</span>
            </div>
            <div class="price-row">
                <span>Seat Selection${seats && seats.length > 0 ? ` (${seats.join(', ')})` : ''}</span>
                <span>₹${totalSeatFee.toLocaleString()}</span>
            </div>
            <div class="price-total">
                <span>Total Amount</span>
                <span>₹${total.toLocaleString()}</span>
            </div>
        `;

        document.getElementById('totalPrice').textContent = total.toLocaleString();
    }

    prefillDemoData() {
        // No pre-filled data - users enter their own information
        // Fields start empty for better user experience
    }

    bindEvents() {
        // Format card number input
        document.getElementById('cardNumber').addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            if (formattedValue !== e.target.value) {
                e.target.value = formattedValue;
            }
        });

        // Format expiry date input
        document.getElementById('expiryDate').addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });

        // Format CVV input (numbers only)
        document.getElementById('cvv').addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
}

// Global functions for HTML onclick events
function selectPaymentMethod(method) {
    const paymentProcessor = window.paymentProcessorInstance;
    paymentProcessor.selectedPaymentMethod = method;
    
    // Update active payment method
    document.querySelectorAll('.payment-method').forEach(el => el.classList.remove('active'));
    event.target.closest('.payment-method').classList.add('active');

    // Show/hide payment forms
    document.querySelectorAll('.payment-form').forEach(el => el.classList.remove('active'));
    document.getElementById(method + 'Form').classList.add('active');
}

function processPayment() {
    const paymentProcessor = window.paymentProcessorInstance;
    const payBtn = document.getElementById('payBtn');
    
    // Validate form (simplified for demo)
    if (paymentProcessor.selectedPaymentMethod === 'card') {
        const cardNumber = document.getElementById('cardNumber').value;
        const expiryDate = document.getElementById('expiryDate').value;
        const cvv = document.getElementById('cvv').value;
        const cardName = document.getElementById('cardName').value;

        if (!cardNumber || !expiryDate || !cvv || !cardName) {
            alert('Please fill in all card details.');
            return;
        }
    }

    // Show processing state
    payBtn.disabled = true;
    payBtn.innerHTML = 'Processing Payment...';

    // Simulate payment processing
    setTimeout(() => {
        // Generate confirmation number
        const confirmationNumber = 'SKY' + Math.random().toString(36).substr(2, 6).toUpperCase();
        document.getElementById('confirmationNumber').textContent = confirmationNumber;

        // Show success modal
        document.getElementById('successModal').style.display = 'flex';

        // Reset button
        payBtn.disabled = false;
        payBtn.innerHTML = 'Pay Now • ₹<span id="totalPrice">' + paymentProcessor.bookingData.pricing.total.toLocaleString() + '</span>';
    }, 3000);
}

function closeModal() {
    document.getElementById('successModal').style.display = 'none';
    // Clear session data and redirect
    sessionStorage.clear();
    setTimeout(() => {
        alert('Thank you for booking with AI Analyser! Have a safe journey.');
        window.location.href = 'index.html';
    }, 1000);
}

// Initialize payment processor
let paymentProcessorInstance;
document.addEventListener('DOMContentLoaded', () => {
    paymentProcessorInstance = new PaymentProcessor();
    window.paymentProcessorInstance = paymentProcessorInstance;
});
