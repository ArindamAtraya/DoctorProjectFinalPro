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
    // Handle touch interactions
    initializeTouchInteractions();
    
    // Handle viewport height for mobile
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    
    // Add loading states
    initializeLoadingStates();
}

function setViewportHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

function initializeTouchInteractions() {
    // Add touch feedback for interactive elements
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
    // Simulate loading for better UX
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
    // Get doctor info from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const doctorId = urlParams.get('doctorId');
    
    if (!doctorId) {
        document.getElementById('doctorName').textContent = 'Doctor not found';
        return;
    }
    
    try {
        // Fetch doctor from backend
        const response = await fetch(`${API_BASE}/doctors/${doctorId}`);
        if (!response.ok) throw new Error('Doctor not found');
        
        currentDoctor = await response.json();
        console.log('✅ Doctor loaded:', currentDoctor);
        
            // Update doctor info with animation
            setTimeout(() => {
                document.getElementById('doctorName').textContent = currentDoctor.name;
                document.getElementById('doctorSpecialty').textContent = currentDoctor.specialty;
                
                // Update provider info
                const providerName = currentDoctor.providerName || currentDoctor.hospital || 'Healthcare Provider';
                const providerType = currentDoctor.providerType || 'healthcare';
                const providerTypeLabel = providerType.charAt(0).toUpperCase() + providerType.slice(1);
                const providerDistrict = currentDoctor.providerDistrict || 'N/A';
                const providerAddress = currentDoctor.providerAddress || 'N/A';
                
                // Set provider name and type (with null checks)
                const providerNameEl = document.getElementById('providerName');
                const providerTypeEl = document.getElementById('providerType');
                if (providerNameEl) providerNameEl.textContent = providerName;
                if (providerTypeEl) providerTypeEl.textContent = ` (${providerTypeLabel})`;
                
                // Set provider icon based on type
                const providerIconEl = document.getElementById('providerIcon');
                if (providerIconEl) {
                    if (providerType === 'hospital') {
                        providerIconEl.className = 'fas fa-hospital';
                    } else if (providerType === 'clinic') {
                        providerIconEl.className = 'fas fa-clinic-medical';
                    } else if (providerType === 'physio') {
                        providerIconEl.className = 'fas fa-hands-helping';
                    } else {
                        providerIconEl.className = 'fas fa-prescription-bottle-alt';
                    }
                }
                
                // Set location
                const providerDistrictEl = document.getElementById('providerDistrict');
                if (providerDistrictEl) providerDistrictEl.textContent = providerDistrict;
                
                // Set address
                const providerAddressEl = document.getElementById('providerAddress');
                if (providerAddressEl) providerAddressEl.textContent = providerAddress;
                
                // Hide rating/reviews section as requested
                const ratingSection = document.querySelector('.rating-container') || document.querySelector('.doctor-rating');
                if (ratingSection) ratingSection.style.display = 'none';
                
                // Add entrance animation
                document.querySelector('.doctor-header').style.animation = 'slideUp 0.6s ease';
            }, 300);
    } catch (error) {
        console.error('Error loading doctor:', error);
        document.getElementById('doctorName').textContent = 'Error loading doctor';
    }
    
    // Update week range display
    updateWeekRangeDisplay();
}

function generateCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Clear existing calendar
    calendarGrid.innerHTML = '';
    
    // Get start of current week (Sunday)
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    // Get today's date (without time) for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Generate 7 days for the week
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        dayDate.setHours(0, 0, 0, 0);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // Check if this day is in the past (disable it)
        const isPastDate = dayDate < today;
        if (isPastDate) {
            dayElement.classList.add('disabled');
            dayElement.style.opacity = '0.4';
            dayElement.style.cursor = 'not-allowed';
            dayElement.style.pointerEvents = 'none';
        }
        
        // Check if this day is today
        if (dayDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('active');
        }
        
        // Check if this day has available slots (only for future dates)
        if (!isPastDate) {
            const hasAvailability = Math.random() > 0.3; // 70% chance of availability
            if (hasAvailability) {
                dayElement.classList.add('available');
            }
        }
        
        // Add date number
        const dateNumber = document.createElement('div');
        dateNumber.textContent = dayDate.getDate();
        dateNumber.style.fontSize = '1.1rem';
        dateNumber.style.fontWeight = '600';
        dayElement.appendChild(dateNumber);
        
        // Add month abbreviation for mobile
        if (window.innerWidth <= 768) {
            const monthAbbr = document.createElement('div');
            monthAbbr.textContent = dayDate.toLocaleDateString('en-US', { month: 'short' });
            monthAbbr.style.fontSize = '0.7rem';
            monthAbbr.style.opacity = '0.7';
            monthAbbr.style.marginTop = '2px';
            dayElement.appendChild(monthAbbr);
        }
        
        // Use local date format to avoid timezone issues
        const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
        dayElement.setAttribute('data-date', dateStr);
        
        // Only add click handler for non-past dates
        if (!isPastDate) {
            dayElement.addEventListener('click', function() {
                if (!isLoading) {
                    selectDate(this.getAttribute('data-date'));
                }
            });
        }
        
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
    
    // Format for mobile
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
    
    // Add animation
    document.querySelector('.availability-calendar').style.animation = 'slideUp 0.4s ease';
}

function nextWeek() {
    if (isLoading) return;
    
    currentDate.setDate(currentDate.getDate() + 7);
    generateCalendar();
    loadTimeSlots();
    
    // Add animation
    document.querySelector('.availability-calendar').style.animation = 'slideUp 0.4s ease';
}

function selectDate(dateString) {
    if (isLoading) return;
    
    // Prevent selecting past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse date string properly to avoid timezone issues
    // dateString is in format "YYYY-MM-DD"
    const [year, month, day] = dateString.split('-').map(Number);
    const dateToSelect = new Date(year, month - 1, day);
    dateToSelect.setHours(0, 0, 0, 0);
    
    if (dateToSelect < today) {
        showNotification('Cannot select past dates. Please choose today or a future date.', 'error');
        return;
    }
    
    // Create date in local timezone (not UTC)
    selectedDate = new Date(year, month - 1, day);
    
    // Update calendar selection with animation
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('active');
        if (day.getAttribute('data-date') === dateString) {
            day.classList.add('active');
            day.style.animation = 'pulse 0.5s ease';
        }
    });
    
    // Update date display
    const options = { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
    };
    
    let displayText = selectedDate.toLocaleDateString('en-US', options);
    if (window.innerWidth <= 480) {
        const mobileOptions = { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric'
        };
        displayText = selectedDate.toLocaleDateString('en-US', mobileOptions);
    }
    
    document.getElementById('selectedDateDisplay').textContent = displayText;
    
    // Load time slots for selected date with loading state
    loadTimeSlots();
}

async function loadTimeSlots() {
    if (isLoading) return;
    
    isLoading = true;
    const timeSlotsGrid = document.getElementById('timeSlotsGrid');
    
    // Show loading state
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
    
    // Generate time slots based on doctor's visiting hours with real booking data
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
                
                // Add status indicator
                const statusElement = document.createElement('div');
                statusElement.className = `slot-status ${getSlotStatus(slot.queuePosition)}`;
                slotElement.appendChild(statusElement);
                
                slotElement.innerHTML += `
                    <div class="time-slot-time">${formatTimeForDisplay(slot.time)}</div>
                    <div class="time-slot-queue">${slot.queuePosition} in queue</div>
                `;
                
                slotElement.addEventListener('click', function() {
                    if (!isLoading) {
                        selectTimeSlot(this);
                    }
                });
                
                timeSlotsGrid.appendChild(slotElement);
            });
        }
        
        isLoading = false;
        timeSlotsGrid.style.animation = 'slideUp 0.5s ease';
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
        // Default 9 AM to 5 PM if no visiting hours
        for (let i = 9; i < 17; i++) {
            slots.push({
                time: `${i}:00`,
                queuePosition: 0,
                available: true
            });
        }
        return slots;
    }
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const selectedDayName = dayNames[selectedDate.getDay()];
    
    const dayHours = currentDoctor.visitingHours.find(h => h.day === selectedDayName);
    
    if (!dayHours || !dayHours.startTime || !dayHours.endTime) {
        return [];
    }
    
    // Fetch real appointments for this doctor on this date
    try {
        const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        const doctorId = currentDoctor._id || currentDoctor.id;
        const response = await fetch(`${API_BASE}/doctor-appointments/${doctorId}?date=${dateString}`);
        const appointments = response.ok ? await response.json() : [];
        
        console.log('✅ Fetched appointments:', appointments);
        
        // Parse start and end times
        const [startHour, startMin] = dayHours.startTime.split(':').map(Number);
        const [endHour, endMin] = dayHours.endTime.split(':').map(Number);
        
        // Generate slots every hour
        for (let hour = startHour; hour < endHour; hour++) {
            const time = `${hour}:00`;
            
            // Count real bookings for this time slot
            const bookingsForSlot = appointments.filter(apt => apt.time === time).length;
            
            slots.push({
                time: time,
                queuePosition: bookingsForSlot,
                available: true
            });
        }
    } catch (error) {
        console.error('Error fetching appointments:', error);
        // Fallback: generate slots without real data
        const [startHour, startMin] = dayHours.startTime.split(':').map(Number);
        const [endHour, endMin] = dayHours.endTime.split(':').map(Number);
        
        for (let hour = startHour; hour < endHour; hour++) {
            const time = `${hour}:00`;
            slots.push({
                time: time,
                queuePosition: 0,
                available: true
            });
        }
    }
    
    return slots;
}

function selectTimeSlot(slotElement) {
    if (isLoading) return;
    
    // Remove previous selection
    document.querySelectorAll('.time-slot-card').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Add selection to clicked slot with animation
    slotElement.classList.add('selected');
    slotElement.style.animation = 'pulse 0.3s ease';
    
    // Store selected time slot
    selectedTimeSlot = {
        time: slotElement.getAttribute('data-time'),
        queuePosition: parseInt(slotElement.getAttribute('data-queue'))
    };
    
    console.log('🕐 Selected time slot:', selectedTimeSlot);
    
    // Show queue information
    showQueueInfo();
}

function showQueueInfo() {
    if (!selectedTimeSlot) return;
    
    const queueInfoPanel = document.getElementById('queueInfoPanel');
    const patientsBefore = selectedTimeSlot.queuePosition;
    const estimatedWait = patientsBefore * 15; // 15 minutes per patient
    
    // Calculate estimated time
    const [hours, minutes] = selectedTimeSlot.time.split(':').map(Number);
    const slotTime = new Date(selectedDate);
    slotTime.setHours(hours, minutes, 0, 0);
    
    const estimatedTime = new Date(slotTime.getTime() + estimatedWait * 60000);
    const estimatedTimeStr = estimatedTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    
    // Update queue info
    document.getElementById('queuePosition').textContent = `#${patientsBefore + 1}`;
    document.getElementById('patientsBefore').textContent = patientsBefore;
    document.getElementById('estimatedWait').textContent = `${estimatedWait} minutes`;
    document.getElementById('estimatedTime').textContent = estimatedTimeStr;
    
    // Show the panel
    queueInfoPanel.classList.add('active');
    
    // Scroll to the panel smoothly on mobile
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            queueInfoPanel.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest',
                inline: 'nearest'
            });
        }, 300);
    }
}

function closeQueueInfo() {
    const queueInfoPanel = document.getElementById('queueInfoPanel');
    queueInfoPanel.classList.remove('active');
    
    // Clear selection
    document.querySelectorAll('.time-slot-card').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    selectedTimeSlot = null;
}

async function confirmBooking() {
    console.log('🔔 CONFIRM BOOKING CLICKED');
    
    if (!selectedTimeSlot) {
        showNotification('Please select a time slot first.', 'error');
        return;
    }
    
    // Prevent booking past dates (extra validation)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(selectedDate);
    bookingDate.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
        showNotification('Cannot book appointments for past dates. Please select today or a future date.', 'error');
        return;
    }
    
    // Check if user is logged in
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) {
        showNotification('Please login to book an appointment.', 'error');
        window.location.href = 'index.html';
        return;
    }
    
    // Show loading state
    const confirmBtn = document.querySelector('.btn-xl');
    confirmBtn.innerHTML = '<div class="loading"></div> Processing...';
    confirmBtn.disabled = true;
    
    try {
        // POST booking to backend API
        const doctorId = currentDoctor._id || currentDoctor.id;
        console.log('📤 Posting booking to backend...');
        
        const response = await fetch(`${API_BASE}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                doctorId: doctorId,
                date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
                time: selectedTimeSlot.time,
                notes: ''
            })
        });
        
        console.log('✅ POST response status:', response.status);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Booking failed');
        }
        
        const result = await response.json();
        console.log('✅ Booking result:', result);
        
        // Get appointment ID from response (could be id or _id)
        const appointmentId = result.appointment.id || result.appointment._id;
        
        if (!appointmentId) {
            throw new Error('No appointment ID received');
        }
        
        // Store appointment data in localStorage (more reliable than sessionStorage)
        const bookingData = {
            id: appointmentId,
            doctorId: currentDoctor._id || currentDoctor.id,
            providerId: currentDoctor.providerId,
            doctorName: result.appointment.doctorName || currentDoctor.name,
            providerName: result.appointment.providerName || currentDoctor.hospital || currentDoctor.providerName,
            specialty: result.appointment.specialty || currentDoctor.specialty,
            date: result.appointment.date,
            time: result.appointment.time,
            queueNumber: result.appointment.queueNumber,
            consultationFee: result.appointment.consultationFee || currentDoctor.consultationFee || 500
        };
        
        localStorage.setItem('currentBooking', JSON.stringify(bookingData));
        console.log('✅ Booking saved to localStorage:', bookingData);
        
        // Show success message
        showNotification('Appointment booked successfully!', 'success');
        
        // Direct redirect with no query params
        setTimeout(() => {
            console.log('🔄 Redirecting to booking dashboard');
            window.location.href = 'booking-dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('❌ Booking error:', error);
        showNotification(`Booking failed: ${error.message}`, 'error');
        confirmBtn.innerHTML = 'Confirm Booking';
        confirmBtn.disabled = false;
    }
}

// Enhanced notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 400);
    }, 5000);
    
    // Click to dismiss
    notification.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 400);
    });
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Utility function to format date (in local timezone, not UTC)
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Add CSS for pulse animation
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .touch-active {
        transform: scale(0.95);
    }
    
    .btn-text {
        display: inline;
    }
    
    @media (max-width: 480px) {
        .btn-text {
            display: inline !important;
        }
    }
    
    /* Ensure queue number is white */
    #queuePosition {
        color: white !important;
    }
    
    /* Ensure doctor specialty is white */
    #doctorSpecialty {
        color: white !important;
    }
`;
document.head.appendChild(style);

console.log('✅ doctor-availability.js FULLY LOADED');