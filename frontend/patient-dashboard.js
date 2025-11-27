// Patient Dashboard JavaScript
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890'
};

// Initialize Patient Dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializePatientDashboard();
    loadPatientData();
});

function initializePatientDashboard() {
    // Set user info
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('greetingName').textContent = currentUser.name.split(' ')[0];

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            switchSection(section);
            
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Menu toggle
    document.getElementById('menuToggle').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('active');
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        }
    });

    // Modal controls
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter') || this.getAttribute('data-type');
            const section = document.querySelector('.dashboard-section.active').id.replace('-section', '');
            
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            filterData(section, filter);
        });
    });
}

function switchSection(section) {
    document.querySelectorAll('.dashboard-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`${section}-section`).classList.add('active');
    loadSectionData(section);
}

function loadPatientData() {
    loadOverviewData();
    loadAppointments();
    loadMedicalRecords();
}

function loadOverviewData() {
    // Update stats
    document.getElementById('upcomingAppointments').textContent = '3';
    document.getElementById('pendingPrescriptions').textContent = '2';
    document.getElementById('medicalRecords').textContent = '5';
    document.getElementById('healthScore').textContent = '85%';

    // Load upcoming appointments
    const upcomingAppointments = [
        {
            doctor: 'Dr. Sarah Wilson',
            date: '2023-10-25',
            time: '10:00 AM',
            status: 'confirmed'
        },
        {
            doctor: 'Dr. Raj Sharma',
            date: '2023-10-28',
            time: '02:30 PM',
            status: 'confirmed'
        }
    ];

    const container = document.getElementById('upcomingAppointmentsList');
    container.innerHTML = '';

    upcomingAppointments.forEach(apt => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${apt.doctor}</td>
            <td>${apt.date} at ${apt.time}</td>
            <td><span class="status-badge status-${apt.status}">${apt.status}</span></td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewAppointmentDetails('${apt.doctor}')">View</button>
            </td>
        `;
        container.appendChild(row);
    });

    // Load recent records
    const recentRecords = [
        {
            type: 'Lab Report',
            date: '2023-10-20',
            doctor: 'Dr. Sarah Wilson'
        },
        {
            type: 'Prescription',
            date: '2023-10-15',
            doctor: 'Dr. Raj Sharma'
        }
    ];

    const recordsContainer = document.getElementById('recentRecordsList');
    recordsContainer.innerHTML = '';

    recentRecords.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.type}</td>
            <td>${record.date}</td>
            <td>${record.doctor}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewRecord('${record.type}')">View</button>
            </td>
        `;
        recordsContainer.appendChild(row);
    });
}

function loadAppointments() {
    const appointments = [
        {
            doctor: 'Dr. Sarah Wilson',
            date: '2023-10-25',
            time: '10:00 AM',
            type: 'Consultation',
            status: 'confirmed',
            amount: '₹800'
        },
        {
            doctor: 'Dr. Raj Sharma',
            date: '2023-10-20',
            time: '11:30 AM',
            type: 'Follow-up',
            status: 'completed',
            amount: '₹600'
        },
        {
            doctor: 'Dr. Priya Mehta',
            date: '2023-11-05',
            time: '03:00 PM',
            type: 'Checkup',
            status: 'pending',
            amount: '₹700'
        }
    ];

    const container = document.getElementById('appointmentsList');
    container.innerHTML = '';

    appointments.forEach(apt => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${apt.doctor}</td>
            <td>${apt.date} at ${apt.time}</td>
            <td>${apt.type}</td>
            <td><span class="status-badge status-${apt.status}">${apt.status}</span></td>
            <td>${apt.amount}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="viewAppointmentDetails('${apt.doctor}')">View</button>
                    ${apt.status === 'pending' ? 
                        `<button class="btn btn-outline btn-sm" onclick="cancelAppointment('${apt.doctor}')">Cancel</button>` : 
                        ''
                    }
                </div>
            </td>
        `;
        container.appendChild(row);
    });
}

function loadMedicalRecords() {
    const medicalRecords = [
        {
            type: 'Lab Report',
            title: 'Blood Test Results',
            date: '2023-10-20',
            doctor: 'Dr. Sarah Wilson',
            file: 'blood_test.pdf'
        },
        {
            type: 'Prescription',
            title: 'Medication Prescription',
            date: '2023-10-15',
            doctor: 'Dr. Raj Sharma',
            file: 'prescription.pdf'
        },
        {
            type: 'Scan',
            title: 'X-Ray Chest',
            date: '2023-10-10',
            doctor: 'Dr. Priya Mehta',
            file: 'xray_chest.jpg'
        }
    ];

    const container = document.getElementById('medicalRecordsList');
    container.innerHTML = '';

    medicalRecords.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.type}</td>
            <td>${record.title}</td>
            <td>${record.date}</td>
            <td>${record.doctor}</td>
            <td>${record.file}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="viewRecord('${record.title}')">View</button>
                    <button class="btn btn-outline btn-sm" onclick="downloadRecord('${record.file}')">Download</button>
                </div>
            </td>
        `;
        container.appendChild(row);
    });
}

function showUploadRecordModal() {
    document.getElementById('uploadRecordModal').style.display = 'flex';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function viewAppointmentDetails(doctorName) {
    alert(`Viewing appointment details with ${doctorName}`);
    // Implement detailed view
}

function cancelAppointment(doctorName) {
    if (confirm(`Are you sure you want to cancel appointment with ${doctorName}?`)) {
        alert(`Appointment with ${doctorName} cancelled`);
        // Implement cancellation logic
    }
}

function viewRecord(recordTitle) {
    alert(`Viewing record: ${recordTitle}`);
    // Implement record viewer
}

function downloadRecord(fileName) {
    alert(`Downloading file: ${fileName}`);
    // Implement download logic
}

function findDoctors() {
    window.location.href = 'index.html';
}

function filterData(section, filter) {
    // Implement filtering based on section and filter
    console.log(`Filtering ${section} with: ${filter}`);
}