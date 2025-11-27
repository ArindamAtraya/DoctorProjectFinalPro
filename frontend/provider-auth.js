// Provider Authentication System with Device Detection
class ProviderAuth {
    constructor() {
        this.currentProviderType = 'pharmacy';
        this.isMobile = this.detectMobile();
        this.isTablet = this.detectTablet();
        this.isTouchDevice = this.detectTouchDevice();
        
        this.init();
    }

    // Device detection methods
    detectMobile() {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    detectTablet() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    }

    detectTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    // Initialize the provider auth page
    init() {
        this.setupEventListeners();
        this.applyDeviceSpecificStyles();
        this.updateFacilityPreview();
        
        console.log(`Device: ${this.isMobile ? 'Mobile' : this.isTablet ? 'Tablet' : 'Desktop'}, Touch: ${this.isTouchDevice}`);
    }

    // Apply device-specific styles and behaviors
    applyDeviceSpecificStyles() {
        if (this.isMobile) {
            document.body.classList.add('mobile-device');
            this.optimizeForMobile();
        } else if (this.isTablet) {
            document.body.classList.add('tablet-device');
        } else {
            document.body.classList.add('desktop-device');
        }

        if (this.isTouchDevice) {
            document.body.classList.add('touch-device');
            this.enhanceTouchInteractions();
        }
    }

    // Optimize for mobile devices
    optimizeForMobile() {
        const style = document.createElement('style');
        style.textContent = `
            .mobile-device .btn {
                min-height: 44px;
            }
            .mobile-device .form-control {
                font-size: 16px;
            }
            .mobile-device .provider-type-btn {
                min-height: 60px;
            }
        `;
        document.head.appendChild(style);

        document.addEventListener('touchstart', function() {}, { passive: true });
    }

    // Enhance touch interactions
    enhanceTouchInteractions() {
        const touchElements = document.querySelectorAll('.btn, .provider-type-btn, .auth-tab, .form-control');
        
        touchElements.forEach(element => {
            element.addEventListener('touchstart', function() {
                this.classList.add('touch-active');
            }, { passive: true });
            
            element.addEventListener('touchend', function() {
                this.classList.remove('touch-active');
            }, { passive: true });
        });
    }

    // Setup event listeners
    setupEventListeners() {
        document.querySelectorAll('.provider-type-btn').forEach(btn => {
            if (this.isTouchDevice) {
                btn.addEventListener('touchstart', (e) => this.handleProviderTypeSelect(e));
            } else {
                btn.addEventListener('click', (e) => this.handleProviderTypeSelect(e));
            }
        });

        document.querySelectorAll('.auth-tab').forEach(tab => {
            if (this.isTouchDevice) {
                tab.addEventListener('touchstart', (e) => this.handleAuthTabSelect(e));
            } else {
                tab.addEventListener('click', (e) => this.handleAuthTabSelect(e));
            }
        });

        document.getElementById('providerLoginForm').addEventListener('submit', (e) => this.handleProviderLogin(e));
        document.getElementById('providerSignupForm').addEventListener('submit', (e) => this.handleProviderSignup(e));

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

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 300);
        });

        window.addEventListener('resize', debounce(() => {
            this.handleResize();
        }, 250));
    }

    handleProviderTypeSelect(e) {
        e.preventDefault();
        const target = e.currentTarget;
        const providerType = target.getAttribute('data-type');
        
        document.querySelectorAll('.provider-type-btn').forEach(b => {
            b.classList.remove('active');
        });
        
        target.classList.add('active');
        this.currentProviderType = providerType;
        this.updateFacilityPreview();
        
        if (this.isTouchDevice && navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    handleAuthTabSelect(e) {
        e.preventDefault();
        const target = e.currentTarget;
        const tabId = target.getAttribute('data-tab');
        
        document.querySelectorAll('.auth-tab').forEach(t => {
            t.classList.remove('active');
        });
        target.classList.add('active');

        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`provider${tabId.charAt(0).toUpperCase() + tabId.slice(1)}Form`).classList.add('active');

        if (this.isTouchDevice && navigator.vibrate) {
            navigator.vibrate(30);
        }
    }

    updateFacilityPreview() {
        const facilityName = document.getElementById('facilityName').value || 'Your Facility Name';
        const facilityAddress = document.getElementById('facilityAddress').value || 'Your facility address will appear here';
        
        document.getElementById('previewFacilityName').textContent = facilityName;
        document.getElementById('previewFacilityType').textContent = this.currentProviderType.charAt(0).toUpperCase() + this.currentProviderType.slice(1);
        document.getElementById('previewFacilityAddress').textContent = facilityAddress;

        const preview = document.getElementById('facilityPreview');
        if (facilityName !== 'Your Facility Name' || facilityAddress !== 'Your facility address will appear here') {
            preview.classList.add('active');
        } else {
            preview.classList.remove('active');
        }
    }

    async handleProviderLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('providerLoginEmail').value;
        const password = document.getElementById('providerLoginPassword').value;

        this.setLoadingState('providerLoginForm', true);

        try {
            const data = await this.apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            localStorage.setItem('token', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            
            this.showNotification('Provider login successful!', 'success');
            
            setTimeout(() => {
                window.location.href = 'provider-dashboard.html';
            }, 1000);

        } catch (error) {
            this.handleDemoProviderLogin(email, password);
        } finally {
            this.setLoadingState('providerLoginForm', false);
        }
    }

    async handleProviderSignup(e) {
        e.preventDefault();
        
        const facilityName = document.getElementById('facilityName').value;
        const email = document.getElementById('providerSignupEmail').value;
        const password = document.getElementById('providerSignupPassword').value;
        const phone = document.getElementById('providerPhone').value;
        const registrationNumber = document.getElementById('registrationNumber').value;
        const address = document.getElementById('facilityAddress').value;
        const district = document.getElementById('facilityDistrict').value;
        const state = document.getElementById('facilityState').value;

        if (!this.validateProviderForm(facilityName, email, password, phone, registrationNumber, address, district, state)) {
            return;
        }

        const providerData = {
            name: facilityName,
            email: email,
            password: password,
            phone: phone,
            role: this.currentProviderType,
            providerInfo: {
                facilityName: facilityName,
                facilityType: this.currentProviderType,
                registrationNumber: registrationNumber,
                address: address,
                district: district,
                state: state
            }
        };

        this.setLoadingState('providerSignupForm', true);

        try {
            const data = await this.apiCall('/auth/register', {
                method: 'POST',
                body: JSON.stringify(providerData)
            });

            localStorage.setItem('token', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            
            this.showNotification(`${this.currentProviderType.charAt(0).toUpperCase() + this.currentProviderType.slice(1)} registered successfully!`, 'success');
            
            setTimeout(() => {
                window.location.href = 'provider-dashboard.html';
            }, 1500);

        } catch (error) {
            this.createDemoProviderAccount(providerData);
        } finally {
            this.setLoadingState('providerSignupForm', false);
        }
    }

    validateProviderForm(facilityName, email, password, phone, registrationNumber, address, district, state) {
        if (!facilityName || !email || !password || !phone || !registrationNumber || !address || !district || !state) {
            this.showNotification('Please fill in all required fields', 'error');
            return false;
        }

        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters long', 'error');
            return false;
        }

        if (!this.isValidEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return false;
        }

        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    setLoadingState(formId, isLoading) {
        const form = document.getElementById(formId);
        const submitButton = form.querySelector('button[type="submit"]');
        const inputs = form.querySelectorAll('input, textarea, select');

        if (isLoading) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Processing...</span>';
            inputs.forEach(input => input.disabled = true);
        } else {
            submitButton.disabled = false;
            if (formId === 'providerLoginForm') {
                submitButton.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Login as Provider</span>';
            } else {
                submitButton.innerHTML = '<i class="fas fa-user-plus"></i><span>Register Facility</span>';
            }
            inputs.forEach(input => input.disabled = false);
        }
    }

    handleDemoProviderLogin(email, password) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email && u.password === password && ['pharmacy', 'clinic', 'hospital'].includes(u.role));
        
        if (user) {
            const token = 'demo_token_' + Math.random().toString(36).substr(2);
            localStorage.setItem('token', token);
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            this.showNotification('Demo provider login successful!', 'success');
            
            setTimeout(() => {
                window.location.href = 'provider-dashboard.html';
            }, 1000);
        } else {
            this.showNotification('Invalid credentials or not a provider account', 'error');
        }
    }

    createDemoProviderAccount(providerData) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        if (users.find(u => u.email === providerData.email)) {
            this.showNotification('Provider already exists with this email', 'error');
            return;
        }
        
        const newProvider = {
            id: 'provider_' + Date.now(),
            name: providerData.name,
            email: providerData.email,
            password: providerData.password,
            phone: providerData.phone,
            role: providerData.role,
            providerInfo: providerData.providerInfo,
            createdAt: new Date()
        };
        
        users.push(newProvider);
        localStorage.setItem('users', JSON.stringify(users));
        
        const providers = JSON.parse(localStorage.getItem('healthcareProviders')) || [];
        const newProviderRecord = {
            id: newProvider.id,
            userId: newProvider.id,
            name: providerData.name,
            type: providerData.role,
            address: providerData.providerInfo.address,
            phone: providerData.phone,
            email: providerData.email,
            registrationNumber: providerData.providerInfo.registrationNumber,
            doctors: [],
            facilities: this.getDefaultFacilities(providerData.role),
            rating: 4.5 + Math.random() * 0.5,
            totalReviews: Math.floor(Math.random() * 100) + 20
        };
        
        providers.push(newProviderRecord);
        localStorage.setItem('healthcareProviders', JSON.stringify(providers));
        
        const token = 'demo_token_' + Math.random().toString(36).substr(2);
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(newProvider));
        
        this.showNotification(`Demo ${providerData.role} account created successfully!`, 'success');
        
        setTimeout(() => {
            window.location.href = 'provider-dashboard.html';
        }, 1500);
    }

    getDefaultFacilities(providerType) {
        const facilities = {
            pharmacy: ['Pharmacy', 'Basic Consultation', 'Medicine Delivery'],
            clinic: ['Consultation', 'Minor Procedures', 'Vaccination', 'Lab Tests'],
            hospital: ['Emergency', 'ICU', 'Pharmacy', 'Lab', 'Surgery', 'Radiology']
        };
        return facilities[providerType] || ['Healthcare Services'];
    }

    async apiCall(endpoint, options = {}) {
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const url = `http://localhost:5000/api${endpoint}`;
            console.log('📤 API Call:', url);
            
            const response = await fetch(url, {
                headers,
                ...options
            });

            console.log('📊 Response Status:', response.status);
            const data = await response.json();
            console.log('📥 Response Data:', data);

            if (!response.ok) {
                throw new Error(data.error || `API call failed: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            console.error('❌ API Call Error:', error);
            throw error;
        }
    }

    handleOrientationChange() {
        console.log('Orientation changed:', window.orientation);
        if (this.isMobile) {
            this.optimizeForMobile();
        }
    }

    handleResize() {
        const wasMobile = this.isMobile;
        const wasTablet = this.isTablet;
        
        this.isMobile = this.detectMobile();
        this.isTablet = this.detectTablet();
        
        if (wasMobile !== this.isMobile || wasTablet !== this.isTablet) {
            document.body.classList.remove('mobile-device', 'tablet-device', 'desktop-device');
            this.applyDeviceSpecificStyles();
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 10px;
                    color: white;
                    font-weight: 600;
                    z-index: 10000;
                    transform: translateX(400px);
                    transition: transform 0.4s ease;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    max-width: 90%;
                }
                .notification.show {
                    transform: translateX(0);
                }
                .notification.success {
                    background: linear-gradient(135deg, #10b981, #0da271);
                }
                .notification.error {
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                }
                .notification.info {
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                }
                @media (max-width: 768px) {
                    .notification {
                        right: 10px;
                        left: 10px;
                        top: 10px;
                        max-width: none;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        }, 4000);
        
        notification.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        });
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    new ProviderAuth();
});

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        
    } else {
        
    }
});