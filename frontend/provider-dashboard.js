const API_BASE = 'http://localhost:5000/api';

let currentProvider = null;
let currentDoctors = [];
let currentAppointments = [];
let appointmentViewFilter = 'today'; // 'today', 'past', 'future'

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
            <img src="${doctor.photo ? doctor.photo : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23e0e7ff%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2224%22 fill=%22%236366f1%22 text-anchor=%22middle%22 dy=%22.3em%22%3EDr.%3C/text%3E%3C/svg%3E'}" 
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
    // Get today's date in local timezone (YYYY-MM-DD format)
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    document.getElementById('totalDoctors').textContent = currentDoctors.length;
    
    const todayAppts = currentAppointments.filter(a => a.date === today);
    document.getElementById('todayAppointments').textContent = todayAppts.length;
    
    const pending = currentAppointments.filter(a => a.status === 'pending');
    document.getElementById('pendingAppointments').textContent = pending.length;
    
    const revenue = currentAppointments.reduce((sum, a) => sum + a.amountPaid, 0);
    document.getElementById('totalRevenue').textContent = `₹${revenue}`;

    displayFilteredAppointments();
}

function setAppointmentFilter(filter) {
    appointmentViewFilter = filter;
    
    // Update button styles
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');
    
    displayFilteredAppointments();
}

function displayFilteredAppointments() {
    const recentDiv = document.getElementById('recentAppointments');
    
    // Get today's date in local timezone (YYYY-MM-DD format)
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    // Filter appointments based on current filter
    let filteredAppointments = [];
    let sectionTitle = '';
    
    switch(appointmentViewFilter) {
        case 'today':
            filteredAppointments = currentAppointments.filter(a => a.date === today);
            sectionTitle = "Today's Queue";
            break;
        case 'past':
            filteredAppointments = currentAppointments.filter(a => a.date < today);
            sectionTitle = 'Past Appointments';
            break;
        case 'future':
            filteredAppointments = currentAppointments.filter(a => a.date > today);
            sectionTitle = 'Upcoming Appointments';
            break;
        default:
            filteredAppointments = currentAppointments.filter(a => a.date === today);
            sectionTitle = "Today's Queue";
    }
    
    // Count appointments for each filter
    const todayCount = currentAppointments.filter(a => a.date === today).length;
    const pastCount = currentAppointments.filter(a => a.date < today).length;
    const futureCount = currentAppointments.filter(a => a.date > today).length;
    
    // Generate filter buttons HTML
    let filterButtonsHtml = `
        <div class="appointment-filter-buttons" style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
            <button class="filter-btn ${appointmentViewFilter === 'today' ? 'active' : ''}" 
                    data-filter="today" onclick="setAppointmentFilter('today')"
                    style="padding: 10px 20px; border: 2px solid #2563eb; border-radius: 8px; background: ${appointmentViewFilter === 'today' ? '#2563eb' : 'white'}; color: ${appointmentViewFilter === 'today' ? 'white' : '#2563eb'}; cursor: pointer; font-weight: 500; transition: all 0.3s;">
                <i class="fas fa-calendar-day"></i> Today's Queue (${todayCount})
            </button>
            <button class="filter-btn ${appointmentViewFilter === 'past' ? 'active' : ''}" 
                    data-filter="past" onclick="setAppointmentFilter('past')"
                    style="padding: 10px 20px; border: 2px solid #6b7280; border-radius: 8px; background: ${appointmentViewFilter === 'past' ? '#6b7280' : 'white'}; color: ${appointmentViewFilter === 'past' ? 'white' : '#6b7280'}; cursor: pointer; font-weight: 500; transition: all 0.3s;">
                <i class="fas fa-history"></i> Past Appointments (${pastCount})
            </button>
            <button class="filter-btn ${appointmentViewFilter === 'future' ? 'active' : ''}" 
                    data-filter="future" onclick="setAppointmentFilter('future')"
                    style="padding: 10px 20px; border: 2px solid #10b981; border-radius: 8px; background: ${appointmentViewFilter === 'future' ? '#10b981' : 'white'}; color: ${appointmentViewFilter === 'future' ? 'white' : '#10b981'}; cursor: pointer; font-weight: 500; transition: all 0.3s;">
                <i class="fas fa-calendar-alt"></i> Future Appointments (${futureCount})
            </button>
        </div>
        <h3 style="margin-bottom: 15px; color: #333;">${sectionTitle}</h3>
    `;
    
    if (filteredAppointments.length === 0) {
        recentDiv.innerHTML = filterButtonsHtml + `
            <div style="text-align: center; padding: 40px; color: #6b7280;">
                <i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                <p style="font-size: 1.1em;">No ${appointmentViewFilter === 'today' ? "appointments for today" : appointmentViewFilter === 'past' ? "past appointments" : "upcoming appointments"}</p>
            </div>
        `;
        return;
    }
    
    // Group appointments by doctor
    const groupedByDoctor = {};
    filteredAppointments.forEach(appt => {
        if (!groupedByDoctor[appt.doctorName]) {
            groupedByDoctor[appt.doctorName] = [];
        }
        groupedByDoctor[appt.doctorName].push(appt);
    });

    // Sort appointments within each doctor group by queue number or time
    Object.keys(groupedByDoctor).forEach(doctorName => {
        groupedByDoctor[doctorName].sort((a, b) => {
            // Sort by date first, then by time
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return (a.time || '').localeCompare(b.time || '');
        });
    });

    // Generate HTML with doctor headers and doctor-specific queue numbers
    let html = filterButtonsHtml;
    Object.entries(groupedByDoctor).forEach(([doctorName, appointments]) => {
        html += `
            <div class="doctor-section" style="margin-bottom: 30px;">
                <div class="doctor-section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #2563eb;">
                    <h3 style="margin: 0; color: #2563eb; font-size: 1.2em;">
                        <i class="fas fa-user-md" style="margin-right: 8px;"></i>${doctorName}
                        <span style="font-size: 0.8em; color: #6b7280; margin-left: 10px;">(${appointments.length} patient${appointments.length > 1 ? 's' : ''})</span>
                    </h3>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-outline" onclick="viewDoctorPatients('${doctorName}')" 
                                style="padding: 8px 16px; font-size: 0.9em;">
                            <i class="fas fa-users"></i> View Patients
                        </button>
                        <button class="btn btn-danger" onclick="deleteDoctoAppointments('${doctorName}')" 
                                style="padding: 8px 16px; font-size: 0.9em; background: #ef4444; color: white;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <table class="appointments-table" style="margin-bottom: 20px;">
                    <thead>
                        <tr>
                            <th>Queue #</th>
                            <th>Patient</th>
                            <th>Time</th>
                            ${appointmentViewFilter !== 'today' ? '<th>Date</th>' : ''}
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${appointments.map((appt, index) => `
                            <tr>
                                <td><strong>#${index + 1}</strong></td>
                                <td>${appt.patientName}</td>
                                <td>${appt.time || 'N/A'}</td>
                                ${appointmentViewFilter !== 'today' ? `<td>${appt.date}</td>` : ''}
                                <td><span class="badge ${appt.status === 'confirmed' ? 'badge-success' : appt.status === 'completed' ? 'badge-info' : 'badge-warning'}">${appt.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    });
    
    recentDiv.innerHTML = html;
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
        preview.src = doctor.photo || '';
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

function viewDoctorPatients(doctorName) {
    // Filter appointments for this specific doctor
    const doctorAppointments = currentAppointments.filter(a => a.doctorName === doctorName);
    
    // Show an alert with patient count for this doctor
    alert(`Dr. ${doctorName} has ${doctorAppointments.length} total appointments.\n\nRecent patients:\n${
        doctorAppointments.slice(0, 5)
            .map((a, i) => `${i + 1}. ${a.patientName} - ${a.date} (${a.status})`)
            .join('\n')
    }`);
}

async function deleteDoctoAppointments(doctorName) {
    const doctorAppointments = currentAppointments.filter(a => a.doctorName === doctorName);
    
    if (!confirm(`Are you sure you want to delete all ${doctorAppointments.length} appointment(s) for Dr. ${doctorName}? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/appointments/doctor`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ doctorName: doctorName })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete appointments');
        }

        const result = await response.json();
        alert(`Successfully deleted ${result.deletedCount} appointment(s) for Dr. ${doctorName}`);
        
        // Reload the data to refresh the display
        await loadAppointments();
        await loadStats();
    } catch (error) {
        console.error('Error deleting appointments:', error);
        alert('Failed to delete appointments: ' + error.message);
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/provider-auth.html';
}

// Walk-in Patient Functions
function openWalkInModal() {
    const modal = document.getElementById('walkInModal');
    const form = document.getElementById('walkInForm');
    form.reset();
    
    // Hide any previous messages
    document.getElementById('walkInError').style.display = 'none';
    document.getElementById('walkInSuccess').style.display = 'none';
    document.getElementById('queueInfo').textContent = '';
    
    // Populate doctors dropdown
    const doctorSelect = document.getElementById('walkInDoctor');
    doctorSelect.innerHTML = '<option value="">-- Select a Doctor --</option>';
    currentDoctors.forEach(doctor => {
        doctorSelect.innerHTML += `<option value="${doctor._id}">${doctor.name} - ${doctor.specialty} (₹${doctor.consultationFee})</option>`;
    });
    
    // Set minimum date to today
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    document.getElementById('walkInDate').min = todayStr;
    document.getElementById('walkInDate').value = todayStr;
    
    // Reset time slot dropdown
    document.getElementById('walkInTimeSlot').innerHTML = '<option value="">-- Select date and doctor first --</option>';
    
    modal.classList.add('active');
    
    // Load time slots if doctor is already selected
    loadDoctorTimeSlots();
}

function closeWalkInModal() {
    document.getElementById('walkInModal').classList.remove('active');
}

async function loadDoctorTimeSlots() {
    const doctorId = document.getElementById('walkInDoctor').value;
    const date = document.getElementById('walkInDate').value;
    const timeSlotSelect = document.getElementById('walkInTimeSlot');
    const queueInfo = document.getElementById('queueInfo');
    
    if (!doctorId || !date) {
        timeSlotSelect.innerHTML = '<option value="">-- Select date and doctor first --</option>';
        queueInfo.textContent = '';
        return;
    }
    
    try {
        timeSlotSelect.innerHTML = '<option value="">Loading slots...</option>';
        
        const response = await fetch(`${API_BASE}/doctor-available-slots/${doctorId}?date=${date}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load time slots');
        }
        
        const data = await response.json();
        
        if (data.availableSlots.length === 0) {
            timeSlotSelect.innerHTML = '<option value="">No slots available on this day</option>';
            queueInfo.textContent = data.message || 'Doctor is not available on this day';
            return;
        }
        
        // Populate time slots with queue information
        timeSlotSelect.innerHTML = '<option value="">-- Select a time slot --</option>';
        data.availableSlots.forEach(slot => {
            const queueNum = slot.nextQueueNumber;
            timeSlotSelect.innerHTML += `<option value="${slot.time}" data-queue="${queueNum}">${slot.time} (Queue #${queueNum})</option>`;
        });
        
        queueInfo.textContent = `Doctor: ${data.doctorName}`;
        
        // Update queue info when time slot changes
        timeSlotSelect.onchange = function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption.dataset.queue) {
                queueInfo.textContent = `This patient will be Queue #${selectedOption.dataset.queue} for the selected time slot`;
            }
        };
        
    } catch (error) {
        console.error('Error loading time slots:', error);
        timeSlotSelect.innerHTML = '<option value="">Error loading slots</option>';
        queueInfo.textContent = 'Failed to load available slots. Please try again.';
    }
}

async function registerWalkInPatient(event) {
    event.preventDefault();
    
    const errorDiv = document.getElementById('walkInError');
    const successDiv = document.getElementById('walkInSuccess');
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    const patientName = document.getElementById('walkInPatientName').value.trim();
    const patientPhone = document.getElementById('walkInPatientPhone').value.trim();
    const doctorId = document.getElementById('walkInDoctor').value;
    const date = document.getElementById('walkInDate').value;
    const time = document.getElementById('walkInTimeSlot').value;
    const notes = document.getElementById('walkInNotes').value.trim();
    
    // Validate
    if (!patientName || !patientPhone || !doctorId || !date || !time) {
        errorDiv.textContent = 'Please fill in all required fields';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Validate phone number (10 digits)
    if (!/^\d{10}$/.test(patientPhone)) {
        errorDiv.textContent = 'Please enter a valid 10-digit phone number';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
        
        const response = await fetch(`${API_BASE}/provider-appointments/walk-in`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                doctorId,
                patientName,
                patientPhone,
                date,
                time,
                notes: notes || 'Walk-in patient'
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to register walk-in patient');
        }
        
        // Show success message
        successDiv.innerHTML = `
            <strong>Walk-in patient registered successfully!</strong><br>
            Patient: ${data.appointment.patientName}<br>
            Queue Number: <strong>#${data.appointment.queueNumber}</strong><br>
            Doctor: ${data.appointment.doctorName}<br>
            Time: ${data.appointment.time}
        `;
        successDiv.style.display = 'block';
        
        // Reset form for next patient
        document.getElementById('walkInPatientName').value = '';
        document.getElementById('walkInPatientPhone').value = '';
        document.getElementById('walkInNotes').value = '';
        
        // Refresh time slots to get updated queue numbers
        await loadDoctorTimeSlots();
        
        // Reload appointments in the background
        await loadAppointments();
        await loadStats();
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Register Walk-in Patient';
        
        // Auto-close after 3 seconds if successful
        setTimeout(() => {
            if (successDiv.style.display === 'block') {
                closeWalkInModal();
            }
        }, 3000);
        
    } catch (error) {
        console.error('Error registering walk-in patient:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Register Walk-in Patient';
    }
}