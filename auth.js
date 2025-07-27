// SkyBooker Authentication System
class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        // Bind form events
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // Bind navigation links
        const signUpLink = document.getElementById('signUpLink');
        const signInLink = document.getElementById('signInLink');
        const guestLink = document.getElementById('guestLink');

        if (signUpLink) {
            signUpLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSignup();
            });
        }

        if (signInLink) {
            signInLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLogin();
            });
        }

        if (guestLink) {
            guestLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.continueAsGuest();
            });
        }

        // Pre-fill demo data
        this.prefillDemoData();
    }

    prefillDemoData() {
        const emailField = document.getElementById('email');
        const passwordField = document.getElementById('password');
        
        if (emailField && passwordField) {
            emailField.value = 'demo@aianalyser.com';
            passwordField.value = 'demo123';
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = e.target.querySelector('.sign-in-btn');
        
        // Show loading state
        this.setLoadingState(submitBtn, true);
        
        try {
            // Make actual API call to Flask backend
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showMessage('Login successful! Redirecting...', 'success');
                
                // Store user session
                sessionStorage.setItem('user', JSON.stringify(result.user));
                
                // Redirect to search page
                setTimeout(() => {
                    window.location.href = 'search.html';
                }, 1000);
            } else {
                throw new Error(result.message || 'Login failed');
            }
        } catch (error) {
            this.showMessage('Invalid email or password. Try demo@aianalyser.com / demo123', 'error');
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const submitBtn = e.target.querySelector('.sign-in-btn');
        
        // Basic validation
        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters', 'error');
            return;
        }
        
        // Show loading state
        this.setLoadingState(submitBtn, true);
        
        try {
            // Simulate API call
            await this.delay(2000);
            
            this.showMessage('Account created successfully! Please sign in.', 'success');
            
            // Switch to login form
            setTimeout(() => {
                this.showLogin();
                document.getElementById('email').value = email;
                document.getElementById('password').value = '';
            }, 1500);
            
        } catch (error) {
            this.showMessage('Failed to create account. Please try again.', 'error');
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    continueAsGuest() {
        // Store guest session
        sessionStorage.setItem('user', JSON.stringify({
            email: 'guest@skybooker.com',
            name: 'Guest User',
            isGuest: true,
            loginTime: new Date().toISOString()
        }));
        
        this.showMessage('Continuing as guest...', 'success');
        
        // Redirect to search page
        setTimeout(() => {
            window.location.href = 'search.html';
        }, 1000);
    }

    showLogin() {
        document.querySelector('.login-card').style.display = 'block';
        document.querySelector('.signup-card').style.display = 'none';
        
        // Reset forms
        document.getElementById('loginForm').reset();
        this.prefillDemoData();
    }

    showSignup() {
        document.querySelector('.login-card').style.display = 'none';
        document.querySelector('.signup-card').style.display = 'block';
        
        // Reset form
        document.getElementById('signupForm').reset();
    }

    setLoadingState(button, loading) {
        if (loading) {
            button.disabled = true;
            button.textContent = 'Loading...';
            button.style.opacity = '0.7';
        } else {
            button.disabled = false;
            button.textContent = button.textContent.includes('Create') ? 'Create Account' : 'Sign In';
            button.style.opacity = '1';
        }
    }

    showMessage(text, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create new message
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            ${type === 'success' ? 'background: #27ae60;' : 'background: #e74c3c;'}
        `;
        
        document.body.appendChild(message);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 5000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Add slideIn animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

// Initialize authentication manager
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});
