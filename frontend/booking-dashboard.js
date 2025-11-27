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

function loadAndDisplayBooking() {
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
        console.log('  - Queue:', booking.queueNumber);
        console.log('  - Fee:', booking.consultationFee);
        
        // Validate all required fields
        const required = ['doctorName', 'providerName', 'date', 'time', 'queueNumber', 'consultationFee'];
        for (let field of required) {
            if (!booking[field] && booking[field] !== 0) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        console.log('✅ All validation checks passed');
        displayBooking(booking);
        
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
        updateElement('dashboardQueuePosition', `#${booking.queueNumber}`);
        updateElement('dashboardWaitTime', '0 minutes');
        updateElement('dashboardEstimatedTime', booking.time);
        
        console.log('✅ ALL DASHBOARD ELEMENTS UPDATED');
        
    } catch (error) {
        console.error('❌ ERROR displaying booking:', error.message);
        console.error('Stack:', error.stack);
        showErrorAndRedirect('Error displaying booking: ' + error.message);
    }
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

function rescheduleAppointment() {
    console.log('📅 Reschedule requested');
    alert('Rescheduling feature coming soon!');
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
                            <strong class="value">#${booking.queueNumber}</strong>
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
    window.open('https://www.google.com/maps', '_blank');
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