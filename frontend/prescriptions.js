// Prescription Management System
class PrescriptionSystem {
    constructor() {
        this.prescriptions = JSON.parse(localStorage.getItem('prescriptions')) || [];
        this.medications = [
            'Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Omeprazole', 'Atorvastatin',
            'Metformin', 'Losartan', 'Levothyroxine', 'Albuterol', 'Sertraline',
            'Aspirin', 'Lisinopril', 'Simvastatin', 'Metoprolol', 'Amlodipine'
        ];
    }

    createPrescription(prescriptionData) {
        const prescription = {
            id: this.generateId(),
            ...prescriptionData,
            createdAt: new Date().toISOString(),
            status: 'active',
            doctor: this.getCurrentDoctor()
        };
        
        this.prescriptions.unshift(prescription);
        this.saveToStorage();
        return prescription;
    }

    getAllPrescriptions() {
        return this.prescriptions;
    }

    getPrescriptionsByStatus(status) {
        return this.prescriptions.filter(p => p.status === status);
    }

    searchPrescriptions(query) {
        return this.prescriptions.filter(p => 
            p.patientName.toLowerCase().includes(query.toLowerCase()) ||
            p.diagnosis.toLowerCase().includes(query.toLowerCase()) ||
            p.id.toLowerCase().includes(query.toLowerCase())
        );
    }

    updatePrescriptionStatus(prescriptionId, status) {
        const prescription = this.prescriptions.find(p => p.id === prescriptionId);
        if (prescription) {
            prescription.status = status;
            prescription.updatedAt = new Date().toISOString();
            this.saveToStorage();
        }
    }

    deletePrescription(prescriptionId) {
        this.prescriptions = this.prescriptions.filter(p => p.id !== prescriptionId);
        this.saveToStorage();
    }

    getCurrentDoctor() {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        return user ? user.name : 'Dr. Unknown';
    }

    generateId() {
        const date = new Date();
        const timestamp = date.getTime();
        const random = Math.random().toString(36).substr(2, 5).toUpperCase();
        return `RX${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${random}`;
    }

    saveToStorage() {
        localStorage.setItem('prescriptions', JSON.stringify(this.prescriptions));
    }
}

const prescriptionSystem = new PrescriptionSystem();

// Initialize Prescriptions Page
document.addEventListener('DOMContentLoaded', function() {
    loadPrescriptions();
    setupEventListeners();
    addMedicationRow(); // Add initial medication row
});

function setupEventListeners() {
    // Prescription form submission
    document.getElementById('prescriptionForm').addEventListener('submit', handlePrescriptionSubmit);
    
    // Search functionality
    document.getElementById('searchPrescriptions').addEventListener('input', function() {
        if (this.value.length === 0) {
            loadPrescriptions();
        }
    });
    
    // Modal controls
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
}

function loadPrescriptions() {
    const statusFilter = document.getElementById('filterStatus').value;
    const sortBy = document.getElementById('sortPrescriptions').value;
    
    let prescriptions = [];
    if (statusFilter === 'all') {
        prescriptions = prescriptionSystem.getAllPrescriptions();
    } else {
        prescriptions = prescriptionSystem.getPrescriptionsByStatus(statusFilter);
    }

    // Sort prescriptions
    prescriptions.sort((a, b) => {
        switch(sortBy) {
            case 'oldest':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'patient':
                return a.patientName.localeCompare(b.patientName);
            default: // newest
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });

    displayPrescriptions(prescriptions);
    updateStats();
}

function displayPrescriptions(prescriptions) {
    const container = document.getElementById('prescriptionsList');
    
    if (prescriptions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-prescription"></i>
                <h3>No prescriptions found</h3>
                <p>Create your first prescription to get started</p>
                <button class="btn btn-primary" onclick="showNewPrescriptionModal()">
                    <i class="fas fa-plus"></i> Create Prescription
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = prescriptions.map(prescription => `
        <div class="prescription-card">
            <div class="prescription-header">
                <div class="patient-info">
                    <h3>${prescription.patientName}</h3>
                    <div class="patient-meta">
                        ${prescription.patientAge} years • ${prescription.patientGender}
                        ${prescription.patientContact ? ` • ${prescription.patientContact}` : ''}
                    </div>
                </div>
                <div class="prescription-meta">
                    <div class="prescription-id">${prescription.id}</div>
                    <div class="prescription-date">${formatDate(prescription.createdAt)}</div>
                    <div class="status-badge status-${prescription.status}">${prescription.status}</div>
                </div>
            </div>

            <div class="diagnosis-section">
                <strong>Diagnosis:</strong> ${prescription.diagnosis}
                ${prescription.symptoms ? `<br><strong>Symptoms:</strong> ${prescription.symptoms}` : ''}
            </div>

            <div class="medications-section">
                <strong>Medications:</strong>
                ${prescription.medications.map(med => `
                    <div class="medication-item">
                        <div class="medication-name">${med.name}</div>
                        <div class="medication-details">
                            <div class="medication-detail">
                                <span>Dosage:</span> ${med.dosage}
                            </div>
                            <div class="medication-detail">
                                <span>Frequency:</span> ${med.frequency}
                            </div>
                            <div class="medication-detail">
                                <span>Duration:</span> ${med.duration}
                            </div>
                            ${med.instructions ? `
                            <div class="medication-detail">
                                <span>Instructions:</span> ${med.instructions}
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>

            ${prescription.instructions ? `
            <div class="instructions-section">
                <strong>Additional Instructions:</strong>
                <p>${prescription.instructions}</p>
            </div>
            ` : ''}

            ${prescription.nextVisit ? `
            <div class="next-visit">
                <strong>Next Visit:</strong> ${formatDate(prescription.nextVisit)}
            </div>
            ` : ''}

            <div class="prescription-actions">
                <button class="btn btn-primary btn-sm" onclick="viewPrescription('${prescription.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-outline btn-sm" onclick="printPrescription('${prescription.id}')">
                    <i class="fas fa-print"></i> Print
                </button>
                <button class="btn btn-outline btn-sm" onclick="updatePrescriptionStatus('${prescription.id}', 'completed')">
                    <i class="fas fa-check"></i> Mark Complete
                </button>
                <button class="btn btn-danger btn-sm" onclick="deletePrescription('${prescription.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    const prescriptions = prescriptionSystem.getAllPrescriptions();
    const active = prescriptionSystem.getPrescriptionsByStatus('active').length;
    const today = new Date().toDateString();
    const todayPrescriptions = prescriptions.filter(p => 
        new Date(p.createdAt).toDateString() === today
    ).length;
    
    const uniquePatients = [...new Set(prescriptions.map(p => p.patientName))].length;

    document.getElementById('totalPrescriptions').textContent = prescriptions.length;
    document.getElementById('activePrescriptions').textContent = active;
    document.getElementById('todayPrescriptions').textContent = todayPrescriptions;
    document.getElementById('patientsCount').textContent = uniquePatients;
}

function addMedicationRow() {
    const container = document.getElementById('medicationsContainer');
    const row = document.createElement('div');
    row.className = 'medication-form-row';
    row.innerHTML = `
        <input type="text" class="form-control medication-name" placeholder="Medication name" required>
        <input type="text" class="form-control medication-dosage" placeholder="Dosage" required>
        <input type="text" class="form-control medication-frequency" placeholder="Frequency" required>
        <input type="text" class="form-control medication-duration" placeholder="Duration" required>
        <input type="text" class="form-control medication-instructions" placeholder="Instructions">
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(row);
    
    // Add autocomplete to new medication name field
    const nameInput = row.querySelector('.medication-name');
    setupMedicationAutocomplete(nameInput);
}

function setupMedicationAutocomplete(input) {
    input.addEventListener('input', function() {
        const value = this.value.toLowerCase();
        const suggestions = prescriptionSystem.medications.filter(med => 
            med.toLowerCase().includes(value)
        );
        
        showMedicationSuggestions(this, suggestions);
    });
}

function showMedicationSuggestions(input, suggestions) {
    // Remove existing suggestions
    const existingList = input.parentNode.querySelector('.suggestions-list');
    if (existingList) {
        existingList.remove();
    }

    if (suggestions.length === 0) return;

    const suggestionsList = document.createElement('ul');
    suggestionsList.className = 'suggestions-list';
    
    suggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion;
        li.addEventListener('click', function() {
            input.value = suggestion;
            suggestionsList.remove();
        });
        suggestionsList.appendChild(li);
    });

    input.parentNode.appendChild(suggestionsList);
}

function handlePrescriptionSubmit(e) {
    e.preventDefault();
    
    // Collect medications
    const medications = [];
    document.querySelectorAll('.medication-form-row').forEach(row => {
        const name = row.querySelector('.medication-name').value;
        const dosage = row.querySelector('.medication-dosage').value;
        const frequency = row.querySelector('.medication-frequency').value;
        const duration = row.querySelector('.medication-duration').value;
        const instructions = row.querySelector('.medication-instructions').value;
        
        if (name && dosage && frequency && duration) {
            medications.push({
                name,
                dosage,
                frequency,
                duration,
                instructions
            });
        }
    });

    if (medications.length === 0) {
        alert('Please add at least one medication');
        return;
    }

    const prescriptionData = {
        patientName: document.getElementById('patientName').value,
        patientAge: document.getElementById('patientAge').value,
        patientGender: document.getElementById('patientGender').value,
        patientContact: document.getElementById('patientContact').value,
        diagnosis: document.getElementById('diagnosis').value,
        symptoms: document.getElementById('symptoms').value,
        medications: medications,
        instructions: document.getElementById('instructions').value,
        nextVisit: document.getElementById('nextVisit').value
    };

    // Create prescription
    const newPrescription = prescriptionSystem.createPrescription(prescriptionData);
    
    // Show success message
    showNotification('Prescription created successfully!', 'success');
    closeAllModals();
    
    // Reload prescriptions
    loadPrescriptions();
    
    // Reset form
    document.getElementById('prescriptionForm').reset();
    document.getElementById('medicationsContainer').innerHTML = '';
    addMedicationRow(); // Add one empty row
}

function viewPrescription(prescriptionId) {
    const prescription = prescriptionSystem.getAllPrescriptions().find(p => p.id === prescriptionId);
    if (prescription) {
        showPrescriptionViewer(prescription);
    }
}

function showPrescriptionViewer(prescription) {
    const content = document.getElementById('prescriptionViewerContent');
    content.innerHTML = `
        <div class="prescription-details">
            <div class="detail-section">
                <h4>Patient Information</h4>
                <p><strong>Name:</strong> ${prescription.patientName}</p>
                <p><strong>Age:</strong> ${prescription.patientAge} years</p>
                <p><strong>Gender:</strong> ${prescription.patientGender}</p>
                ${prescription.patientContact ? `<p><strong>Contact:</strong> ${prescription.patientContact}</p>` : ''}
            </div>

            <div class="detail-section">
                <h4>Medical Information</h4>
                <p><strong>Diagnosis:</strong> ${prescription.diagnosis}</p>
                ${prescription.symptoms ? `<p><strong>Symptoms:</strong> ${prescription.symptoms}</p>` : ''}
            </div>

            <div class="detail-section">
                <h4>Medications</h4>
                ${prescription.medications.map(med => `
                    <div class="medication-detail">
                        <strong>${med.name}</strong>
                        <div class="medication-info">
                            <span>Dosage: ${med.dosage}</span>
                            <span>Frequency: ${med.frequency}</span>
                            <span>Duration: ${med.duration}</span>
                            ${med.instructions ? `<span>Instructions: ${med.instructions}</span>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>

            ${prescription.instructions ? `
            <div class="detail-section">
                <h4>Additional Instructions</h4>
                <p>${prescription.instructions}</p>
            </div>
            ` : ''}

            <div class="detail-section">
                <h4>Prescription Details</h4>
                <p><strong>Prescription ID:</strong> ${prescription.id}</p>
                <p><strong>Date:</strong> ${formatDate(prescription.createdAt)}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${prescription.status}">${prescription.status}</span></p>
                <p><strong>Prescribing Doctor:</strong> ${prescription.doctor}</p>
                ${prescription.nextVisit ? `<p><strong>Next Visit:</strong> ${formatDate(prescription.nextVisit)}</p>` : ''}
            </div>
        </div>

        <div class="modal-actions" style="margin-top: 20px; text-align: center;">
            <button class="btn btn-primary" onclick="printPrescription('${prescription.id}')">
                <i class="fas fa-print"></i> Print Prescription
            </button>
            <button class="btn btn-outline" onclick="closeAllModals()">Close</button>
        </div>
    `;
    
    document.getElementById('prescriptionViewerModal').style.display = 'flex';
}

function printPrescription(prescriptionId) {
    const prescription = prescriptionSystem.getAllPrescriptions().find(p => p.id === prescriptionId);
    if (prescription) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Prescription ${prescription.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                        .section { margin-bottom: 20px; }
                        .medication { border: 1px solid #ccc; padding: 10px; margin: 10px 0; background: #f9f9f9; }
                        .footer { margin-top: 40px; text-align: right; border-top: 1px solid #ccc; padding-top: 20px; }
                        @media print { body { margin: 20px; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>MEDICAL PRESCRIPTION</h1>
                        <p><strong>Date:</strong> ${formatDate(prescription.createdAt)}</p>
                    </div>
                    
                    <div class="section">
                        <h3>Patient Information</h3>
                        <p><strong>Name:</strong> ${prescription.patientName}</p>
                        <p><strong>Age:</strong> ${prescription.patientAge} years</p>
                        <p><strong>Gender:</strong> ${prescription.patientGender}</p>
                    </div>
                    
                    <div class="section">
                        <h3>Diagnosis</h3>
                        <p>${prescription.diagnosis}</p>
                    </div>
                    
                    <div class="section">
                        <h3>Medications</h3>
                        ${prescription.medications.map(med => `
                            <div class="medication">
                                <strong>${med.name}</strong><br>
                                <strong>Dosage:</strong> ${med.dosage}<br>
                                <strong>Frequency:</strong> ${med.frequency}<br>
                                <strong>Duration:</strong> ${med.duration}
                                ${med.instructions ? `<br><strong>Instructions:</strong> ${med.instructions}` : ''}
                            </div>
                        `).join('')}
                    </div>
                    
                    ${prescription.instructions ? `
                    <div class="section">
                        <h3>Additional Instructions</h3>
                        <p>${prescription.instructions}</p>
                    </div>
                    ` : ''}
                    
                    <div class="footer">
                        <p><strong>Prescribing Doctor:</strong> ${prescription.doctor}</p>
                        <p><strong>Signature:</strong> _________________________</p>
                        ${prescription.nextVisit ? `<p><strong>Next Visit:</strong> ${formatDate(prescription.nextVisit)}</p>` : ''}
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

function updatePrescriptionStatus(prescriptionId, status) {
    prescriptionSystem.updatePrescriptionStatus(prescriptionId, status);
    showNotification(`Prescription marked as ${status}`, 'success');
    loadPrescriptions();
}

function deletePrescription(prescriptionId) {
    if (confirm('Are you sure you want to delete this prescription? This action cannot be undone.')) {
        prescriptionSystem.deletePrescription(prescriptionId);
        showNotification('Prescription deleted successfully', 'success');
        loadPrescriptions();
    }
}

function searchPrescriptions() {
    const query = document.getElementById('searchPrescriptions').value;
    if (query.trim() === '') {
        loadPrescriptions();
        return;
    }
    
    const results = prescriptionSystem.searchPrescriptions(query);
    displayPrescriptions(results);
}

function showNewPrescriptionModal() {
    document.getElementById('newPrescriptionModal').style.display = 'flex';
    // Set today's date as default for next visit
    const nextVisit = new Date();
    nextVisit.setDate(nextVisit.getDate() + 7); // Default to 1 week from today
    document.getElementById('nextVisit').value = nextVisit.toISOString().split('T')[0];
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Utility functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showNotification(message, type = 'info') {
    alert(message);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}