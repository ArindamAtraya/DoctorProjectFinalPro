// Doctor Availability JavaScript - Enhanced with Mobile Support
const API_BASE = 'http://localhost:5000/api';
let currentDate = new Date();
let selectedDate = new Date();
let selectedTimeSlot = null;
let currentDoctor = null;
let isLoading = false;

// Initialize the page with enhanced features
document.addEventListener('DOMContentLoaded', function() {
    initializeDoctorAvailability();
    generateCalendar();
    loadTimeSlots();
    initializeMobileFeatures();
});

// Mobile features initialization
function initializeMobileFeatures() {
    initializeTouchInteractions();
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    initializeLoadingStates();
}

function setViewportHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

function initializeTouchInteractions() {
    const touchElements = document.querySelectorAll('.calendar-day, .time-slot-card, .btn');
    touchElements.forEach(element => {
        element.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
        }, { passive: true });
        element.addEventListener('touchend', function() {
            this.classList.remove('touch-active');
        }, { passive: true });
    });
}

function initializeLoadingStates() {
    const timeSlotsGrid = document.getElementById('timeSlotsGrid');
    if (timeSlotsGrid) {
        timeSlotsGrid.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const loadingSlot = document.createElement('div');
            loadingSlot.className = 'time-slot-card loading-slot';
            loadingSlot.innerHTML = `
                <div class="time-slot-time" style="color: transparent;">Loading</div>
                <div class="time-slot-queue" style="color: transparent;">Loading</div>
            `;
            timeSlotsGrid.appendChild(loadingSlot);
        }
    }
}

async function initializeDoctorAvailability() {
    const urlParams = new URLSearchParams(window.location.search);
    const doctorId = urlParams.get('doctorId');
    
    if (!doctorId) {
        document.getElementById('doctorName').textContent = 'Doctor not found';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/doctors/${doctorId}`);
        if (!response.ok) throw new Error('Doctor not found');
        
        currentDoctor = await response.json();
        console.log('✅ Doctor loaded:', currentDoctor);
        
        setTimeout(() => {
            document.getElementById('doctorName').textContent = currentDoctor.name;
            document.getElementById('doctorSpecialty').textContent = currentDoctor.specialty;
            document.getElementById('doctorHospital').textContent = currentDoctor.hospital;
            document.getElementById('doctorRating').textContent = currentDoctor.rating || '4.5';
            document.querySelector('.doctor-header').style.animation = 'slideUp 0.6s ease';
        }, 300);
    } catch (error) {
        console.error('Error loading doctor:', error);
        document.getElementById('doctorName').textContent = 'Error loading doctor';
    }
    
    updateWeekRangeDisplay();
}

function generateCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const today = new Date();
        if (dayDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('active');
        }
        
        const hasAvailability = Math.random() > 0.3;
        if (hasAvailability) {
            dayElement.classList.add('available');
        }
        
        const dateNumber = document.createElement('div');
        dateNumber.textContent = dayDate.getDate();
        dateNumber.style.fontSize = '1.1rem';
        dateNumber.style.fontWeight = '600';
        dayElement.appendChild(dateNumber);
        
        if (window.innerWidth <= 768) {
            const monthAbbr = document.createElement('div');
            monthAbbr.textContent = dayDate.toLocaleDateString('en-US', { month: 'short' });
            monthAbbr.style.fontSize = '0.7rem';
            monthAbbr.style.opacity = '0.7';
            monthAbbr.style.marginTop = '2px';
            dayElement.appendChild(monthAbbr);
        }
        
        dayElement.setAttribute('data-date', dayDate.toISOString().split('T')[0]);
        dayElement.addEventListener('click', function() {
            if (!isLoading) selectDate(this.getAttribute('data-date'));
        });
        
        calendarGrid.appendChild(dayElement);
    }
    
    updateWeekRangeDisplay();
}

function updateWeekRangeDisplay() {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const options = { month: 'short', day: 'numeric' };
    const startStr = startOfWeek.toLocaleDateString('en-US', options);
    const endStr = endOfWeek.toLocaleDateString('en-US', options);
    
    let displayText = `${startStr} - ${endStr}, ${currentDate.getFullYear()}`;
    if (window.innerWidth <= 480) {
        displayText = `${startStr} - ${endStr}`;
    }
    
    document.getElementById('currentWeekRange').textContent = displayText;
}

function previousWeek() {
    if (isLoading) return;
    currentDate.setDate(currentDate.getDate() - 7);
    generateCalendar();
    loadTimeSlots();
}

function nextWeek() {
    if (isLoading) return;
    currentDate.setDate(currentDate.getDate() + 7);
    generateCalendar();
    loadTimeSlots();
}

function selectDate(dateString) {
    if (isLoading) return;
    selectedDate = new Date(dateString);
    
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('active');
        if (day.getAttribute('data-date') === dateString) {
            day.classList.add('active');
            day.style.animation = 'pulse 0.5s ease';
        }
    });
    
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    let displayText = selectedDate.toLocaleDateString('en-US', options);
    if (window.innerWidth <= 480) {
        const mobileOptions = { weekday: 'short', month: 'short', day: 'numeric' };
        displayText = selectedDate.toLocaleDateString('en-US', mobileOptions);
    }
    
    document.getElementById('selectedDateDisplay').textContent = displayText;
    loadTimeSlots();
}

async function loadTimeSlots() {
    if (isLoading) return;
    isLoading = true;
    const timeSlotsGrid = document.getElementById('timeSlotsGrid');
    
    timeSlotsGrid.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const loadingSlot = document.createElement('div');
        loadingSlot.className = 'time-slot-card loading-slot';
        loadingSlot.innerHTML = `
            <div class="time-slot-time" style="color: transparent;">Loading</div>
            <div class="time-slot-queue" style="color: transparent;">Loading</div>
        `;
        timeSlotsGrid.appendChild(loadingSlot);
    }
    
    try {
        const timeSlots = await generateTimeSlots();
        timeSlotsGrid.innerHTML = '';
        
        if (timeSlots.length === 0) {
            timeSlotsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--gray);">
                    <i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                    <h3>No Available Slots</h3>
                    <p>Doctor is not available on this date.</p>
                </div>
            `;
        } else {
            timeSlots.forEach(slot => {
                const slotElement = document.createElement('div');
                slotElement.className = 'time-slot-card';
                slotElement.setAttribute('data-time', slot.time);
                slotElement.setAttribute('data-queue', slot.queuePosition);
                
                const statusElement = document.createElement('div');
                statusElement.className = `slot-status ${getSlotStatus(slot.queuePosition)}`;
                slotElement.appendChild(statusElement);
                
                slotElement.innerHTML += `
                    <div class="time-slot-time">${formatTimeForDisplay(slot.time)}</div>
                    <div class="time-slot-queue">${slot.queuePosition} in queue</div>
                `;
                
                slotElement.addEventListener('click', function() {
                    if (!isLoading) selectTimeSlot(this);
                });
                
                timeSlotsGrid.appendChild(slotElement);
            });
        }
        
        isLoading = false;
    } catch (error) {
        console.error('Error loading time slots:', error);
        timeSlotsGrid.innerHTML = '<p>Error loading time slots. Please try again.</p>';
        isLoading = false;
    }
}

function getSlotStatus(queuePosition) {
    if (queuePosition === 0) return 'slot-available';
    if (queuePosition <= 2) return 'slot-busy';
    return 'slot-full';
}

function formatTimeForDisplay(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

async function generateTimeSlots() {
    const slots = [];
    if (!currentDoctor || !currentDoctor.visitingHours) {
        for (let i = 9; i < 17; i++) {
            slots.push({ time: `${i}:00`, queuePosition: 0, available: true });
        }
        return slots;
    }
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const selectedDayName = dayNames[selectedDate.getDay()];
    const dayHours = currentDoctor.visitingHours.find(h => h.day === selectedDayName);
    
    if (!dayHours || !dayHours.startTime || !dayHours.endTime) {
        return [];
    }
    
    try {
        const dateString = selectedDate.toISOString().split('T')[0];
        const doctorId = currentDoctor._id || currentDoctor.id;
        const response = await fetch(`${API_BASE}/doctor-appointments/${doctorId}?date=${dateString}`);
        const appointments = response.ok ? await response.json() : [];
        
        const [startHour] = dayHours.startTime.split(':').map(Number);
        const [endHour] = dayHours.endTime.split(':').map(Number);
        
        for (let hour = startHour; hour < endHour; hour++) {
            const time = `${hour}:00`;
            const bookingsForSlot = appointments.filter(apt => apt.time === time).length;
            slots.push({ time: time, queuePosition: bookingsForSlot, available: true });
        }
    } catch (error) {
        console.error('Error fetching appointments:', error);
        const [startHour] = dayHours.startTime.split(':').map(Number);
        const [endHour] = dayHours.endTime.split(':').map(Number);
        for (let hour = startHour; hour < endHour; hour++) {
            slots.push({ time: `${hour}:00`, queuePosition: 0, available: true });
        }
    }
    
    return slots;
}

function selectTimeSlot(slotElement) {
    if (isLoading) return;
    
    document.querySelectorAll('.time-slot-card').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    slotElement.classList.add('selected');
    slotElement.style.animation = 'pulse 0.3s ease';
    
    selectedTimeSlot = {
        time: slotElement.getAttribute('data-time'),
        queuePosition: parseInt(slotElement.getAttribute('data-queue'))
    };
    
    showQueueInfo();
}

function showQueueInfo() {
    if (!selectedTimeSlot) return;
    
    const queueInfoPanel = document.getElementById('queueInfoPanel');
    const patientsBefore = selectedTimeSlot.queuePosition;
    const estimatedWait = patientsBefore * 15;
    
    const [hours, minutes] = selectedTimeSlot.time.split(':').map(Number);
    const slotTime = new Date(selectedDate);
    slotTime.setHours(hours, minutes, 0, 0);
    
    const estimatedTime = new Date(slotTime.getTime() + estimatedWait * 60000);
    const estimatedTimeStr = estimatedTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    document.getElementById('queuePosition').textContent = `#${patientsBefore + 1}`;
    document.getElementById('patientsBefore').textContent = patientsBefore;
    document.getElementById('estimatedWait').textContent = `${estimatedWait} minutes`;
    document.getElementById('estimatedTime').textContent = estimatedTimeStr;
    
    queueInfoPanel.classList.add('active');
    
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            queueInfoPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }, 300);
    }
}

function closeQueueInfo() {
    const queueInfoPanel = document.getElementById('queueInfoPanel');
    queueInfoPanel.classList.remove('active');
    document.querySelectorAll('.time-slot-card').forEach(slot => {
        slot.classList.remove('selected');
    });
    selectedTimeSlot = null;
}

async function confirmBooking() {
    console.log('🎯 confirmBooking called!');
    
    if (!selectedTimeSlot) {
        console.log('❌ No time slot selected');
        showNotification('Please select a time slot first.', 'error');
        return;
    }
    
    const token = localStorage.getItem('authToken');
    console.log('🔑 Token:', token ? 'YES' : 'NO');
    
    if (!token) {
        showNotification('Please login to book an appointment.', 'error');
        window.location.href = 'index.html';
        return;
    }
    
    const confirmBtn = document.querySelector('.btn-xl');
    confirmBtn.innerHTML = '<div class="loading"></div> Processing...';
    confirmBtn.disabled = true;
    
    try {
        const doctorId = currentDoctor._id || currentDoctor.id;
        const date = selectedDate.toISOString().split('T')[0];
        const time = selectedTimeSlot.time;
        
        console.log('📤 Sending:', { doctorId, date, time, API_BASE });
        
        const response = await fetch(`${API_BASE}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ doctorId, date, time, notes: '' })
        });
        
        console.log('📊 Response:', response.status, response.ok);
        const result = await response.json();
        console.log('📥 Data:', result);
        
        if (!response.ok) {
            throw new Error(result.error || `HTTP ${response.status}`);
        }
        
        // Save booking to localStorage
        const bookingData = {
            id: result.appointment.id || result.appointment._id,
            doctorName: result.appointment.doctorName || currentDoctor.name,
            providerName: result.appointment.providerName || currentDoctor.hospital,
            date: result.appointment.date,
            time: result.appointment.time,
            queueNumber: result.appointment.queueNumber,
            consultationFee: result.appointment.consultationFee || currentDoctor.consultationFee
        };
        
        console.log('💾 Saving:', bookingData);
        localStorage.setItem('currentBooking', JSON.stringify(bookingData));
        console.log('✅ Saved to localStorage');
        
        showNotification('Appointment booked successfully!', 'success');
        
        setTimeout(() => {
            console.log('🔗 Redirecting...');
            window.location.href = 'booking-dashboard.html';
        }, 800);
        
    } catch (error) {
        console.error('❌ ERROR:', error);
        showNotification(`Booking failed: ${error.message}`, 'error');
        confirmBtn.innerHTML = 'Confirm Booking';
        confirmBtn.disabled = false;
    }
}

function showNotification(message, type = 'info') {
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 400);
    }, 5000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .touch-active { transform: scale(0.95); }
    #queuePosition, #doctorSpecialty { color: white !important; }
`;
document.head.appendChild(style);