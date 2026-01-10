const API_BASE = 'http://localhost:5000/api';

let currentUser = null;
let allAppointments = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    setupEventListeners();
    loadAppointments();
});

function initDashboard() {
    const user = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');

    if (!user || !token) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = JSON.parse(user);

    if (currentUser.role !== 'patient') {
        window.location.href = 'dashboard.html';
        return;
    }

    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('greetingName').textContent = currentUser.name.split(' ')[0];
}

function setupEventListeners() {
    document.getElementById('menuBtn')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });

    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        }
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderAppointments();
        });
    });
}

async function loadAppointments() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('currentUser'));

        const res = await fetch(`${API_BASE}/my-appointments`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to load appointments');
        }
        
        allAppointments = await res.json();
        renderAppointments();
    } catch (err) {
        console.error('Load error:', err);
        showError('Failed to load appointments: ' + err.message);
    }
}

function renderAppointments() {
    const container = document.getElementById('container');

    let filtered = allAppointments;

    if (currentFilter === 'upcoming') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = allAppointments.filter(a => {
            const aptDate = new Date(a.date);
            return aptDate >= today && ['confirmed', 'pending'].includes(a.status);
        });
    } else if (currentFilter === 'completed') {
        filtered = allAppointments.filter(a => a.status === 'completed');
    } else if (currentFilter === 'cancelled') {
        filtered = allAppointments.filter(a => a.status === 'cancelled');
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty">
                <div class="empty-icon">
                    <i class="fas fa-calendar-times"></i>
                </div>
                <div class="empty-title">No ${currentFilter !== 'all' ? currentFilter + ' ' : ''}Appointments</div>
                <div class="empty-desc">You don't have any appointments yet. Book one now!</div>
                <a href="index.html" class="btn-book">
                    <i class="fas fa-plus"></i> Book Appointment
                </a>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(apt => createCard(apt)).join('');
}

function createCard(apt) {
    const date = new Date(apt.date);
    const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const provider = apt.providerId || {};
    const balance = Math.max(0, apt.consultationFee - (apt.amountPaid || 0));
    const paid = apt.amountPaid || 0;
    const statusClass = `badge-${apt.status}`;
    const paymentStatus = getPaymentStatus(apt.paymentStatus);

    return `
        <div class="appointment">
            <div class="apt-header">
                <div class="apt-header-left">
                    <h3>${apt.doctorName || 'Dr. Unknown'}</h3>
                    <div class="apt-provider">
                        <i class="fas fa-hospital"></i>
                        ${apt.providerName || 'Provider'}
                    </div>
                </div>
                <div class="badge ${statusClass}">${apt.status || 'pending'}</div>
            </div>

            <div class="apt-body">
                <!-- Appointment Details -->
                <div class="apt-section">
                    <div class="section-title">Appointment Details</div>
                    <div class="info-row">
                        <span class="info-label">📅 Date & Time</span>
                        <span class="info-value">${dateStr} at ${apt.time || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">🔢 Queue Number</span>
                        <span class="info-value primary">#${apt.queueNumber || 'N/A'}</span>
                    </div>
                </div>

                <div class="apt-divider"></div>

                <!-- Provider Details -->
                <div class="apt-section">
                    <div class="section-title">Provider Information</div>
                    <div class="info-row">
                        <span class="info-label">📍 Address</span>
                        <span class="info-value">${provider.address || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">📞 Contact</span>
                        <span class="info-value">${provider.phone || 'N/A'}</span>
                    </div>
                </div>

                <div class="apt-divider"></div>

                <!-- Fees Section -->
                <div class="apt-section">
                    <div class="section-title">Payment Information</div>
                    <div class="fees-section">
                        <div class="fee-item">
                            <span class="fee-label">Consultation Fee</span>
                            <span class="fee-amount">₹${apt.consultationFee || '0'}</span>
                        </div>
                        <div class="fee-item">
                            <span class="fee-label">Amount Paid</span>
                            <span class="fee-amount success">₹${paid}</span>
                        </div>
                        <div class="fee-item">
                            <span class="fee-label">Balance Due</span>
                            <span class="fee-amount ${balance > 0 ? 'danger' : 'success'}">₹${balance}</span>
                        </div>
                        <div class="fee-item total">
                            <span class="fee-label">Payment Status</span>
                            <span class="fee-amount ${paymentStatus.class}">${paymentStatus.label}</span>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="apt-buttons">
                    ${apt.status === 'pending' ? `
                        <button class="btn btn-outline" onclick="cancelApt('${apt._id}')">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    ` : ''}
                    <button class="btn btn-primary" onclick="viewDetails('${apt._id}')">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
            </div>
        </div>
    `;
}

function getPaymentStatus(status) {
    const statuses = {
        paid: { label: '✓ Paid', class: 'success' },
        partial: { label: '⚠ Partial', class: 'warning' },
        unpaid: { label: '✕ Unpaid', class: 'danger' }
    };
    return statuses[status] || statuses.unpaid;
}

function viewDetails(id) {
    const apt = allAppointments.find(a => a._id === id);
    if (!apt) return;
    const date = new Date(apt.date).toLocaleDateString();
    alert(`Doctor: ${apt.doctorName}\nProvider: ${apt.providerName}\nDate: ${date}\nTime: ${apt.time}\nQueue: #${apt.queueNumber}\nFee: ₹${apt.consultationFee}\nStatus: ${apt.status}`);
}

function cancelApt(id) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/appointments/${id}/cancel`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(r => r.json())
    .then(data => {
        alert('Appointment cancelled successfully');
        loadAppointments();
    })
    .catch(err => {
        console.error('Cancel error:', err);
        alert('Error cancelling appointment: ' + err.message);
    });
}

function showError(msg) {
    document.getElementById('container').innerHTML = `
        <div class="empty">
            <div class="empty-icon"><i class="fas fa-exclamation-circle"></i></div>
            <div class="empty-title">Error</div>
            <div class="empty-desc">${msg}</div>
            <button class="btn-book" onclick="location.reload()" style="cursor: pointer; border: none;">
                <i class="fas fa-redo"></i> Retry
            </button>
        </div>
    `;
}