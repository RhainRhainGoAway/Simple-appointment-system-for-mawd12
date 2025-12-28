// ============================================
// BOOK.JS - Booking Modal Functionality
// ============================================

// Booking state
let bookingState = {
    teacherName: '',
    date: '',
    timeRange: '',
    startTime: '',
    endTime: '',
    selectedSlot: null,
    meetingTime: 10,
    reason: '',
    notes: '',
    bookedSlots: []
};

// Generate time slots based on meeting duration
function generateTimeSlots() {
    const container = document.getElementById('timeSlotsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Parse start and end times
    const [startHour, startMin] = parseTime(bookingState.startTime);
    const [endHour, endMin] = parseTime(bookingState.endTime);
    
    // Convert to total minutes for easier calculation
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    const duration = bookingState.meetingTime;
    
    let currentTotalMin = startTotalMin;
    
    while (currentTotalMin + duration <= endTotalMin) {
        const slotStartHour = Math.floor(currentTotalMin / 60);
        const slotStartMin = currentTotalMin % 60;
        const slotEndTotalMin = currentTotalMin + duration;
        const slotEndHour = Math.floor(slotEndTotalMin / 60);
        const slotEndMin = slotEndTotalMin % 60;
        
        const slotStart = formatTime(slotStartHour, slotStartMin);
        const slotEnd = formatTime(slotEndHour, slotEndMin);
        const slotId = `${slotStart}-${slotEnd}`;
        const isBooked = bookingState.bookedSlots.includes(slotId);
        
        const slotElement = document.createElement('div');
        slotElement.className = `time-slot-option ${isBooked ? 'booked' : ''}`;
        slotElement.dataset.slot = slotId;
        slotElement.dataset.start = slotStart;
        slotElement.dataset.end = slotEnd;
        
        slotElement.innerHTML = `
            <span class="time-range">${slotStart} - ${slotEnd}</span>
            <span class="status ${isBooked ? 'booked' : 'available'}">${isBooked ? 'Booked' : 'Available'}</span>
        `;
        
        if (!isBooked) {
            slotElement.addEventListener('click', function() {
                selectTimeSlot(this);
            });
        }
        
        container.appendChild(slotElement);
        
        // Move to next slot (duration + 5 min buffer between bookings)
        currentTotalMin += duration + 5;
    }
    
    // Clear selected slot when regenerating
    bookingState.selectedSlot = null;
    document.querySelectorAll('.time-slot-option').forEach(slot => {
        slot.classList.remove('selected');
    });
}

// Parse time string (e.g., "10:30 AM") to hours and minutes
function parseTime(timeStr) {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return [0, 0];
    
    let hour = parseInt(match[1]);
    const min = parseInt(match[2]);
    const period = match[3];
    
    if (period) {
        if (period.toUpperCase() === 'PM' && hour !== 12) {
            hour += 12;
        } else if (period.toUpperCase() === 'AM' && hour === 12) {
            hour = 0;
        }
    }
    
    return [hour, min];
}

// Format hours and minutes to time string
function formatTime(hour, min) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    const displayMin = min.toString().padStart(2, '0');
    return `${displayHour}:${displayMin}`;
}

// Select a time slot
function selectTimeSlot(element) {
    // Remove selection from all slots
    document.querySelectorAll('.time-slot-option').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Select clicked slot
    element.classList.add('selected');
    bookingState.selectedSlot = {
        start: element.dataset.start,
        end: element.dataset.end
    };
}

// Select meeting time
function selectMeetingTime(minutes) {
    bookingState.meetingTime = minutes;
    document.getElementById('selectedMeetingTime').textContent = `${minutes} Minutes`;
    
    // Regenerate time slots based on new meeting duration
    generateTimeSlots();
}

// Select reason
function selectReason(element) {
    // Remove selection from all reason buttons
    document.querySelectorAll('.reason-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Select clicked reason
    element.classList.add('selected');
    bookingState.reason = element.dataset.reason;
}

// Open booking modal
function openBookingModal(teacherName, date, timeRange) {
    bookingState.teacherName = teacherName;
    bookingState.date = date;
    bookingState.timeRange = timeRange;
    bookingState.selectedSlot = null;
    bookingState.reason = '';
    bookingState.notes = '';
    bookingState.meetingTime = 10;
    
    // Parse the time range and store it
    const [startTime, endTime] = timeRange.split(' - ');
    bookingState.startTime = startTime.trim();
    bookingState.endTime = endTime.trim();
    
    // Example booked slots (in real app, this would come from server)
    bookingState.bookedSlots = ['10:00-10:10'];
    
    // Update modal content
    document.getElementById('modalTeacherName').textContent = teacherName;
    document.getElementById('modalDateTime').textContent = `${date} | ${timeRange}`;
    
    // Generate time slots
    generateTimeSlots();
    
    // Reset form
    document.querySelectorAll('.reason-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('bookingNotes').value = '';
    document.getElementById('selectedMeetingTime').textContent = '10 Minutes';
    
    // Show modal using Bootstrap
    const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
    modal.show();
}

// Confirm booking
function confirmBooking() {
    bookingState.notes = document.getElementById('bookingNotes').value;
    
    if (!bookingState.selectedSlot) {
        alert('Please select a time slot.');
        return;
    }
    
    if (!bookingState.reason) {
        alert('Please select a reason for consultation.');
        return;
    }
    
    // Here you would typically send this to a server
    console.log('Booking confirmed:', bookingState);
    
    alert(`Booking confirmed!\n\nTeacher: ${bookingState.teacherName}\nTime: ${bookingState.selectedSlot.start} - ${bookingState.selectedSlot.end}\nDuration: ${bookingState.meetingTime} minutes\nReason: ${bookingState.reason}`);
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
    modal.hide();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Load the booking modal HTML if not already present
    if (!document.getElementById('bookingModal')) {
        fetch('/html/book.html')
            .then(response => response.text())
            .then(html => {
                const container = document.createElement('div');
                container.innerHTML = html;
                document.body.appendChild(container);
            });
    }
});
