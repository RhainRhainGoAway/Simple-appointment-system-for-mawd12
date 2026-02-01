/*
 * CALENDAR.JS - Centralized Calendar Data & Configuration
 * Ito yung shared JS file para sa lahat ng calendar-related functionality
 * 
 * Bakit centralized?
 * - Para isang lugar lang yung source of truth ng schedule data
 * - Hindi na kailangan i-duplicate yung events sa iba't ibang files
 * - Mas madali mag-maintain at mag-update
 * 
 * Main features:
 * 1. Subject Events Data - Mga classes/subjects
 * 2. Consultation Events Data - Mga booked consultations
 * 3. Calendar Configurations - Shared settings for FullCalendar
 * 4. Helper Functions - Utility functions for calendar operations
 * 
 * Dependencies: FullCalendar JS library
 * 
 * Note: Currently hardcoded yung data (demo mode)
 * TODO: Replace with fetch() calls to .NET API
 */

// ============================================
// CENTRALIZED SCHEDULE DATA
// ============================================

/*
 * Subject Events Array - Ito yung lahat ng classes/subjects
 * Each event object contains:
 * - title: Name ng subject
 * - start/end: Date at time ng class (ISO 8601 format)
 * - type: 'subject' para ma-identify kung anong klaseng event
 * - classNames: CSS class para sa styling
 * - backgroundColor/textColor/borderColor: Visual styling
 * 
 * TODO: In production, ito dapat galing sa database through .NET API
 */
const subjectEvents = [
    // ===== MONDAY (Sept 22) =====
    {
        title: 'Filipino sa Piling Larang',
        start: '2025-09-22T08:00:00',
        end: '2025-09-22T09:30:00',
        type: 'subject',
        classNames: ['subject-event'],
        backgroundColor: '#f8f9fa',     // Light gray para sa subjects
        textColor: '#374151',           // Dark gray text
        borderColor: '#d1d5db'
    },
    {
        title: 'Practical Research 2',
        start: '2025-09-22T10:00:00',
        end: '2025-09-22T11:30:00',
        type: 'subject',
        classNames: ['subject-event'],
        backgroundColor: '#f8f9fa',
        textColor: '#374151',
        borderColor: '#d1d5db'
    },
    {
        title: 'Personal Development',
        start: '2025-09-22T12:30:00',
        end: '2025-09-22T14:00:00',
        type: 'subject',
        classNames: ['subject-event'],
        backgroundColor: '#f8f9fa',
        textColor: '#374151',
        borderColor: '#d1d5db'
    },
    {
        title: 'Pagbasa at Pagsusuri ng Iba\'t Ibang Teksto Tungo sa Pananaliksik',
        start: '2025-09-22T14:00:00',
        end: '2025-09-22T15:30:00',
        type: 'subject',
        classNames: ['subject-event'],
        backgroundColor: '#f8f9fa',
        textColor: '#374151',
        borderColor: '#d1d5db'
    },

    // ===== TUESDAY (Sept 23) =====
    {
        title: 'Filipino sa Piling Larang',
        start: '2025-09-23T08:00:00',
        end: '2025-09-23T09:30:00',
        type: 'subject',
        classNames: ['subject-event'],
        backgroundColor: '#f8f9fa',
        textColor: '#374151',
        borderColor: '#d1d5db'
    },
    {
        title: 'Practical Research 2',
        start: '2025-09-23T10:00:00',
        end: '2025-09-23T11:30:00',
        type: 'subject',
        classNames: ['subject-event'],
        backgroundColor: '#f8f9fa',
        textColor: '#374151',
        borderColor: '#d1d5db'
    },
    {
        title: 'Personal Development',
        start: '2025-09-23T12:30:00',
        end: '2025-09-23T14:00:00',
        type: 'subject',
        classNames: ['subject-event'],
        backgroundColor: '#f8f9fa',
        textColor: '#374151',
        borderColor: '#d1d5db'
    },
    {
        title: 'Pagbasa at Pagsusuri ng Iba\'t Ibang Teksto Tungo sa Pananaliksik',
        start: '2025-09-23T14:00:00',
        end: '2025-09-23T15:30:00',
        type: 'subject',
        classNames: ['subject-event'],
        backgroundColor: '#f8f9fa',
        textColor: '#374151',
        borderColor: '#d1d5db'
    },
    {
        title: 'Computer Programming 4',
        start: '2025-09-23T16:00:00',
        end: '2025-09-23T17:30:00',
        type: 'subject',
        classNames: ['subject-event'],
        backgroundColor: '#f8f9fa',
        textColor: '#374151',
        borderColor: '#d1d5db'
    },

    // ===== WEDNESDAY (Sept 24) =====
    {
        title: 'Physical Science',
        start: '2025-09-24T08:00:00',
        end: '2025-09-24T09:30:00',
        type: 'subject',
        classNames: ['subject-event'],
        backgroundColor: '#f8f9fa',
        textColor: '#374151',
        borderColor: '#d1d5db'
    },
    {
        title: 'Physical Education',
        start: '2025-09-24T10:00:00',
        end: '2025-09-24T12:00:00',
        type: 'subject',
        classNames: ['subject-event'],
        backgroundColor: '#f8f9fa',
        textColor: '#374151',
        borderColor: '#d1d5db'
    },
    {
        title: 'English for Academic and Professional Purposes',
        start: '2025-09-24T13:00:00',
        end: '2025-09-24T16:00:00',
        type: 'subject',
        classNames: ['subject-event'],
        backgroundColor: '#f8f9fa',
        textColor: '#374151',
        borderColor: '#d1d5db'
    },

    // ===== THURSDAY (Sept 25) =====
    {
        title: 'Physical Science',
        start: '2025-09-25T08:00:00',
        end: '2025-09-25T09:30:00',
        type: 'subject',
        classNames: ['subject-event'],
        backgroundColor: '#f8f9fa',
        textColor: '#374151',
        borderColor: '#d1d5db'
    },
    {
        title: 'Computer Programming 4',
        start: '2025-09-25T10:00:00',
        end: '2025-09-25T11:30:00',
        type: 'subject',
        classNames: ['subject-event'],
        backgroundColor: '#f8f9fa',
        textColor: '#374151',
        borderColor: '#d1d5db'
    },
    {
        title: 'Computer Programming 4',
        start: '2025-09-25T12:30:00',
        end: '2025-09-25T14:00:00',
        type: 'subject',
        classNames: ['subject-event'],
        backgroundColor: '#f8f9fa',
        textColor: '#374151',
        borderColor: '#d1d5db'
    },
    {
        title: 'Computer Programming 5',
        start: '2025-09-25T14:00:00',
        end: '2025-09-25T15:30:00',
        type: 'subject',
        classNames: ['subject-event'],
        backgroundColor: '#f8f9fa',
        textColor: '#374151',
        borderColor: '#d1d5db'
    }
];

/*
 * Consultation Events Array - Ito yung mga booked consultations
 * Yellow color para madaling makita na iba sila sa regular classes
 * 
 * TODO: Ito dapat dynamic galing sa bookings table sa database
 */
const consultationEvents = [
    {
        title: 'Ms. Kim Minju',
        start: '2025-09-22T09:30:00',
        end: '2025-09-22T09:50:00',
        type: 'consultation',
        classNames: ['consultation-event'],
        backgroundColor: '#facc15',     // Yellow para stand out
        textColor: '#1a1a2e',
        borderColor: '#facc15'
    },
    {
        title: 'Ms. Jang Wonyoung',
        start: '2025-09-22T11:40:00',
        end: '2025-09-22T11:50:00',
        type: 'consultation',
        classNames: ['consultation-event'],
        backgroundColor: '#facc15',
        textColor: '#1a1a2e',
        borderColor: '#facc15'
    },
    {
        title: 'Ms. Jo Yuri',
        start: '2025-09-23T09:30:00',
        end: '2025-09-23T09:50:00',
        type: 'consultation',
        classNames: ['consultation-event'],
        backgroundColor: '#facc15',
        textColor: '#1a1a2e',
        borderColor: '#facc15'
    },
    {
        title: 'Ms. An Yujin',
        start: '2025-09-24T12:40:00',
        end: '2025-09-24T12:50:00',
        type: 'consultation',
        classNames: ['consultation-event'],
        backgroundColor: '#facc15',
        textColor: '#1a1a2e',
        borderColor: '#facc15'
    }
];

// Combine all events using spread operator
// Ginagamit to kapag need i-display lahat sa My Schedule page
const allEvents = [...subjectEvents, ...consultationEvents];

function getConsultationEvents() {
    return consultationEvents;
}

function getAllEvents() {
    return allEvents;
}

/**
 * formatTime() - Format date object to readable time string
 * Helper function para consistent yung time display
 * 
 * @param date - JavaScript Date object
 * @returns string - Formatted time like "10:30 AM"
 */
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ============================================
// CALENDAR CONFIGURATIONS
// ============================================

/*
 * Shared settings para sa lahat ng calendars
 * Para hindi na paulit-ulit i-define yung same settings
 * object spread (...) para ma-inherit ng specific configs
 */
const baseCalendarConfig = {
    initialDate: '2025-09-22',       // Starting date ng calendar
    slotMinTime: '07:00:00',         // Start time (7 AM)
    slotMaxTime: '18:00:00',         // End time (6 PM)
    weekends: false,                  // Hide weekends
    allDaySlot: false,               // No all-day row
    height: 'auto'                   // Auto height
};

/*
 * Dashboard Calendar Config - Para sa dashboard widget
 * Simplified view na consultations lang ang i-display
 */
const dashboardCalendarConfig = {
    ...baseCalendarConfig,           // Inherit base settings
    initialView: 'timeGridWeek',
    headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    slotDuration: '00:30:00',        // 30-minute slots
    slotLabelInterval: '01:00',
    eventDisplay: 'block',
    eventMinHeight: 20,
    events: getConsultationEvents(),  // Consultations lang
    
    // Click handler - redirect to My Schedule page
    eventClick: function(info) {
        window.location.href = '/html/my-schedule.html';
    }
};

/*
 * My Schedule Calendar Config - Full schedule view
 * Shows both subjects and consultations
 */
const myScheduleCalendarConfig = {
    ...baseCalendarConfig,           // Inherit base settings
    initialView: 'timeGridWeek',
    headerToolbar: {
        left: 'prev',
        center: 'title',
        right: 'next'
    },
    titleFormat: { weekday: 'short', day: 'numeric' },
    dayHeaderFormat: { weekday: 'short', day: 'numeric' },
    contentHeight: 700,
    slotDuration: '01:00:00',        // 1-hour slots
    slotLabelInterval: '01:00',
    slotLabelFormat: {
        hour: 'numeric',
        minute: '2-digit',
        meridiem: 'short'
    },
    eventTimeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        meridiem: 'short'
    },
    events: getAllEvents(),           // All events (subjects + consultations)
    
    // Click handler for consultation events
    eventClick: function(info) {
        if (info.event.extendedProps.type === 'consultation') {
            alert('Consultation with: ' + info.event.title + '\n' + 
                'Time: ' + formatTime(info.event.start) + ' - ' + formatTime(info.event.end));
        }
    },
    
    // Handler kapag nagbago yung visible dates
    datesSet: function(dateInfo) {
        // Update month selector text
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
        const date = dateInfo.view.currentStart;
        const monthEl = document.getElementById('currentMonth');
        if (monthEl) {
            monthEl.textContent = months[date.getMonth()] + ' ' + date.getFullYear();
        }
    }
};



// Initialize appropriate calendar based sa page
document.addEventListener('DOMContentLoaded', function() {
    // Check kung may element na id="calendar"
    const dashboardCalendarEl = document.getElementById('calendar');
    if (dashboardCalendarEl) {
        const dashboardCalendar = new FullCalendar.Calendar(dashboardCalendarEl, dashboardCalendarConfig);
        dashboardCalendar.render();
    }

    // Check kung may element na id="schedule-calendar"
    const scheduleCalendarEl = document.getElementById('schedule-calendar');
    if (scheduleCalendarEl) {
        const scheduleCalendar = new FullCalendar.Calendar(scheduleCalendarEl, myScheduleCalendarConfig);
        scheduleCalendar.render();
    }
});




// Add bagong consultation event Para sa future implementation ng real-time updates
function addConsultation(title, start, end) {
    const newEvent = {
        title: title,
        start: start,
        end: end,
        type: 'consultation',
        classNames: ['consultation-event'],
        backgroundColor: '#facc15',
        textColor: '#1a1a2e',
        borderColor: '#facc15'
    };
    consultationEvents.push(newEvent);
    return newEvent;
}


// Remove consultation event by index
function removeConsultation(index) {
    if (index >= 0 && index < consultationEvents.length) {
        return consultationEvents.splice(index, 1);
    }
    return null;
}


// Get total number of consultations para sa dashboard statistics


function getConsultationCount() {
    return consultationEvents.length;
}
