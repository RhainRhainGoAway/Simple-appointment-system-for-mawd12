/**
 * Calendar.js - Centralized Calendar Data & Initialization
 * This file contains all schedule data (subjects + consultations)
 * and initializes calendars for both dashboard and my-schedule pages.
 */

// ============================================
// CENTRALIZED SCHEDULE DATA
// ============================================

// Subject Events (Classes)
const subjectEvents = [
    // === MONDAY (Sept 22) ===
    {
        title: 'Filipino sa Piling Larang',
        start: '2025-09-22T08:00:00',
        end: '2025-09-22T09:30:00',
        type: 'subject',
        classNames: ['subject-event'],
        backgroundColor: '#f8f9fa',
        textColor: '#374151',
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

    // === TUESDAY (Sept 23) ===
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

    // === WEDNESDAY (Sept 24) ===
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

    // === THURSDAY (Sept 25) ===
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

// Consultation Events (Appointments)
const consultationEvents = [
    {
        title: 'Ms. Kim Minju',
        start: '2025-09-22T09:30:00',
        end: '2025-09-22T09:50:00',
        type: 'consultation',
        classNames: ['consultation-event'],
        backgroundColor: '#facc15',
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

// Combined events (subjects + consultations)
const allEvents = [...subjectEvents, ...consultationEvents];

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get only consultation events (for dashboard)
function getConsultationEvents() {
    return consultationEvents;
}

// Get all events (for my-schedule)
function getAllEvents() {
    return allEvents;
}

// Format time for display
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ============================================
// CALENDAR CONFIGURATIONS
// ============================================

// Shared/base configuration
const baseCalendarConfig = {
    initialDate: '2025-09-22',
    slotMinTime: '07:00:00',
    slotMaxTime: '18:00:00',
    weekends: false,
    allDaySlot: false,
    height: 'auto'
};

// Dashboard calendar configuration
const dashboardCalendarConfig = {
    ...baseCalendarConfig,
    initialView: 'timeGridWeek',
    headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    slotDuration: '00:30:00',
    slotLabelInterval: '01:00',
    eventDisplay: 'block',
    eventMinHeight: 20,
    events: getConsultationEvents(),
    eventClick: function(info) {
        // Redirect to My Schedule page when clicking an event
        window.location.href = '/html/my-schedule.html';
    }
};

// My Schedule calendar configuration
const myScheduleCalendarConfig = {
    ...baseCalendarConfig,
    initialView: 'timeGridWeek',
    headerToolbar: {
        left: 'prev',
        center: 'title',
        right: 'next'
    },
    titleFormat: { weekday: 'short', day: 'numeric' },
    dayHeaderFormat: { weekday: 'short', day: 'numeric' },
    contentHeight: 700,
    slotDuration: '01:00:00',
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
    events: getAllEvents(),
    eventClick: function(info) {
        if (info.event.extendedProps.type === 'consultation') {
            alert('Consultation with: ' + info.event.title + '\n' + 
                  'Time: ' + formatTime(info.event.start) + ' - ' + formatTime(info.event.end));
        }
    },
    datesSet: function(dateInfo) {
        // Update the month selector text
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
        const date = dateInfo.view.currentStart;
        const monthEl = document.getElementById('currentMonth');
        if (monthEl) {
            monthEl.textContent = months[date.getMonth()] + ' ' + date.getFullYear();
        }
    }
};

// ============================================
// CALENDAR INITIALIZATION
// ============================================

// Initialize calendar based on which element exists on the page
document.addEventListener('DOMContentLoaded', function() {
    // Dashboard calendar (id="calendar")
    const dashboardCalendarEl = document.getElementById('calendar');
    if (dashboardCalendarEl) {
        const dashboardCalendar = new FullCalendar.Calendar(dashboardCalendarEl, dashboardCalendarConfig);
        dashboardCalendar.render();
    }

    // My Schedule calendar (id="schedule-calendar")
    const scheduleCalendarEl = document.getElementById('schedule-calendar');
    if (scheduleCalendarEl) {
        const scheduleCalendar = new FullCalendar.Calendar(scheduleCalendarEl, myScheduleCalendarConfig);
        scheduleCalendar.render();
    }
});

// ============================================
// EVENT MANAGEMENT (for future use)
// ============================================

// Add a new consultation event
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

// Remove a consultation by index
function removeConsultation(index) {
    if (index >= 0 && index < consultationEvents.length) {
        return consultationEvents.splice(index, 1);
    }
    return null;
}

// Get consultation count (for dashboard stats)
function getConsultationCount() {
    return consultationEvents.length;
}
