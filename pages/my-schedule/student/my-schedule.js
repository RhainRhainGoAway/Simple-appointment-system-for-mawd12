// ============================================
// STUDENT MY-SCHEDULE - Fetch from API
// ============================================

// Day-of-week mapping for class schedules
const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5 };

const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const weekdaysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatWeekTitle(view) {
    const start = new Date(view.activeStart);
    const endExclusive = new Date(view.activeEnd);
    const end = new Date(endExclusive);
    end.setDate(end.getDate() - 1);

    return `${monthsShort[start.getMonth()]} ${start.getDate()} - ${monthsShort[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
}

document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('schedule-calendar');
    if (!calendarEl) return;

    if (typeof FullCalendar === 'undefined') {
        calendarEl.innerHTML = '<p class="p-4 text-muted">Calendar failed to load. Check your connection and refresh the page.</p>';
        return;
    }

    try {
        var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        headerToolbar: {
            left: 'prev',
            center: 'title',
            right: 'next'
        },
        firstDay: 1,
        dayHeaderContent: function(arg) {
            const d = arg.date;
            const label = `${weekdaysShort[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
            return { html: `<span>${label}</span>` };
        },
        slotMinTime: '07:00:00',
        slotMaxTime: '20:00:00',
        weekends: false,
        allDaySlot: false,
        height: 'auto',
        contentHeight: 700,
        slotDuration: '01:00:00',
        slotLabelInterval: '01:00',
        slotLabelFormat: { hour: 'numeric', minute: '2-digit', meridiem: 'short' },
        eventTimeFormat: { hour: 'numeric', minute: '2-digit', meridiem: 'short' },
        eventOrder: 'start',
        eventOrderStrict: true,
        events: function(info, successCallback, failureCallback) {
            loadEvents().then(successCallback).catch(function(e) {
                console.error('Error loading events:', e);
                successCallback([]);
            });
        },
        eventContent: function(arg) {
            if (arg.event.extendedProps.type === 'subject') {
                var wrap = document.createElement('div');
                // Use non-fc-* classnames to avoid nesting FullCalendar's own .fc-event-main
                // which can cause the title text to be visually clipped.
                wrap.className = 'subject-card';
                var titleEl = document.createElement('div');
                titleEl.className = 'subject-card__title';
                titleEl.textContent = arg.event.title || '';
                var timeEl = document.createElement('div');
                timeEl.className = 'subject-card__time';
                timeEl.textContent = arg.timeText || '';
                wrap.appendChild(titleEl);
                wrap.appendChild(timeEl);
                return { domNodes: [wrap] };
            }

            const name = arg.event.extendedProps.personName || arg.event.title || '';
            const time = arg.timeText || '';
            const profilePicture = arg.event.extendedProps.personProfilePicture || '';

            const consultWrap = document.createElement('div');
            consultWrap.className = 'consultation-card';

            const avatar = document.createElement(profilePicture ? 'img' : 'div');
            avatar.className = 'consultation-card__avatar';
            if (profilePicture) {
                avatar.src = profilePicture;
                avatar.alt = name;
                avatar.loading = 'lazy';
            } else {
                avatar.textContent = (name || '?').trim().slice(0, 1).toUpperCase();
            }

            const content = document.createElement('div');
            content.className = 'consultation-card__content';

            const nameEl = document.createElement('div');
            nameEl.className = 'consultation-card__name';
            nameEl.textContent = name;

            const timeElConsult = document.createElement('div');
            timeElConsult.className = 'consultation-card__time';
            timeElConsult.textContent = time;

            content.appendChild(nameEl);
            content.appendChild(timeElConsult);
            consultWrap.appendChild(avatar);
            consultWrap.appendChild(content);

            return { domNodes: [consultWrap] };
        },
        eventDidMount: function(info) {
            // Stacked-paper layering: later bookings should appear above earlier ones
            // if visual overlap happens (e.g., due to min-height styling).
            if (info.event.extendedProps.type !== 'consultation') return;
            if (!info.event.start) return;

            const start = info.event.start;
            const end = info.event.end || start;
            const startMinutes = start.getHours() * 60 + start.getMinutes();
            const endMinutes = end.getHours() * 60 + end.getMinutes();
            const durationMinutes = Math.max(0, endMinutes - startMinutes);

            const title = String(info.event.title || '');
            let titleHash = 0;
            for (let i = 0; i < title.length; i++) titleHash = (titleHash + title.charCodeAt(i)) % 50;

            // Earlier start -> lower z. Later start -> higher z.
            const z = 1000 + (startMinutes * 10) + Math.min(99, durationMinutes) + titleHash;

            const harness = info.el.closest('.fc-timegrid-event-harness');

            const setZ = (val) => {
                if (harness) harness.style.setProperty('z-index', String(val), 'important');
                info.el.style.setProperty('z-index', String(val), 'important');
            };

            setZ(z);

            // Ensure hovered card appears above other overlapping bookings.
            info.el.addEventListener('mouseenter', () => setZ(999999));
            info.el.addEventListener('mouseleave', () => setZ(z));
        },
        eventClick: function(info) {
            if (info.event.extendedProps.type === 'consultation') {
                const props = info.event.extendedProps;
                const startDate = info.event.start;
                const endDate = info.event.end;
                const dateOpts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                const timeOpts = { hour: '2-digit', minute: '2-digit' };

                document.getElementById('modalPersonName').textContent = props.personName || info.event.title;
                document.getElementById('modalDate').textContent = startDate.toLocaleDateString([], dateOpts);
                document.getElementById('modalTime').textContent = startDate.toLocaleTimeString([], timeOpts) + ' - ' + endDate.toLocaleTimeString([], timeOpts);
                document.getElementById('modalLocation').textContent = props.location || 'Faculty';
                document.getElementById('modalReason').textContent = props.reason || 'No reason provided';
                document.getElementById('modalNotes').textContent = props.notes || 'No notes';

                new bootstrap.Modal(document.getElementById('consultationModal')).show();
            }
        },
        datesSet: function(dateInfo) {
            const titleEl = calendarEl.querySelector('.fc-toolbar-title');
            if (titleEl) titleEl.textContent = formatWeekTitle(dateInfo.view);

            const months = ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'];
            const date = dateInfo.view.currentStart;
            const monthEl = document.getElementById('currentMonth');
            if (monthEl) {
                monthEl.textContent = months[date.getMonth()] + ' ' + date.getFullYear();
            }
        }
    });

        calendar.render();
    } catch (e) {
        console.error('Error initializing calendar:', e);
        calendarEl.innerHTML = '<p class="p-4 text-muted">Calendar could not be displayed. Check the browser console for details.</p>';
    }
});

async function loadEvents() {
    const events = [];

    // Load class schedules (recurring weekly)
    try {
        const response = await apiCall('/schedules/student');
            if (response && response.ok) {
            const schedules = await response.json();
            // Generate events for a wide date range so they show on any week navigated to
            const baseDate = getMonday(new Date());
            // Generate for 12 weeks before and after current week
            for (let weekOffset = -12; weekOffset <= 12; weekOffset++) {
                schedules.forEach(s => {
                    const dayIndex = dayMap[s.dayOfWeek];
                    if (dayIndex === undefined) return;

                    const eventDate = new Date(baseDate);
                    eventDate.setDate(eventDate.getDate() + (weekOffset * 7) + (dayIndex - 1));
                    const dateStr = toLocalDateStr(eventDate);

                    events.push({
                        title: s.subjectName,
                        start: `${dateStr}T${s.startTime}`,
                        end: `${dateStr}T${s.endTime}`,
                        classNames: ['subject-event'],
                        backgroundColor: '#f8f9fa',
                        textColor: '#374151',
                        borderColor: '#d1d5db',
                        extendedProps: { type: 'subject' }
                    });
                });
            }
        }
    } catch (error) {
        console.error('Error loading class schedules:', error);
    }

    // Load consultation events (accepted and pending appointments)
    try {
        const response = await apiCall('/appointments/student/consultations');
        if (response && response.ok) {
            const consultations = await response.json();

            consultations.forEach(c => {
                const isPending = c.status === 'pending';
                events.push({
                    title: isPending ? `${c.title} (Pending)` : c.title,
                    start: c.start,
                    end: c.end,
                    classNames: [isPending ? 'pending-event' : 'consultation-event'],
                    backgroundColor: isPending ? '#fb923c' : '#facc15',
                    textColor: '#1a1a2e',
                    borderColor: isPending ? '#fb923c' : '#facc15',
                    extendedProps: {
                        type: 'consultation',
                        status: c.status,
                        reason: c.reason,
                        notes: c.notes,
                        location: c.location,
                        personName: isPending ? `${c.personName} (Pending)` : c.personName,
                        personEmail: c.personEmail,
                        personProfilePicture: c.personProfilePicture
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error loading consultations:', error);
    }

    return events;
}

function toLocalDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}
