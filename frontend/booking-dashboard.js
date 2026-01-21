const API_BASE = 'http://localhost:5000/api';


console.log('📱 booking-dashboard.js STARTING');

document.addEventListener('DOMContentLoaded', function() {
    console.log('================================');
    console.log('✅ BOOKING DASHBOARD LOADING');
    console.log('================================');
    
    console.log('🔍 Checking localStorage...');
    const bookingJSON = localStorage.getItem('currentBooking');
    console.log('📦 currentBooking:', bookingJSON);
    
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    console.log('🔐 Token:', token ? '✅ EXISTS' : '❌ MISSING');
    
    console.log('⏳ Waiting 100ms before loading...');
    setTimeout(() => {
        loadAndDisplayBooking();
    }, 100);
});

async function loadAndDisplayBooking() {
    console.log('\n🚀 LOADING BOOKING DATA');
    console.log('================================');
    
    const bookingJSON = localStorage.getItem('currentBooking');
    console.log('📦 Retrieved from localStorage:', bookingJSON);
    
    if (!bookingJSON) {
        console.error('❌ CRITICAL: No booking in localStorage!');
        console.log('📋 Available keys in localStorage:');
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                console.log(`  - ${key}: ${localStorage.getItem(key)?.substring(0, 50)}...`);
            }
        }
        showErrorAndRedirect('No booking found. Please book an appointment first.');
        return;
    }
    
    try {
        const booking = JSON.parse(bookingJSON);
        console.log('✅ Parsed booking successfully');
        console.log('  - Doctor:', booking.doctorName);
        console.log('  - Provider:', booking.providerName);
        console.log('  - Date:', booking.date);
        console.log('  - Time:', booking.time);
        console.log('  - DoctorId:', booking.doctorId);
        console.log('  - ProviderId:', booking.providerId);
        console.log('  - Fee:', booking.consultationFee);
        
        // Validate required fields
        const required = ['doctorName', 'providerName', 'date', 'time', 'consultationFee'];
        for (let field of required) {
            if (!booking[field] && booking[field] !== 0) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        console.log('✅ All validation checks passed');
        
        // Display basic booking info first
        displayBooking(booking);
        
        // Then fetch and display provider info and correct queue number
        await fetchAndDisplayProviderInfo(booking);
        await fetchAndDisplayQueueInfo(booking);
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error('Stack:', error.stack);
        showErrorAndRedirect('Error loading booking: ' + error.message);
    }
}

function displayBooking(booking) {
    try {
        console.log('\n🎨 DISPLAYING BOOKING ON DASHBOARD');
        console.log('================================');
        
        // Update UI elements
        updateElement('dashboardDoctorName', booking.doctorName);
        updateElement('dashboardSpecialty', booking.specialty || 'Specialist');
        updateElement('dashboardHospital', booking.providerName);
        updateElement('dashboardFee', `₹${booking.consultationFee}`);
        updateElement('dashboardDate', formatDate(booking.date));
        updateElement('dashboardTime', booking.time);
        updateElement('dashboardBookingId', booking.id || 'N/A');
        updateElement('dashboardPatientName', 'You');
        updateElement('dashboardPatientId', 'N/A');
        
        // Set booking time
        const now = new Date();
        updateElement('dashboardBookingTime', now.toLocaleString('en-US', {
            weekday: 'long',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).replace(/,/, ','));
        
        console.log('✅ BASIC DASHBOARD ELEMENTS UPDATED');
        
    } catch (error) {
        console.error('❌ ERROR displaying booking:', error.message);
        console.error('Stack:', error.stack);
    }
}

async function fetchAndDisplayProviderInfo(booking) {
    try {
        console.log('\n🏥 FETCHING PROVIDER INFO');
        console.log('================================');
        
        const providerId = booking.providerId;
        
        if (!providerId) {
            console.log('⚠️ No providerId in booking, using fallback');
            displayFallbackProviderInfo(booking);
            return;
        }
        
        const response = await fetch(`${API_BASE}/healthcare-providers/${providerId}`);
        
        if (!response.ok) {
            console.log('⚠️ Provider fetch failed, using fallback');
            displayFallbackProviderInfo(booking);
            return;
        }
        
        const provider = await response.json();
        console.log('✅ Provider data:', provider);
        
        // Update provider section title and icon based on type
        const providerType = provider.type || 'hospital';
        const typeLabels = {
            'hospital': 'Hospital Information',
            'clinic': 'Clinic Information',
            'pharmacy': 'Pharmacy Information'
        };
        const typeIcons = {
            'hospital': 'fa-hospital',
            'clinic': 'fa-clinic-medical',
            'pharmacy': 'fa-prescription-bottle-alt'
        };
        
        updateElement('providerSectionTitle', typeLabels[providerType] || 'Provider Information');
        
        const iconEl = document.getElementById('providerIcon');
        if (iconEl) {
            iconEl.className = `fas ${typeIcons[providerType] || 'fa-hospital'}`;
        }
        
        updateElement('providerTypeLabel', providerType.charAt(0).toUpperCase() + providerType.slice(1) + ':');
        updateElement('dashboardProviderName', provider.name || booking.providerName);
        
        // Build location string
        let location = provider.address || '';
        if (provider.district) {
            location = location ? `${location}, ${provider.district}` : provider.district;
        }
        if (provider.state) {
            location = location ? `${location}, ${provider.state}` : provider.state;
        }
        updateElement('dashboardProviderLocation', location || 'N/A');
        
        updateElement('dashboardProviderContact', provider.phone || provider.contact || 'N/A');
        
        // Build timings string from operatingHours if available
        let timings = 'N/A';
        if (provider.operatingHours) {
            const hours = provider.operatingHours;
            if (hours.open && hours.close) {
                timings = `${hours.open} - ${hours.close}`;
            }
        } else if (provider.timings) {
            timings = provider.timings;
        }
        updateElement('dashboardProviderTimings', timings);
        
        // Store provider address for directions
        window.currentProviderAddress = provider.address || provider.name;
        
        console.log('✅ PROVIDER INFO UPDATED');
        
    } catch (error) {
        console.error('❌ Error fetching provider info:', error);
        displayFallbackProviderInfo(booking);
    }
}

function displayFallbackProviderInfo(booking) {
    console.log('📋 Using fallback provider info');
    
    updateElement('providerSectionTitle', 'Provider Information');
    updateElement('providerTypeLabel', 'Provider:');
    updateElement('dashboardProviderName', booking.providerName || 'N/A');
    updateElement('dashboardProviderLocation', 'N/A');
    updateElement('dashboardProviderContact', 'N/A');
    updateElement('dashboardProviderTimings', 'N/A');
}

async function fetchAndDisplayQueueInfo(booking) {
    try {
        console.log('\n📊 FETCHING QUEUE INFO');
        console.log('================================');
        
        const doctorId = booking.doctorId;
        const date = booking.date;
        const time = booking.time;
        
        if (!doctorId || !date || !time) {
            console.log('⚠️ Missing doctorId, date, or time - using booking queue number');
            displayQueueInfo(booking.queueNumber || 1);
            return;
        }
        
        // Fetch appointments for this doctor on this date and time
        const response = await fetch(`${API_BASE}/doctor-appointments/${doctorId}?date=${date}`);
        
        if (!response.ok) {
            console.log('⚠️ Appointments fetch failed, using booking queue number');
            displayQueueInfo(booking.queueNumber || 1);
            return;
        }
        
        const appointments = await response.json();
        console.log('✅ Appointments data:', appointments);
        
        // Count appointments for this specific time slot to get queue position
        const appointmentsForTimeSlot = appointments.filter(apt => apt.time === time);
        
        // Find this booking's position in the queue for this time slot
        let queuePosition = 1;
        const bookingId = booking.id;
        
        if (bookingId) {
            // Find this appointment's queue position among same time slot appointments
            const sortedAppts = appointmentsForTimeSlot.sort((a, b) => a.queueNumber - b.queueNumber);
            const myAppt = sortedAppts.find(apt => apt._id === bookingId);
            if (myAppt) {
                queuePosition = sortedAppts.indexOf(myAppt) + 1;
            } else {
                // If not found, assume we're the newest (last in queue)
                queuePosition = appointmentsForTimeSlot.length;
            }
        } else {
            // If no booking ID, count all appointments for this time slot
            queuePosition = appointmentsForTimeSlot.length;
        }
        
        // Ensure at least position 1
        if (queuePosition < 1) queuePosition = 1;
        
        console.log(`✅ Queue position for time ${time}: #${queuePosition} (${appointmentsForTimeSlot.length} total for this slot)`);
        
        displayQueueInfo(queuePosition, time);
        
    } catch (error) {
        console.error('❌ Error fetching queue info:', error);
        displayQueueInfo(booking.queueNumber || 1);
    }
}

function displayQueueInfo(queuePosition, time) {
    const patientsBefore = queuePosition - 1;
    const estimatedWait = patientsBefore * 15; // 15 minutes per patient
    
    updateElement('dashboardQueuePosition', `#${queuePosition}`);
    updateElement('dashboardWaitTime', `${estimatedWait} minutes`);
    
    // Calculate estimated time if we have the appointment time
    if (time) {
        const [hours, minutes] = time.split(':').map(Number);
        const estimatedDate = new Date();
        estimatedDate.setHours(hours, minutes || 0, 0, 0);
        estimatedDate.setMinutes(estimatedDate.getMinutes() + estimatedWait);
        
        const estimatedTimeStr = estimatedDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        updateElement('dashboardEstimatedTime', estimatedTimeStr);
    } else {
        updateElement('dashboardEstimatedTime', 'N/A');
    }
    
    console.log(`✅ Queue info displayed: #${queuePosition}, wait: ${estimatedWait} min`);
}

function updateElement(id, value) {
    try {
        const el = document.getElementById(id);
        if (!el) {
            console.warn(`⚠️ Element not found: ${id}`);
            return;
        }
        el.textContent = value;
        console.log(`  ✓ ${id} = ${value}`);
    } catch (error) {
        console.error(`❌ Error updating ${id}:`, error);
    }
}

function formatDate(dateStr) {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            console.warn('⚠️ Invalid date:', dateStr);
            return dateStr;
        }
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    } catch (e) {
        console.error('❌ Error formatting date:', e);
        return dateStr;
    }
}

function showErrorAndRedirect(message) {
    console.error('🚨 SHOWING ERROR:', message);
    
    const div = document.createElement('div');
    div.style.cssText = `
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        color: #991b1b;
        padding: 40px 20px;
        margin: 0;
        border-radius: 0;
        text-align: center;
        font-size: 16px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
    `;
    
    div.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 12px; max-width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #991b1b; margin-bottom: 20px;"></i>
            <h2 style="margin: 20px 0; color: #991b1b;">Oops! Something went wrong</h2>
            <p style="color: #7f1d1d; margin: 15px 0;">${message}</p>
            <p style="font-size: 14px; color: #9ca3af; margin-top: 20px;">📌 Debug Info: Open browser console (F12) for details</p>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">Redirecting to home in 5 seconds...</p>
        </div>
    `;
    
    document.body.innerHTML = div.outerHTML;
    console.log('⏳ Redirecting to home in 5 seconds...');
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 5000);
}

function openRescheduleModal() {
    console.log('📅 Opening reschedule modal');
    const modal = document.getElementById('rescheduleModal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Set min date to today
        const dateInput = document.getElementById('newRescheduleDate');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
            dateInput.value = today;
            
            // Add listener to update times when date changes
            dateInput.onchange = updateRescheduleTimes;
        }
        
        // Initial time update
        updateRescheduleTimes();
    }
}

async function updateRescheduleTimes() {
    const timeSelect = document.getElementById('newRescheduleTime');
    const dateInput = document.getElementById('newRescheduleDate');
    const bookingJSON = localStorage.getItem('currentBooking');
    
    if (!timeSelect || !dateInput || !bookingJSON) return;
    
    const booking = JSON.parse(bookingJSON);
    const doctorId = booking.doctorId;
    const selectedDate = new Date(dateInput.value);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const selectedDay = dayNames[selectedDate.getDay()];
    
    timeSelect.innerHTML = '<option value="">Loading times...</option>';
    
    try {
        // Correct API base for frontend calls if not absolute
        const baseUrl = window.location.origin + '/api';
        const response = await fetch(`${baseUrl}/doctors/${doctorId}`);
        if (!response.ok) throw new Error('Doctor not found');
        
        const doctor = await response.json();
        const dayHours = (doctor.visitingHours || []).find(h => h.day === selectedDay);
        
        timeSelect.innerHTML = '';
        
        if (!dayHours || !dayHours.startTime || !dayHours.endTime) {
            timeSelect.innerHTML = '<option value="">No availability on this day</option>';
            return;
        }
        
        const [startHour, startMin] = dayHours.startTime.split(':').map(Number);
        const [endHour, endMin] = dayHours.endTime.split(':').map(Number);
        
        // Generate slots every hour within the doctor's visiting range
        for (let h = startHour; h < endHour; h++) {
            const timeVal = `${h.toString().padStart(2, '0')}:00`;
            const period = h >= 12 ? 'PM' : 'AM';
            const displayH = h % 12 || 12;
            const displayTime = `${displayH}:00 ${period}`;
            
            const option = document.createElement('option');
            option.value = timeVal;
            option.textContent = displayTime;
            timeSelect.appendChild(option);
        }
        
        if (timeSelect.options.length === 0) {
            timeSelect.innerHTML = '<option value="">Doctor not available on this day</option>';
        }
    } catch (error) {
        console.error('Error fetching visiting hours:', error);
        timeSelect.innerHTML = '<option value="">Error loading times</option>';
    }
}

function closeRescheduleModal() {
    const modal = document.getElementById('rescheduleModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function submitReschedule() {
    const newDate = document.getElementById('newRescheduleDate').value;
    const newTime = document.getElementById('newRescheduleTime').value;
    
    if (!newDate || !newTime) {
        alert('Please select both date and time');
        return;
    }

    const bookingJSON = localStorage.getItem('currentBooking');
    if (!bookingJSON) {
        alert('Booking session expired');
        return;
    }

    const booking = JSON.parse(bookingJSON);
    const appointmentId = booking.id;
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');

    if (!appointmentId || !token) {
        alert('Authentication error. Please login again.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/appointments/${appointmentId}/reschedule`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ newDate, newTime })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to reschedule');
        }

        const result = await response.json();
        
        // Update local storage and UI
        booking.date = newDate;
        booking.time = newTime;
        booking.queueNumber = result.appointment.queueNumber;
        localStorage.setItem('currentBooking', JSON.stringify(booking));
        
        alert('Appointment successfully rescheduled!');
        closeRescheduleModal();
        location.reload(); // Refresh to show new queue info
        
    } catch (error) {
        console.error('Reschedule error:', error);
        alert('Error: ' + error.message);
    }
}

function rescheduleAppointment() {
    openRescheduleModal();
}

function cancelAppointment() {
    console.log('❌ Cancel appointment requested');
    if (confirm('Are you sure you want to cancel this appointment?')) {
        try {
            localStorage.removeItem('currentBooking');
            console.log('✅ Booking removed');
            alert('Appointment cancelled.');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('❌ Error cancelling:', error);
        }
    }
}

function downloadTicket() {
    console.log('📥 Download ticket requested');
    const bookingJSON = localStorage.getItem('currentBooking');
    if (!bookingJSON) {
        alert('No booking found');
        return;
    }
    
    try {
        const booking = JSON.parse(bookingJSON);
        const queuePosition = document.getElementById('dashboardQueuePosition')?.textContent || '#1';
        
        const ticketHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Appointment Ticket</title>
                <style>
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        padding: 20px; 
                        background: #f5f5f5;
                    }
                    .ticket { 
                        border: 3px solid #2563eb; 
                        padding: 30px; 
                        max-width: 600px; 
                        margin: 0 auto;
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        text-align: center;
                        border-bottom: 3px solid #2563eb;
                        padding-bottom: 20px;
                        margin-bottom: 20px;
                    }
                    .header h2 {
                        color: #2563eb;
                        margin: 0;
                    }
                    .section { margin-bottom: 20px; }
                    .section h3 {
                        color: #2563eb;
                        border-bottom: 2px solid #2563eb;
                        padding-bottom: 10px;
                    }
                    .row { 
                        display: flex; 
                        justify-content: space-between; 
                        margin: 10px 0;
                        padding: 8px 0;
                    }
                    .label {
                        font-weight: 600;
                        color: #666;
                    }
                    .value {
                        font-weight: 700;
                        color: #2563eb;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 2px solid #2563eb;
                        font-size: 12px;
                        color: #999;
                    }
                </style>
            </head>
            <body>
                <div class="ticket">
                    <div class="header">
                        <h2>📋 Appointment Ticket</h2>
                        <p style="margin: 5px 0; color: #666;">HealthConnect</p>
                    </div>
                    
                    <div class="section">
                        <h3>👨‍⚕️ Doctor Information</h3>
                        <div class="row">
                            <span class="label">Name:</span>
                            <strong class="value">${booking.doctorName}</strong>
                        </div>
                        <div class="row">
                            <span class="label">Provider:</span>
                            <strong class="value">${booking.providerName}</strong>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h3>📅 Appointment Details</h3>
                        <div class="row">
                            <span class="label">Date:</span>
                            <strong class="value">${booking.date}</strong>
                        </div>
                        <div class="row">
                            <span class="label">Time:</span>
                            <strong class="value">${booking.time}</strong>
                        </div>
                        <div class="row">
                            <span class="label">Queue Position:</span>
                            <strong class="value">${queuePosition}</strong>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h3>💰 Fee</h3>
                        <div class="row">
                            <span class="label">Consultation Fee:</span>
                            <strong class="value">₹${booking.consultationFee}</strong>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Generated: ${new Date().toLocaleString()}</p>
                        <p>Please keep this ticket for your reference</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        const w = window.open();
        w.document.write(ticketHTML);
        w.document.close();
        w.print();
        console.log('✅ Ticket generated and printed');
    } catch (error) {
        console.error('❌ Error downloading ticket:', error);
        alert('Error downloading ticket');
    }
}

function getPharmacyDirections() {
    console.log('🗺️ Opening maps');
    const address = window.currentProviderAddress || '';
    if (address) {
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        window.open(mapsUrl, '_blank');
    } else {
        window.open('https://www.google.com/maps', '_blank');
    }
}

function addNotes() {
    console.log('📝 Add notes requested');
    alert('Notes feature coming soon!');
}

function viewAppointmentHistory() {
    console.log('📚 View history requested');
    alert('History feature coming soon!');
}

console.log('✅ booking-dashboard.js FULLY LOADED');
