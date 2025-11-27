const API_BASE = 'http://localhost:5000/api';

let currentProvider = null;
let currentDoctors = [];
let currentAppointments = [];

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const currentUser = localStorage.getItem('currentUser');
    
    console.log('Token:', token ? 'EXISTS' : 'MISSING');
    console.log('Current User:', currentUser);
    
    if (!token || !currentUser) {
        alert('No login session found. Redirecting to provider login...');
        window.location.href = '/provider-auth.html';
        return;
    }

    const user = JSON.parse(currentUser);
    console.log('User Role:', user.role);
    
    if (!['pharmacy', 'clinic', 'hospital'].includes(user.role)) {
        alert('You must be logged in as a provider (pharmacy, clinic, or hospital). Current role: ' + user.role);
        window.location.href = '/provider-auth.html';
        return;
    }

    await loadProviderData();
    await loadDoctors();
    await loadAppointments();
    await loadStats();
});

async function loadProviderData() {
    try {
        const response = await fetch(`${API_BASE}/my-provider`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load provider data');
        }

        currentProvider = await response.json();
        document.getElementById('providerName').textContent = currentProvider.name;
        document.getElementById('facilityInfo').textContent = 
            `${currentProvider.type.charAt(0).toUpperCase() + currentProvider.type.slice(1)} - ${currentProvider.name}`;

        displayProviderSettings();
    } catch (error) {
        console.error('Error loading provider data:', error);
        if (error.message.includes('404')) {
            alert('Provider profile not found. Please contact support.');
        }
    }
}

function displayProviderSettings() {
    const settingsDiv = document.getElementById('providerSettings');
    settingsDiv.innerHTML = `
        <div class="form-group">
            <label>Facility Name</label>
            <input type="text" value="${currentProvider.name}" readonly>
        </div>
        <div class="form-group">
            <label>Type</label>
            <input type="text" value="${currentProvider.type}" readonly>
        </div>
        <div class="form-group">
            <label>Registration Number</label>
            <input type="text" value="${currentProvider.registrationNumber}" readonly>
        </div>
        <div class="form-group">
            <label>Address</label>
            <textarea readonly>${currentProvider.address}</textarea>
        </div>
        <div class="form-group">
            <label>Phone</label>
            <input type="text" value="${currentProvider.phone}" readonly>
        </div>
        <div class="form-group">
            <label>Email</label>
            <input type="text" value="${currentProvider.email}" readonly>
        </div>
        <div class="form-group">
            <label>Facilities</label>
            <p>${currentProvider.facilities.join(', ')}</p>
        </div>
    `;
}

async function loadDoctors() {
    try {
        const response = await fetch(`${API_BASE}/my-doctors`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load doctors');
        }

        currentDoctors = await response.json();
        displayDoctors();
    } catch (error) {
        console.error('Error loading doctors:', error);
        document.getElementById('doctorsList').innerHTML = '<p>Failed to load doctors</p>';
    }
}

function displayDoctors() {
    const doctorsDiv = document.getElementById('doctorsList');
    
    if (currentDoctors.length === 0) {
        doctorsDiv.innerHTML = '<p>No doctors added yet. Click "Add Doctor" to get started.</p>';
        return;
    }

    doctorsDiv.innerHTML = currentDoctors.map(doctor => `
        <div class="doctor-card">
            <img src="${doctor.photo ? 'http://localhost:5000' + doctor.photo : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23e0e7ff%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2224%22 fill=%22%236366f1%22 text-anchor=%22middle%22 dy=%22.3em%22%3EDr.%3C/text%3E%3C/svg%3E'}" 
                 alt="${doctor.name}" 
                 class="doctor-photo"
                 onerror="this.style.backgroundColor='#e0e7ff'; this.style.color='#6366f1'; this.innerHTML='<div style=&quot;display:flex;align-items:center;justify-content:center;height:100%;font-size:24px;&quot;>Dr</div>'"
                 style="display: block; width: 100%; height: auto;">
            <div class="doctor-info">
                <h3>${doctor.name}</h3>
                <p><i class="fas fa-stethoscope"></i> ${doctor.specialty}</p>
                <p><i class="fas fa-graduation-cap"></i> ${doctor.qualification}</p>
                ${doctor.degrees && doctor.degrees.length > 0 ? `
                    <ul class="degrees-list">
                        ${doctor.degrees.map(d => `<li>${d.degree} - ${d.institution} (${d.year})</li>`).join('')}
                    </ul>
                ` : ''}
                <p><i class="fas fa-briefcase"></i> ${doctor.experience}</p>
                <p><i class="fas fa-rupee-sign"></i> ₹${doctor.consultationFee}</p>
                <p><i class="fas fa-clock"></i> ${doctor.slotsPerDay} slots/day</p>
                ${doctor.about ? `<p><small>${doctor.about}</small></p>` : ''}
            </div>
            <div class="doctor-actions">
                <button class="btn btn-primary" onclick="editDoctor('${doctor._id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger" onclick="deleteDoctor('${doctor._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

async function loadAppointments() {
    try {
        const date = document.getElementById('filterDate')?.value || '';
        const status = document.getElementById('filterStatus')?.value || '';

        let url = `${API_BASE}/provider-appointments?`;
        if (date) url += `date=${date}&`;
        if (status) url += `status=${status}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load appointments');
        }

        currentAppointments = await response.json();
        displayAppointments();
    } catch (error) {
        console.error('Error loading appointments:', error);
    }
}

function displayAppointments() {
    const tbody = document.getElementById('appointmentsTableBody');
    
    if (currentAppointments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align: center;">No appointments found</td></tr>';
        return;
    }

    tbody.innerHTML = currentAppointments.map(appt => {
        const balance = appt.consultationFee - appt.amountPaid;
        const paymentBadge = appt.paymentStatus === 'paid' ? 'badge-success' : 
                            appt.paymentStatus === 'partial' ? 'badge-warning' : 'badge-danger';
        const statusBadge = appt.status === 'confirmed' ? 'badge-success' :
                           appt.status === 'completed' ? 'badge-info' :
                           appt.status === 'cancelled' ? 'badge-danger' : 'badge-warning';

        return `
            <tr>
                <td><strong>#${appt.queueNumber}</strong></td>
                <td>${appt.patientName}</td>
                <td>${appt.patientPhone}</td>
                <td>${appt.doctorName}</td>
                <td>${appt.date}</td>
                <td>${appt.time}</td>
                <td>₹${appt.consultationFee}</td>
                <td>₹${appt.amountPaid}</td>
                <td>₹${balance}</td>
                <td><span class="badge ${statusBadge}">${appt.status}</span></td>
                <td>
                    <button class="btn btn-success" style="font-size: 0.8em; padding: 5px 10px;" 
                            onclick="openPaymentModal('${appt._id}', ${appt.consultationFee}, ${appt.amountPaid})">
                        <i class="fas fa-money-bill"></i> Payment
                    </button>
                    ${appt.status === 'pending' ? `
                        <button class="btn btn-primary" style="font-size: 0.8em; padding: 5px 10px; margin-top: 5px;" 
                                onclick="updateStatus('${appt._id}', 'confirmed')">
                            Confirm
                        </button>
                    ` : ''}
                    ${appt.status === 'confirmed' ? `
                        <button class="btn btn-info" style="font-size: 0.8em; padding: 5px 10px; margin-top: 5px;" 
                                onclick="updateStatus('${appt._id}', 'completed')">
                            Complete
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

async function loadStats() {
    const today = new Date().toISOString().split('T')[0];
    
    document.getElementById('totalDoctors').textContent = currentDoctors.length;
    
    const todayAppts = currentAppointments.filter(a => a.date === today);
    document.getElementById('todayAppointments').textContent = todayAppts.length;
    
    const pending = currentAppointments.filter(a => a.status === 'pending');
    document.getElementById('pendingAppointments').textContent = pending.length;
    
    const revenue = currentAppointments.reduce((sum, a) => sum + a.amountPaid, 0);
    document.getElementById('totalRevenue').textContent = `₹${revenue}`;

    const recentDiv = document.getElementById('recentAppointments');
    const recent = currentAppointments.slice(0, 5);
    
    if (recent.length === 0) {
        recentDiv.innerHTML = '<p>No recent appointments</p>';
    } else {
        recentDiv.innerHTML = `
            <table class="appointments-table">
                <thead>
                    <tr>
                        <th>Queue #</th>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${recent.map(a => `
                        <tr>
                            <td>#${a.queueNumber}</td>
                            <td>${a.patientName}</td>
                            <td>${a.doctorName}</td>
                            <td>${a.date}</td>
                            <td><span class="badge ${a.status === 'confirmed' ? 'badge-success' : 'badge-warning'}">${a.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

function openAddDoctorModal() {
    document.getElementById('modalTitle').textContent = 'Add New Doctor';
    document.getElementById('doctorForm').reset();
    document.getElementById('doctorId').value = '';
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('addDoctorModal').classList.add('active');
}

function closeModal() {
    document.getElementById('addDoctorModal').classList.remove('active');
}

function previewPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('photoPreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function addDegreeField() {
    const container = document.getElementById('degreesContainer');
    const degreeEntry = document.createElement('div');
    degreeEntry.className = 'degree-entry';
    degreeEntry.innerHTML = `
        <input type="text" placeholder="Degree (e.g., MBBS)" class="degree-name">
        <input type="text" placeholder="Institution" class="degree-institution">
        <input type="text" placeholder="Year" class="degree-year">
    `;
    container.appendChild(degreeEntry);
}

async function saveDoctor(event) {
    event.preventDefault();

    const doctorId = document.getElementById('doctorId').value;
    const formData = new FormData();

    const photoFile = document.getElementById('doctorPhoto').files[0];
    if (photoFile) {
        formData.append('photo', photoFile);
    }

    formData.append('name', document.getElementById('doctorName').value);
    formData.append('specialty', document.getElementById('doctorSpecialty').value);
    formData.append('qualification', document.getElementById('doctorQualification').value);
    formData.append('experience', document.getElementById('doctorExperience').value);
    formData.append('consultationFee', document.getElementById('doctorFee').value);
    formData.append('slotsPerDay', document.getElementById('slotsPerDay').value || 10);
    formData.append('about', document.getElementById('doctorAbout').value);

    const degrees = [];
    document.querySelectorAll('.degree-entry').forEach(entry => {
        const degree = entry.querySelector('.degree-name').value;
        const institution = entry.querySelector('.degree-institution').value;
        const year = entry.querySelector('.degree-year').value;
        
        if (degree || institution || year) {
            degrees.push({ degree, institution, year });
        }
    });
    formData.append('degrees', JSON.stringify(degrees));

    const visitingHours = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const daySlots = document.querySelectorAll('.day-slot');
    daySlots.forEach((slot, index) => {
        const startTime = slot.querySelector('.visit-start-time').value;
        const endTime = slot.querySelector('.visit-end-time').value;
        if (startTime && endTime) {
            visitingHours.push({ day: days[index], startTime, endTime });
        }
    });
    formData.append('visitingHours', JSON.stringify(visitingHours));

    try {
        const url = doctorId ? `${API_BASE}/doctors/${doctorId}` : `${API_BASE}/doctors`;
        const method = doctorId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to save doctor');
        }

        alert(doctorId ? 'Doctor updated successfully!' : 'Doctor added successfully!');
        closeModal();
        await loadDoctors();
        await loadStats();
    } catch (error) {
        console.error('Error saving doctor:', error);
        alert('Failed to save doctor. Please try again.');
    }
}

async function editDoctor(doctorId) {
    const doctor = currentDoctors.find(d => d._id === doctorId);
    if (!doctor) return;

    document.getElementById('modalTitle').textContent = 'Edit Doctor';
    document.getElementById('doctorId').value = doctor._id;
    document.getElementById('doctorName').value = doctor.name;
    document.getElementById('doctorSpecialty').value = doctor.specialty;
    document.getElementById('doctorQualification').value = doctor.qualification;
    document.getElementById('doctorExperience').value = doctor.experience;
    document.getElementById('doctorFee').value = doctor.consultationFee;
    document.getElementById('slotsPerDay').value = doctor.slotsPerDay;
    document.getElementById('doctorAbout').value = doctor.about || '';

    if (doctor.photo) {
        const preview = document.getElementById('photoPreview');
        preview.src = doctor.photo ? 'http://localhost:5000' + doctor.photo : '';
        preview.style.display = 'block';
    }

    const degreesContainer = document.getElementById('degreesContainer');
    degreesContainer.innerHTML = '';
    
    if (doctor.degrees && doctor.degrees.length > 0) {
        doctor.degrees.forEach(deg => {
            const degreeEntry = document.createElement('div');
            degreeEntry.className = 'degree-entry';
            degreeEntry.innerHTML = `
                <input type="text" placeholder="Degree" class="degree-name" value="${deg.degree || ''}">
                <input type="text" placeholder="Institution" class="degree-institution" value="${deg.institution || ''}">
                <input type="text" placeholder="Year" class="degree-year" value="${deg.year || ''}">
            `;
            degreesContainer.appendChild(degreeEntry);
        });
    } else {
        addDegreeField();
    }

    document.getElementById('addDoctorModal').classList.add('active');
}

async function deleteDoctor(doctorId) {
    if (!confirm('Are you sure you want to delete this doctor?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/doctors/${doctorId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete doctor');
        }

        alert('Doctor deleted successfully!');
        await loadDoctors();
        await loadStats();
    } catch (error) {
        console.error('Error deleting doctor:', error);
        alert('Failed to delete doctor. Please try again.');
    }
}

function openPaymentModal(appointmentId, totalFee, amountPaid) {
    document.getElementById('appointmentId').value = appointmentId;
    document.getElementById('totalFee').textContent = totalFee;
    document.getElementById('amountPaid').value = amountPaid;
    document.getElementById('paymentModal').classList.add('active');
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
}

async function updatePayment(event) {
    event.preventDefault();

    const appointmentId = document.getElementById('appointmentId').value;
    const amountPaid = document.getElementById('amountPaid').value;

    try {
        const response = await fetch(`${API_BASE}/appointments/${appointmentId}/payment`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ amountPaid: parseFloat(amountPaid) })
        });

        if (!response.ok) {
            throw new Error('Failed to update payment');
        }

        alert('Payment updated successfully!');
        closePaymentModal();
        await loadAppointments();
        await loadStats();
    } catch (error) {
        console.error('Error updating payment:', error);
        alert('Failed to update payment. Please try again.');
    }
}

async function updateStatus(appointmentId, status) {
    try {
        const response = await fetch(`${API_BASE}/appointments/${appointmentId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            throw new Error('Failed to update status');
        }

        alert('Appointment status updated successfully!');
        await loadAppointments();
        await loadStats();
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status. Please try again.');
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/provider-auth.html';
}