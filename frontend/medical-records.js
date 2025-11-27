// Medical Records Management with Authentication
class MedicalRecordsSystem {
    constructor() {
        this.records = JSON.parse(localStorage.getItem('medicalRecords')) || [];
        this.hospitalRecords = JSON.parse(localStorage.getItem('hospitalRecords')) || this.generateSampleHospitalRecords();
        this.currentFilter = 'all';
        this.currentSort = 'newest';
        this.currentUser = null;
    }

    // Generate sample hospital records for demonstration
    generateSampleHospitalRecords() {
        const sampleRecords = [
            {
                id: 'hosp_001',
                patientId: 'P123456',
                patientName: 'John Doe',
                patientDob: '1988-05-15',
                title: 'Complete Blood Count',
                type: 'lab',
                date: new Date().toISOString().split('T')[0],
                hospital: 'Apollo Hospital',
                doctor: 'Dr. Sarah Wilson',
                accessCode: 'ABC123',
                results: [
                    { parameter: 'Hemoglobin', value: '14.2 g/dL', range: '13.5-17.5 g/dL', status: 'normal' },
                    { parameter: 'White Blood Cells', value: '7,200 /μL', range: '4,000-11,000 /μL', status: 'normal' },
                    { parameter: 'Platelets', value: '250,000 /μL', range: '150,000-450,000 /μL', status: 'normal' }
                ],
                notes: 'All parameters within normal range.'
            },
            {
                id: 'hosp_002',
                patientId: 'P123456',
                patientName: 'John Doe',
                patientDob: '1988-05-15',
                title: 'Blood Chemistry Panel',
                type: 'lab',
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                hospital: 'City Medical Center',
                doctor: 'Dr. Michael Brown',
                accessCode: 'DEF456',
                results: [
                    { parameter: 'Glucose (Fasting)', value: '126 mg/dL', range: '70-100 mg/dL', status: 'high' },
                    { parameter: 'Cholesterol', value: '185 mg/dL', range: '<200 mg/dL', status: 'normal' },
                    { parameter: 'Triglycerides', value: '150 mg/dL', range: '<150 mg/dL', status: 'normal' }
                ],
                notes: 'Elevated fasting glucose levels detected. Recommend follow-up consultation.'
            }
        ];
        localStorage.setItem('hospitalRecords', JSON.stringify(sampleRecords));
        return sampleRecords;
    }

    addRecord(recordData) {
        const record = {
            id: this.generateId(),
            ...recordData,
            uploadedAt: new Date().toISOString(),
            fileSize: this.formatFileSize(recordData.file.size),
            source: 'user' // user-uploaded vs hospital-uploaded
        };
        
        this.records.unshift(record);
        this.saveToStorage();
        return record;
    }

    getAllRecords() {
        // Combine user records with accessible hospital records
        const userRecords = this.records;
        const accessibleHospitalRecords = this.getAccessibleHospitalRecords();
        return [...userRecords, ...accessibleHospitalRecords];
    }

    getAccessibleHospitalRecords() {
        if (!this.currentUser) return [];
        
        // In real implementation, this would check patient ID matching
        return this.hospitalRecords.filter(record => 
            record.patientId === this.currentUser.patientId
        );
    }

    getRecordsByType(type) {
        const allRecords = this.getAllRecords();
        if (type === 'hospital') {
            return allRecords.filter(record => record.source === 'hospital');
        }
        return allRecords.filter(record => record.type === type);
    }

    searchHospitalRecords(patientId, dob, accessCode = '') {
        return this.hospitalRecords.filter(record => 
            record.patientId === patientId &&
            record.patientDob === dob &&
            (accessCode === '' || record.accessCode === accessCode)
        );
    }

    searchRecords(query) {
        const allRecords = this.getAllRecords();
        return allRecords.filter(record => 
            record.title.toLowerCase().includes(query.toLowerCase()) ||
            (record.doctor && record.doctor.toLowerCase().includes(query.toLowerCase())) ||
            record.type.toLowerCase().includes(query.toLowerCase()) ||
            (record.description && record.description.toLowerCase().includes(query.toLowerCase()))
        );
    }

    deleteRecord(recordId) {
        this.records = this.records.filter(record => record.id !== recordId);
        this.saveToStorage();
    }

    generateId() {
        return 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    saveToStorage() {
        localStorage.setItem('medicalRecords', JSON.stringify(this.records));
    }

    // Authentication methods
    setCurrentUser(user) {
        this.currentUser = user;
        // Generate a patient ID if not exists
        if (!this.currentUser.patientId) {
            this.currentUser.patientId = 'P' + Math.random().toString(36).substr(2, 9).toUpperCase();
            // Update user in localStorage
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = users.findIndex(u => u.email === user.email);
            if (userIndex !== -1) {
                users[userIndex].patientId = this.currentUser.patientId;
                localStorage.setItem('users', JSON.stringify(users));
            }
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }
}

const medicalRecords = new MedicalRecordsSystem();

// Initialize Medical Records Page
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    setupEventListeners();
});

function checkAuthentication() {
    const savedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
        const user = JSON.parse(savedUser);
        medicalRecords.setCurrentUser(user);
        showMedicalRecordsContent();
        loadRecords();
        updateAuthUI();
    } else {
        showLoginRequired();
    }
}

function showMedicalRecordsContent() {
    document.getElementById('loginRequiredSection').style.display = 'none';
    document.getElementById('medicalRecordsContent').style.display = 'block';
}

function showLoginRequired() {
    document.getElementById('loginRequiredSection').style.display = 'block';
    document.getElementById('medicalRecordsContent').style.display = 'none';
}

function setupEventListeners() {
    // Upload form submission
    document.getElementById('uploadForm').addEventListener('submit', handleRecordUpload);
    
    // Search functionality
    document.getElementById('searchRecords').addEventListener('input', function() {
        if (this.value.length === 0) {
            loadRecords();
        }
    });
    
    // Quick access form
    const quickAccessForm = document.getElementById('quickAccessForm');
    if (quickAccessForm) {
        quickAccessForm.addEventListener('submit', function(e) {
            e.preventDefault();
            accessHospitalReports();
        });
    }
    
    // Medical records login form
    const medicalRecordsLoginForm = document.getElementById('medicalRecordsLoginForm');
    if (medicalRecordsLoginForm) {
        medicalRecordsLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleMedicalRecordsLogin();
        });
    }
    
    // Modal controls
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
}

function updateAuthUI() {
    const authButtonsContainer = document.getElementById('authButtonsContainer');
    if (authButtonsContainer && medicalRecords.currentUser) {
        authButtonsContainer.innerHTML = `
            <span style="margin-right: 15px; font-weight: 600;">Hello, ${medicalRecords.currentUser.name}</span>
            <span style="margin-right: 15px; font-size: 0.8rem; color: var(--gray);">ID: ${medicalRecords.currentUser.patientId}</span>
            <button class="btn btn-outline" onclick="handleLogout()">Logout</button>
        `;
    }
}

function handleMedicalRecordsLogin() {
    const email = document.getElementById('mrLoginEmail').value;
    const password = document.getElementById('mrLoginPassword').value;
    
    // Simple authentication (in real app, this would call your backend)
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // Generate token (simplified)
        const token = 'token_' + Math.random().toString(36).substr(2);
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        medicalRecords.setCurrentUser(user);
        showMedicalRecordsContent();
        loadRecords();
        updateAuthUI();
        closeAllModals();
        showNotification('Login successful!', 'success');
    } else {
        showNotification('Invalid email or password', 'error');
    }
}

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
}

function showSignupModal() {
    // Redirect to main page for signup
    window.location.href = 'index.html';
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        medicalRecords.logout();
        localStorage.removeItem('token');
        showLoginRequired();
        showNotification('Logged out successfully', 'info');
    }
}

function loadRecords() {
    if (!medicalRecords.isAuthenticated()) {
        showLoginRequired();
        return;
    }

    const filter = medicalRecords.currentFilter;
    const sort = document.getElementById('sortRecords').value;
    
    let records = [];
    if (filter === 'all') {
        records = medicalRecords.getAllRecords();
    } else if (filter === 'hospital') {
        records = medicalRecords.getAccessibleHospitalRecords();
    } else {
        records = medicalRecords.getRecordsByType(filter);
    }

    // Sort records
    records.sort((a, b) => {
        switch(sort) {
            case 'oldest':
                return new Date(a.date) - new Date(b.date);
            case 'type':
                return a.type.localeCompare(b.type);
            case 'source':
                return (a.source || 'user').localeCompare(b.source || 'user');
            default: // newest
                return new Date(b.date) - new Date(a.date);
        }
    });

    displayRecords(records);
    updateStats();
}

function displayRecords(records) {
    const container = document.getElementById('recordsContainer');
    
    if (records.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-medical"></i>
                <h3>No medical records found</h3>
                <p>${medicalRecords.currentFilter === 'hospital' ? 
                    'No hospital reports found. Try searching with your patient ID.' : 
                    'Upload your first medical record to get started'}</p>
                <button class="btn btn-primary" onclick="showUploadModal()">
                    <i class="fas fa-upload"></i> Upload Record
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = records.map(record => `
        <div class="record-card ${record.source === 'hospital' ? 'hospital-uploaded' : ''}">
            <div class="record-header">
                <div>
                    <span class="record-type ${record.type}">${getTypeDisplayName(record.type)}</span>
                    ${record.source === 'hospital' ? '<span class="hospital-badge" style="margin-left: 8px;"><i class="fas fa-hospital"></i> Hospital</span>' : ''}
                </div>
                <div class="record-date">${formatDate(record.date)}</div>
            </div>
            
            <div class="record-title">${record.title}</div>
            
            <div class="record-meta">
                <span><i class="fas fa-user-md"></i> ${record.doctor || (record.hospital || 'Self-uploaded')}</span>
                ${record.file ? `<span><i class="fas fa-file"></i> ${record.file.name}</span>` : ''}
                ${record.fileSize ? `<span><i class="fas fa-weight"></i> ${record.fileSize}</span>` : ''}
                ${record.hospital ? `<span><i class="fas fa-hospital"></i> ${record.hospital}</span>` : ''}
            </div>
            
            ${record.description ? `
            <div class="record-description">
                <p>${record.description}</p>
            </div>
            ` : ''}
            
            ${record.notes ? `
            <div class="record-description">
                <p><strong>Notes:</strong> ${record.notes}</p>
            </div>
            ` : ''}
            
            <div class="record-actions">
                <button class="btn btn-primary btn-sm" onclick="viewRecord('${record.id}', ${record.source === 'hospital'})">
                    <i class="fas fa-eye"></i> View
                </button>
                ${record.source === 'hospital' ? `
                <button class="btn btn-outline btn-sm" onclick="downloadHospitalReport('${record.id}')">
                    <i class="fas fa-download"></i> Download
                </button>
                ` : `
                <button class="btn btn-outline btn-sm" onclick="downloadRecord('${record.id}')">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteRecord('${record.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
                `}
            </div>
        </div>
    `).join('');
}

function updateStats() {
    const records = medicalRecords.getAllRecords();
    const labReports = medicalRecords.getRecordsByType('lab').length;
    const hospitalReports = medicalRecords.getAccessibleHospitalRecords().length;
    const scans = medicalRecords.getRecordsByType('scan').length;
    
    document.getElementById('totalRecords').textContent = records.length;
    document.getElementById('labReports').textContent = labReports;
    document.getElementById('hospitalReports').textContent = hospitalReports;
    document.getElementById('scans').textContent = scans;
}

function accessHospitalReports() {
    const patientId = document.getElementById('patientId').value;
    const dob = document.getElementById('patientDob').value;
    const accessCode = document.getElementById('accessCode').value;
    
    if (!patientId || !dob) {
        showNotification('Please fill in Patient ID and Date of Birth', 'error');
        return;
    }
    
    const results = medicalRecords.searchHospitalRecords(patientId, dob, accessCode);
    
    if (results.length > 0) {
        showNotification(`Found ${results.length} hospital report(s)`, 'success');
        // Add these to accessible records (in real app, this would be handled by backend)
        medicalRecords.currentUser.patientId = patientId;
        loadRecords();
    } else {
        showNotification('No hospital reports found with the provided information', 'error');
    }
}

function viewRecord(recordId, isHospitalRecord = false) {
    if (isHospitalRecord) {
        const record = medicalRecords.hospitalRecords.find(r => r.id === recordId);
        if (record) {
            showHospitalReport(record);
        }
    } else {
        const record = medicalRecords.records.find(r => r.id === recordId);
        if (record) {
            showRecordViewer(record);
        }
    }
}

function showHospitalReport(record) {
    document.getElementById('patientNameDisplay').textContent = record.patientName;
    document.getElementById('patientIdDisplay').textContent = record.patientId;
    document.getElementById('patientAgeDisplay').textContent = calculateAge(record.patientDob) + ' years';
    document.getElementById('reportDateDisplay').textContent = formatDate(record.date);
    document.getElementById('hospitalNameDisplay').textContent = record.hospital;
    document.getElementById('doctorNameDisplay').textContent = record.doctor;
    
    const resultsContainer = document.getElementById('labResultsContainer');
    resultsContainer.innerHTML = record.results.map(result => `
        <div class="result-item ${result.status}">
            <div class="result-header">
                <span class="test-name">${result.parameter}</span>
                <span class="result-status">${result.status === 'normal' ? 'Normal' : 'Abnormal'}</span>
            </div>
            <div class="result-details">
                <div class="parameter">
                    <span class="param-name">Value</span>
                    <span class="param-value">${result.value}</span>
                    <span class="param-range">${result.range}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    if (record.notes) {
        resultsContainer.innerHTML += `
            <div class="result-note">
                <strong>Doctor's Notes:</strong> ${record.notes}
            </div>
        `;
    }
    
    document.getElementById('testResultsModal').style.display = 'flex';
}

// Rest of the functions remain similar but with authentication checks
function handleRecordUpload(e) {
    e.preventDefault();
    
    if (!medicalRecords.isAuthenticated()) {
        showNotification('Please login to upload records', 'error');
        return;
    }
    
    const fileInput = document.getElementById('recordFile');
    const type = document.getElementById('recordType').value;
    const title = document.getElementById('recordTitle').value;
    const date = document.getElementById('recordDate').value;
    const doctor = document.getElementById('recordDoctor').value;
    const description = document.getElementById('recordDescription').value;

    if (!fileInput.files[0]) {
        showNotification('Please select a file to upload', 'error');
        return;
    }

    const file = fileInput.files[0];
    if (file.size > 10 * 1024 * 1024) {
        showNotification('File size must be less than 10MB', 'error');
        return;
    }

    const recordData = {
        type: type,
        title: title,
        date: date,
        doctor: doctor,
        description: description,
        file: file
    };

    medicalRecords.addRecord(recordData);
    showNotification('Medical record uploaded successfully!', 'success');
    closeAllModals();
    loadRecords();
    document.getElementById('uploadForm').reset();
}

function downloadHospitalReport(recordId) {
    const record = medicalRecords.hospitalRecords.find(r => r.id === recordId);
    if (record) {
        showNotification(`Downloading ${record.title}...`, 'info');
        // Simulate download
        setTimeout(() => {
            showNotification('Hospital report downloaded successfully!', 'success');
        }, 2000);
    }
}

// Utility functions
function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function getTypeDisplayName(type) {
    const names = {
        'lab': 'Lab Report',
        'prescription': 'Prescription',
        'scan': 'Scan/Image',
        'vaccination': 'Vaccination',
        'other': 'Other'
    };
    return names[type] || type;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showNotification(message, type = 'info') {
    // Use existing notification system
    alert(`${type.toUpperCase()}: ${message}`);
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Export functions
window.showLoginModal = showLoginModal;
window.showSignupModal = showSignupModal;
window.handleLogout = handleLogout;