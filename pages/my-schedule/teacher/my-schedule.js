/*
 * MY-SCHEDULE.JS (TEACHER) - Teacher's Personal Schedule View
 * Ito yung JS file para sa "My Schedule" page ng teacher
 * 
 * Main features:
 * 1. FullCalendar Integration - Para i-display yung weekly schedule
 * 2. Subject Events - Mga classes na tinuturo ng teacher
 * 3. Consultation Events - Mga booked consultations with students
 * 
 * Dependencies:
 * - FullCalendar JS library (CDN or local)
 * - FullCalendar CSS
 * 
 * Note: Same structure sa student version, pero iba yung data perspective
 * Sa teacher view, nakikita niya yung appointments niya with students
 * TODO: Fetch events from PHP backend/database
 */

// ============================================
// FULLCALENDAR INITIALIZATION
// ============================================

// DOMContentLoaded - Initialize calendar kapag ready na yung page
document.addEventListener('DOMContentLoaded', function() {
    // Get yung calendar container element
    var calendarEl = document.getElementById('schedule-calendar');
    
    // Check kung may calendar container ba sa page
    if (calendarEl) {
        // Create FullCalendar instance with configuration
        var calendar = new FullCalendar.Calendar(calendarEl, {
            // ============================================
            // CALENDAR VIEW SETTINGS
            // ============================================
            initialView: 'timeGridWeek',     // Weekly view na may time grid
            initialDate: '2025-09-22',       // Starting date (demo date)
            
            // Header toolbar configuration - navigation buttons
            headerToolbar: {
                left: 'prev',                // Previous button sa left
                center: 'title',             // Title sa center
                right: 'next'                // Next button sa right
            },
            
            // ============================================
            // DATE/TIME FORMATTING
            // ============================================
            titleFormat: { weekday: 'short', day: 'numeric' },
            dayHeaderFormat: { weekday: 'short', day: 'numeric' },  // Column headers
            
            // Time slot configuration
            slotMinTime: '07:00:00',          // Start ng visible time (7 AM)
            slotMaxTime: '18:00:00',          // End ng visible time (6 PM)
            weekends: false,                  // Hide weekends
            allDaySlot: false,                // Hindi kailangan ng all-day row
            
            // ============================================
            // SIZING AND APPEARANCE
            // ============================================
            height: 'auto',
            contentHeight: 700,
            slotDuration: '01:00:00',         // 1 hour per slot
            slotLabelInterval: '01:00',
            
            // Time label format (left side)
            slotLabelFormat: {
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short'
            },
            
            // Event time format
            eventTimeFormat: {
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short'
            },
            
            // ============================================
            // EVENTS DATA (HARDCODED FOR DEMO)
            // ============================================
            // TODO: Replace with fetch() call to PHP API
            // Sa teacher view, yung consultation events ay yung students na nag-book
            events: [
                // ===== MONDAY (Sept 22) =====
                {
                    title: 'Filipino sa Piling Larang',
                    start: '2025-09-22T08:00:00',
                    end: '2025-09-22T09:30:00',
                    classNames: ['subject-event'],
                    backgroundColor: '#f8f9fa',
                    textColor: '#374151',
                    borderColor: '#d1d5db'
                },
                // Sa teacher view, ang consultation event ay yung student na nag-book
                {
                    title: 'Ms. Kim Minju',
                    start: '2025-09-22T09:30:00',
                    end: '2025-09-22T09:50:00',
                    classNames: ['consultation-event'],
                    backgroundColor: '#facc15',
                    textColor: '#1a1a2e',
                    borderColor: '#facc15'
                },
                {
                    title: 'Practical Research 2',
                    start: '2025-09-22T10:00:00',
                    end: '2025-09-22T11:30:00',
                    classNames: ['subject-event'],
                    backgroundColor: '#f8f9fa',
                    textColor: '#374151',
                    borderColor: '#d1d5db'
                },
                {
                    title: 'Ms. Jang Wonyoung',
                    start: '2025-09-22T11:40:00',
                    end: '2025-09-22T11:50:00',
                    classNames: ['consultation-event'],
                    backgroundColor: '#facc15',
                    textColor: '#1a1a2e',
                    borderColor: '#facc15'
                },
                {
                    title: 'Personal Development',
                    start: '2025-09-22T12:30:00',
                    end: '2025-09-22T14:00:00',
                    classNames: ['subject-event'],
                    backgroundColor: '#f8f9fa',
                    textColor: '#374151',
                    borderColor: '#d1d5db'
                },
                {
                    title: 'Pagbasa at Pagsusuri ng Iba\'t Ibang Teksto Tungo sa Pananaliksik',
                    start: '2025-09-22T14:00:00',
                    end: '2025-09-22T15:30:00',
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
                    classNames: ['subject-event'],
                    backgroundColor: '#f8f9fa',
                    textColor: '#374151',
                    borderColor: '#d1d5db'
                },
                {
                    title: 'Ms. Jo Yuri',
                    start: '2025-09-23T09:30:00',
                    end: '2025-09-23T09:50:00',
                    classNames: ['consultation-event'],
                    backgroundColor: '#facc15',
                    textColor: '#1a1a2e',
                    borderColor: '#facc15'
                },
                {
                    title: 'Practical Research 2',
                    start: '2025-09-23T10:00:00',
                    end: '2025-09-23T11:30:00',
                    classNames: ['subject-event'],
                    backgroundColor: '#f8f9fa',
                    textColor: '#374151',
                    borderColor: '#d1d5db'
                },
                {
                    title: 'Personal Development',
                    start: '2025-09-23T12:30:00',
                    end: '2025-09-23T14:00:00',
                    classNames: ['subject-event'],
                    backgroundColor: '#f8f9fa',
                    textColor: '#374151',
                    borderColor: '#d1d5db'
                },
                {
                    title: 'Pagbasa at Pagsusuri ng Iba\'t Ibang Teksto Tungo sa Pananaliksik',
                    start: '2025-09-23T14:00:00',
                    end: '2025-09-23T15:30:00',
                    classNames: ['subject-event'],
                    backgroundColor: '#f8f9fa',
                    textColor: '#374151',
                    borderColor: '#d1d5db'
                },
                {
                    title: 'Computer Programming 4',
                    start: '2025-09-23T16:00:00',
                    end: '2025-09-23T17:30:00',
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
                    classNames: ['subject-event'],
                    backgroundColor: '#f8f9fa',
                    textColor: '#374151',
                    borderColor: '#d1d5db'
                },
                {
                    title: 'Physical Education',
                    start: '2025-09-24T10:00:00',
                    end: '2025-09-24T12:00:00',
                    classNames: ['subject-event'],
                    backgroundColor: '#f8f9fa',
                    textColor: '#374151',
                    borderColor: '#d1d5db'
                },
                {
                    title: 'Ms. An Yujin',
                    start: '2025-09-24T12:40:00',
                    end: '2025-09-24T12:50:00',
                    classNames: ['consultation-event'],
                    backgroundColor: '#facc15',
                    textColor: '#1a1a2e',
                    borderColor: '#facc15'
                },
                {
                    title: 'English for Academic and Professional Purposes',
                    start: '2025-09-24T13:00:00',
                    end: '2025-09-24T16:00:00',
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
                    classNames: ['subject-event'],
                    backgroundColor: '#f8f9fa',
                    textColor: '#374151',
                    borderColor: '#d1d5db'
                },
                {
                    title: 'Computer Programming 4',
                    start: '2025-09-25T10:00:00',
                    end: '2025-09-25T11:30:00',
                    classNames: ['subject-event'],
                    backgroundColor: '#f8f9fa',
                    textColor: '#374151',
                    borderColor: '#d1d5db'
                },
                {
                    title: 'Computer Programming 4',
                    start: '2025-09-25T12:30:00',
                    end: '2025-09-25T14:00:00',
                    classNames: ['subject-event'],
                    backgroundColor: '#f8f9fa',
                    textColor: '#374151',
                    borderColor: '#d1d5db'
                },
                {
                    title: 'Computer Programming 5',
                    start: '2025-09-25T14:00:00',
                    end: '2025-09-25T15:30:00',
                    classNames: ['subject-event'],
                    backgroundColor: '#f8f9fa',
                    textColor: '#374151',
                    borderColor: '#d1d5db'
                }
            ],
            eventClick: function(info) {
                if (info.event.classNames.includes('consultation-event')) {
                    alert('Consultation with: ' + info.event.title + '\n' + 
                          'Time: ' + info.event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + ' - ' +
                          info.event.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
                }
            },
            datesSet: function(dateInfo) {
                // Update the month selector text
                const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                                'July', 'August', 'September', 'October', 'November', 'December'];
                const date = dateInfo.view.currentStart;
                document.getElementById('currentMonth').textContent = 
                    months[date.getMonth()] + ' ' + date.getFullYear();
            }
        });
        calendar.render();
    }
});
