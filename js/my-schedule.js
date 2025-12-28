// Initialize My Schedule FullCalendar
document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('schedule-calendar');
    if (calendarEl) {
        var calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridWeek',
            initialDate: '2025-09-22',
            headerToolbar: {
                left: 'prev',
                center: 'title',
                right: 'next'
            },
            titleFormat: { weekday: 'short', day: 'numeric' },
            dayHeaderFormat: { weekday: 'short', day: 'numeric' },
            slotMinTime: '07:00:00',
            slotMaxTime: '18:00:00',
            weekends: false,
            allDaySlot: false,
            height: 'auto',
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
            events: [
                // === MONDAY (Sept 22) ===
                {
                    title: 'Filipino sa Piling Larang',
                    start: '2025-09-22T08:00:00',
                    end: '2025-09-22T09:30:00',
                    classNames: ['subject-event'],
                    backgroundColor: '#f8f9fa',
                    textColor: '#374151',
                    borderColor: '#d1d5db'
                },
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
