// Physio Clinic Authentication System
class PhysioAuth {
    constructor() {
        this.currentProviderType = 'physio';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateFacilityPreview();
    }

    setupEventListeners() {
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleAuthTabSelect(e));
        });

        document.getElementById('physioLoginForm').addEventListener('submit', (e) => this.handlePhysioLogin(e));
        document.getElementById('physioSignupForm').addEventListener('submit', (e) => this.handlePhysioSignup(e));

        const debounce = (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        };

        const debouncedPreviewUpdate = debounce(() => this.updateFacilityPreview(), 300);
        document.getElementById('facilityName').addEventListener('input', debouncedPreviewUpdate);
        document.getElementById('facilityAddress').addEventListener('input', debouncedPreviewUpdate);
    }

    handleAuthTabSelect(e) {
        e.preventDefault();
        const target = e.currentTarget;
        const tabId = target.getAttribute('data-tab');
        
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        target.classList.add('active');

        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        document.getElementById(`physio${tabId.charAt(0).toUpperCase() + tabId.slice(1)}Form`).classList.add('active');
    }

    updateFacilityPreview() {
        const facilityName = document.getElementById('facilityName').value || 'Your Clinic Name';
        const facilityAddress = document.getElementById('facilityAddress').value || 'Your clinic address will appear here';
        
        document.getElementById('previewFacilityName').textContent = facilityName;
        document.getElementById('previewFacilityAddress').textContent = facilityAddress;

        const preview = document.getElementById('facilityPreview');
        if (facilityName !== 'Your Clinic Name' || facilityAddress !== 'Your clinic address will appear here') {
            preview.classList.add('active');
        } else {
            preview.classList.remove('active');
        }
    }

    async handlePhysioLogin(e) {
        e.preventDefault();
        const email = document.getElementById('physioLoginEmail').value;
        const password = document.getElementById('physioLoginPassword').value;

        this.setLoadingState('physioLoginForm', true);

        try {
            const data = await this.apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            localStorage.setItem('token', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            this.showNotification('Physio login successful!', 'success');
            setTimeout(() => window.location.href = 'physio-dashboard.html', 1000);
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification(error.message || 'Login failed', 'error');
        } finally {
            this.setLoadingState('physioLoginForm', false);
        }
    }

    async handlePhysioSignup(e) {
        e.preventDefault();
        const facilityName = document.getElementById('facilityName').value;
        const email = document.getElementById('physioSignupEmail').value;
        const password = document.getElementById('physioSignupPassword').value;
        const phone = document.getElementById('physioPhone').value;
        const registrationNumber = document.getElementById('registrationNumber').value;
        const address = document.getElementById('facilityAddress').value;
        const district = document.getElementById('facilityDistrict').value;
        const state = document.getElementById('facilityState').value;

        const providerData = {
            name: facilityName, 
            email: email,
            password: password,
            phone: phone,
            role: 'physio',
            providerInfo: {
                facilityName: facilityName, 
                facilityType: 'physio',
                registrationNumber,
                address,
                district,
                state
            }
        };

        this.setLoadingState('physioSignupForm', true);

        try {
            const data = await this.apiCall('/auth/register', {
                method: 'POST',
                body: JSON.stringify(providerData)
            });

            localStorage.setItem('token', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            this.showNotification('Clinic registered successfully!', 'success');
            setTimeout(() => window.location.href = 'physio-dashboard.html', 1500);
        } catch (error) {
            console.error('Signup error:', error);
            this.showNotification(error.message || 'Registration failed', 'error');
        } finally {
            this.setLoadingState('physioSignupForm', false);
        }
    }

    setLoadingState(formId, isLoading) {
        const form = document.getElementById(formId);
        const submitButton = form.querySelector('button[type="submit"]');
        const inputs = form.querySelectorAll('input, textarea');

        if (isLoading) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Processing...</span>';
            inputs.forEach(input => input.disabled = true);
        } else {
            submitButton.disabled = false;
            submitButton.innerHTML = formId === 'physioLoginForm' ? 
                '<i class="fas fa-sign-in-alt"></i><span>Login as Physio Clinic</span>' : 
                '<i class="fas fa-user-plus"></i><span>Register Clinic</span>';
            inputs.forEach(input => input.disabled = false);
        }
    }

    handleDemoLogin(email, password) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email && u.password === password && u.role === 'physio');
        if (user) {
            localStorage.setItem('token', 'demo_token_' + Math.random());
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.showNotification('Demo login successful!', 'success');
            setTimeout(() => window.location.href = 'physio-dashboard.html', 1000);
        } else {
            this.showNotification('Invalid credentials', 'error');
        }
    }

    createDemoAccount(data) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        if (users.find(u => u.email === data.email)) {
            this.showNotification('Email already exists', 'error');
            return;
        }
        const newUser = { ...data, id: 'physio_' + Date.now(), createdAt: new Date() };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('token', 'demo_token_' + Math.random());
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        this.showNotification('Demo account created!', 'success');
        setTimeout(() => window.location.href = 'physio-dashboard.html', 1500);
    }

    async apiCall(endpoint, options = {}) {
        const response = await fetch(`/api${endpoint}`, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 15px 20px; 
            border-radius: 10px; color: white; font-weight: 600; z-index: 10000;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => new PhysioAuth());