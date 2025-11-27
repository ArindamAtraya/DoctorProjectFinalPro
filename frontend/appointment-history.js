const API_BASE = 'http://localhost:5000/api';
let allAppointments = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', async function() {
    await loadAppointments();
    await loadStats();
});

async function loadAppointments() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        const response = await fetch(`${API_BASE}/patient-appointments`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to load appointments');

        allAppointments = await response.json();
        displayAppointments();
    } catch (error) {
        console.error('Load appointments error:', error);
        showNotification('Failed to load appointments', 'error');
    }
}

async function loadStats() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/appointment-stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to load stats');

        const stats = await response.json();
        document.getElementById('statTotal').textContent = stats.total;
        document.getElementById('statUpcoming').textContent = stats.upcoming;
        document.getElementById('statCompleted').textContent = stats.completed;
        document.getElementById('statCancelled').textContent = stats.cancelled;
    } catch (error) {
        console.error('Load stats error:', error);
    }
}

function displayAppointments() {
    const container = document.getElementById('appointmentsList');
    
    let filtered = allAppointments;
    if (currentFilter === 'upcoming') {
        filtered = allAppointments.filter(apt => apt.status === 'pending' || apt.status === 'confirmed');
    } else if (currentFilter === 'completed') {
        filtered = allAppointments.filter(apt => apt.status === 'completed');
    } else if (currentFilter === 'cancelled') {
        filtered = allAppointments.filter(apt => apt.status === 'cancelled');
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No appointments found</h3>
                <p>No appointments match your filters. <a href="dashboard.html" style="color: var(--primary); text-decoration: underline;">Book an appointment!</a></p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(apt => `
        <div class="appointment-card ${getStatusClass(apt.status)}">
            <div class="card-header">
                <h3 class="card-title">Dr. ${apt.doctorName}</h3>
                <span class="status-badge status-${apt.status}">${apt.status}</span>
            </div>

            <div class="card-info">
                <div class="info-item">
                    <div class="info-icon"><i class="fas fa-hospital-alt"></i></div>
                    <div class="info-content">
                        <div class="info-label">Hospital/Clinic</div>
                        <div class="info-value">${apt.providerName}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon"><i class="fas fa-calendar"></i></div>
                    <div class="info-content">
                        <div class="info-label">Date</div>
                        <div class="info-value">${formatDate(apt.date)}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon"><i class="fas fa-clock"></i></div>
                    <div class="info-content">
                        <div class="info-label">Time</div>
                        <div class="info-value">${formatTime(apt.time)}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon"><i class="fas fa-queue"></i></div>
                    <div class="info-content">
                        <div class="info-label">Queue Position</div>
                        <div class="info-value">#${apt.queueNumber}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon"><i class="fas fa-rupee-sign"></i></div>
                    <div class="info-content">
                        <div class="info-label">Consultation Fee</div>
                        <div class="info-value">₹${apt.consultationFee}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-icon"><i class="fas fa-credit-card"></i></div>
                    <div class="info-content">
                        <div class="info-label">Payment</div>
                        <div class="info-value">${apt.paymentStatus}</div>
                    </div>
                </div>
            </div>

            <div class="card-actions">
                ${apt.status === 'pending' || apt.status === 'confirmed' ? `
                    <button class="action-btn action-btn-reschedule" onclick="rescheduleAppointment('${apt._id}')">
                        <i class="fas fa-calendar-edit"></i> Reschedule
                    </button>
                    <button class="action-btn action-btn-cancel" onclick="cancelAppointment('${apt._id}')">
                        <i class="fas fa-times-circle"></i> Cancel
                    </button>
                ` : ''}
                ${apt.notes ? `
                    <button class="action-btn action-btn-notes" onclick="viewNotes('${apt._id}')">
                        <i class="fas fa-notes-medical"></i> View Notes
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function filterAppointments(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    displayAppointments();
}

function getStatusClass(status) {
    if (status === 'pending' || status === 'confirmed') return 'upcoming';
    if (status === 'completed') return 'completed';
    if (status === 'cancelled') return 'cancelled';
    return 'upcoming';
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

async function rescheduleAppointment(appointmentId) {
    const newDate = prompt('Enter new date (YYYY-MM-DD):');
    if (!newDate) return;
    
    const newTime = prompt('Enter new time (HH:MM):');
    if (!newTime) return;

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/appointments/${appointmentId}/reschedule`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ newDate, newTime })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }

        showNotification('Appointment rescheduled successfully!', 'success');
        await loadAppointments();
        await loadStats();
    } catch (error) {
        console.error('Reschedule error:', error);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

async function cancelAppointment(appointmentId) {
    const reason = prompt('Enter reason for cancellation:');
    if (reason === null) return;

    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/appointments/${appointmentId}/cancel`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ reason })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }

        showNotification('Appointment cancelled', 'success');
        await loadAppointments();
        await loadStats();
    } catch (error) {
        console.error('Cancel error:', error);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

function viewNotes(appointmentId) {
    const apt = allAppointments.find(a => a._id === appointmentId);
    if (apt && apt.notes) {
        alert(`Notes:\n\n${apt.notes}`);
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}