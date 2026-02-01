/*
 * BOOK.JS - Booking Modal JavaScript Functionality
 * Ito yung JS file para sa consultation booking modal
 * 
 * Main features:
 * 1. Generate Time Slots - I-create yung available time slots based sa duration
 * 2. Time Parsing/Formatting - Convert time strings to usable format
 * 3. Booking Confirmation - I-handle yung booking submission
 * 
 * Note: Currently, yung booking ay console.log lang (demo mode)
 * Kailangan pa ng .NET API backend para i-save sa database
 */

// ============================================
// BOOKING STATE OBJECT
// ============================================

// Ito yung object na nag-sstore ng lahat ng booking information
// Central storage para sa booking data - mas organized kesa scattered variables
let bookingState = {
    teacherName: '',       // Pangalan ng teacher na bibisitahin
    date: '',              // Date ng consultation
    timeRange: '',         // Available time range ng teacher (e.g., "9:00 AM - 12:00 PM")
    startTime: '',         // Parsed start time
    endTime: '',           // Parsed end time
    selectedSlot: null,    // Yung napili na specific time slot
    meetingTime: 10,       // Duration ng meeting in minutes (default: 10 mins)
    reason: '',            // Reason for consultation
    notes: '',             // Additional notes
    bookedSlots: []        // Array ng mga slots na booked na (para hindi madoble)
};

// ============================================
// TIME SLOT GENERATION
// ============================================

/**
 * generateTimeSlots() - Gumawa ng available time slots based sa meeting duration
 * 
 * Logic:
 * 1. Parse yung start at end time ng teacher's availability
 * 2. Loop through at gumawa ng slots based sa duration
 * 3. Add 5-minute buffer between slots (para may pahinga)
 * 4. Check kung booked na ba yung slot o hindi
 * 
 * Example: If teacher available 9:00-12:00 and duration is 10 mins,
 * Slots: 9:00-9:10, 9:15-9:25, 9:30-9:40, etc.
 */
function generateTimeSlots() {
    const container = document.getElementById('timeSlotsContainer');
    if (!container) return;
    
    // Clear existing slots first
    container.innerHTML = '';
    
    // Parse yung start at end times to [hour, minute] array
    const [startHour, startMin] = parseTime(bookingState.startTime);
    const [endHour, endMin] = parseTime(bookingState.endTime);
    
    // Convert to total minutes para madaling mag-calculate
    // Example: 9:30 AM = (9 * 60) + 30 = 570 total minutes
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    const duration = bookingState.meetingTime;
    
    let currentTotalMin = startTotalMin;
    
    // Loop para gumawa ng slots hanggang hindi pa lumagpas sa end time
    while (currentTotalMin + duration <= endTotalMin) {
        // Calculate yung start at end ng current slot
        const slotStartHour = Math.floor(currentTotalMin / 60);
        const slotStartMin = currentTotalMin % 60;
        const slotEndTotalMin = currentTotalMin + duration;
        const slotEndHour = Math.floor(slotEndTotalMin / 60);
        const slotEndMin = slotEndTotalMin % 60;
        
        // Format back to readable time strings
        const slotStart = formatTime(slotStartHour, slotStartMin);
        const slotEnd = formatTime(slotEndHour, slotEndMin);
        const slotId = `${slotStart}-${slotEnd}`;
        
        // Check kung booked na ba yung slot
        const isBooked = bookingState.bookedSlots.includes(slotId);
        
        // Create yung slot element
        const slotElement = document.createElement('div');
        slotElement.className = `time-slot-option ${isBooked ? 'booked' : ''}`;
        slotElement.dataset.slot = slotId;
        slotElement.dataset.start = slotStart;
        slotElement.dataset.end = slotEnd;
        
        // HTML content ng slot
        slotElement.innerHTML = `
            <span class="time-range">${slotStart} - ${slotEnd}</span>
            <span class="status ${isBooked ? 'booked' : 'available'}">${isBooked ? 'Booked' : 'Available'}</span>
        `;
        
        // Kung available pa, lagyan ng click handler
        if (!isBooked) {
            slotElement.addEventListener('click', function() {
                selectTimeSlot(this);
            });
        }
        
        container.appendChild(slotElement);
        
        // Move to next slot - add duration + 5 min buffer between slots
        currentTotalMin += duration + 5;
    }
    
    // Clear any previous selection when regenerating
    bookingState.selectedSlot = null;
    document.querySelectorAll('.time-slot-option').forEach(slot => {
        slot.classList.remove('selected');
    });
}

// ============================================
// TIME PARSING HELPER FUNCTION
// ============================================

/**
 * parseTime() - Convert time string (e.g., "10:30 AM") to [hour, minute] array
 * Ginagamit regex para i-extract yung parts ng time
 * 
 * @param timeStr - Time string like "10:30 AM" or "2:00 PM"
 * @returns array - [hour in 24h format, minutes]
 * 
 * Example: "2:30 PM" returns [14, 30]
 */
function parseTime(timeStr) {
    // Regex breakdown:
    // (\d+) - capture yung hour (one or more digits)
    // : - literal colon
    // (\d+) - capture yung minutes
    // \s* - optional whitespace
    // (AM|PM)? - optional AM/PM indicator
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return [0, 0];  // Default kung hindi ma-parse
    
    let hour = parseInt(match[1]);
    const min = parseInt(match[2]);
    const period = match[3];
    
    // Convert 12-hour format to 24-hour format
    if (period) {
        if (period.toUpperCase() === 'PM' && hour !== 12) {
            hour += 12;  // 2 PM = 14:00
        } else if (period.toUpperCase() === 'AM' && hour === 12) {
            hour = 0;    // 12 AM = 00:00 (midnight)
        }
    }
    
    return [hour, min];
}

// Format hours and minutes to time string
// ============================================
// TIME FORMATTING HELPER FUNCTION
// ============================================

/**
 * formatTime() - Convert hour and minutes to readable time string
 * Output format: "10:30" (without AM/PM for simplicity)
 * 
 * @param hour - Hour in 24-hour format (0-23)
 * @param min - Minutes (0-59)
 * @returns string - Formatted time like "10:30"
 */
function formatTime(hour, min) {
    // Determine AM or PM
    const period = hour >= 12 ? 'PM' : 'AM';
    
    // Convert 24-hour to 12-hour format
    // 0 -> 12, 13 -> 1, 14 -> 2, etc.
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    
    // Pad minutes with leading zero kung kailangan (e.g., "5" -> "05")
    const displayMin = min.toString().padStart(2, '0');
    
    return `${displayHour}:${displayMin}`;
}

// ============================================
// TIME SLOT SELECTION
// ============================================

/**
 * selectTimeSlot() - Handler kapag nag-click sa isang time slot
 * Highlights yung selected slot at updates yung bookingState
 * 
 * @param element - Yung DOM element ng slot na clinick
 */
function selectTimeSlot(element) {
    // Una, tanggalin muna yung selection sa lahat ng slots
    document.querySelectorAll('.time-slot-option').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Add 'selected' class sa clicked slot
    element.classList.add('selected');
    
    // Update yung bookingState with selected slot info
    bookingState.selectedSlot = {
        start: element.dataset.start,
        end: element.dataset.end
    };
}

// ============================================
// MEETING TIME SELECTION
// ============================================

/**
 * selectMeetingTime() - Handler kapag nag-change ng meeting duration
 * Updates the UI and regenerates time slots
 * 
 * @param minutes - Bagong duration in minutes (e.g., 10, 20, 30)
 */
function selectMeetingTime(minutes) {
    bookingState.meetingTime = minutes;
    
    // Update yung display text
    document.getElementById('selectedMeetingTime').textContent = `${minutes} Minutes`;
    
    // Regenerate time slots based sa bagong duration
    // Kasi magkakaiba yung number ng available slots depende sa duration
    generateTimeSlots();
}

// ============================================
// REASON SELECTION
// ============================================

/**
 * selectReason() - Handler kapag nag-select ng consultation reason
 * Para i-track kung anong purpose ng consultation
 * 
 * @param element - Yung reason button na clinick
 */
function selectReason(element) {
    // Remove selection from all reason buttons
    document.querySelectorAll('.reason-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Highlight yung clicked reason
    element.classList.add('selected');
    
    // Store sa bookingState
    bookingState.reason = element.dataset.reason;
}

// ============================================
// OPEN BOOKING MODAL
// ============================================

/**
 * openBookingModal() - Function para i-open at i-populate yung booking modal
 * Called kapag nag-click yung user sa isang available time slot sa schedule table
 * 
 * @param teacherName - Pangalan ng teacher
 * @param date - Formatted date string
 * @param timeRange - Available time range (e.g., "9:00 AM - 12:00 PM")
 */
function openBookingModal(teacherName, date, timeRange) {
    // Store basic info sa bookingState
    bookingState.teacherName = teacherName;
    bookingState.date = date;
    bookingState.timeRange = timeRange;
    
    // Reset previous selections
    bookingState.selectedSlot = null;
    bookingState.reason = '';
    bookingState.notes = '';
    bookingState.meetingTime = 10;  // Reset to default 10 minutes
    
    // Parse yung time range to get start and end times
    // Example: "9:00 AM - 12:00 PM" -> startTime = "9:00 AM", endTime = "12:00 PM"
    const [startTime, endTime] = timeRange.split(' - ');
    bookingState.startTime = startTime.trim();
    bookingState.endTime = endTime.trim();
    
    // Example booked slots (sa real app, galing to sa server/database)
    // TODO: Fetch from .NET API kung ano na yung booked slots
    bookingState.bookedSlots = ['10:00-10:10'];
    
    // Update modal content with teacher info
    document.getElementById('modalTeacherName').textContent = teacherName;
    document.getElementById('modalDateTime').textContent = `${date} | ${timeRange}`;
    
    // Generate yung available time slots
    generateTimeSlots();
    
    // Reset form elements
    document.querySelectorAll('.reason-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('bookingNotes').value = '';
    document.getElementById('selectedMeetingTime').textContent = '10 Minutes';
    
    // Show modal using Bootstrap Modal API
    const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
    modal.show();
}

// ============================================
// CONFIRM BOOKING
// ============================================

/**
 * confirmBooking() - Handler para sa final booking confirmation
 * Validates yung form at sends booking data (currently console.log lang)
 * 
 * TODO: Implement actual AJAX request to .NET API para ma-save sa database
 */
function confirmBooking() {
    // Get notes from textarea
    bookingState.notes = document.getElementById('bookingNotes').value;
    
    // Validation - dapat may selected time slot
    if (!bookingState.selectedSlot) {
        alert('Please select a time slot.');
        return;
    }
    
    // Validation - dapat may selected reason
    if (!bookingState.reason) {
        alert('Please select a reason for consultation.');
        return;
    }
    
    // TODO: AJAX request to save booking sa database
    // apiCall('/appointments', { method: 'POST', body: JSON.stringify(bookingState) })
    
    // Success message (simple alert for now)
    // TODO: Gawing mas magandang success modal or toast notification
    alert(`Booking confirmed!\n\nTeacher: ${bookingState.teacherName}\nTime: ${bookingState.selectedSlot.start} - ${bookingState.selectedSlot.end}\nDuration: ${bookingState.meetingTime} minutes\nReason: ${bookingState.reason}`);
    
    // Close yung modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
    modal.hide();
}

// ============================================
// INITIALIZATION
// ============================================

// DOMContentLoaded - load yung booking modal HTML kung hindi pa present
document.addEventListener('DOMContentLoaded', function() {
    // Check kung may booking modal na sa page
    if (!document.getElementById('bookingModal')) {
        // Fetch yung modal HTML at i-append sa body
        // Dynamic loading para hindi kailangan i-paste sa every page
        fetch('../../components/modals/book.html')
            .then(response => response.text())
            .then(html => {
                const container = document.createElement('div');
                container.innerHTML = html;
                document.body.appendChild(container);
            });
    }
});
