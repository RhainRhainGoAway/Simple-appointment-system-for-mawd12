// ============================================
// TEACHER MY-SCHEDULE - Consultations only from API
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    var calendarEl = document.getElementById('schedule-calendar');
    if (!calendarEl) return;

    const events = await loadConsultations();

    // Navigate to the nearest future consultation if any exist
    let initialDate = new Date();
    if (events.length > 0) {
        const now = new Date();
        const sorted = [...events].sort((a, b) => new Date(a.start) - new Date(b.start));
        const nearest = sorted.find(e => new Date(e.start) >= now) || sorted[sorted.length - 1];
        initialDate = new Date(nearest.start);
    }

    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        initialDate: initialDate,
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
        slotLabelFormat: { hour: 'numeric', minute: '2-digit', meridiem: 'short' },
        eventTimeFormat: { hour: 'numeric', minute: '2-digit', meridiem: 'short' },
        eventOrder: 'start',
        eventOrderStrict: true,
        events: events,
        eventContent: function(arg) {
            if (arg.event.extendedProps.type !== 'consultation') return;

            const name = arg.event.extendedProps.personName || arg.event.title || '';
            const time = arg.timeText || '';
            const profilePicture = arg.event.extendedProps.personProfilePicture || '';

            const wrap = document.createElement('div');
            wrap.className = 'consultation-card';

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

            const timeEl = document.createElement('div');
            timeEl.className = 'consultation-card__time';
            timeEl.textContent = time;

            content.appendChild(nameEl);
            content.appendChild(timeEl);
            wrap.appendChild(avatar);
            wrap.appendChild(content);

            return { domNodes: [wrap] };
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
});

async function loadConsultations() {
    const events = [];
    try {
        const response = await apiCall('/appointments/teacher/consultations');
        if (response && response.ok) {
            const consultations = await response.json();
            consultations.forEach(c => {
                if (c.status && c.status !== 'accepted') return;
                events.push({
                    title: c.title,
                    start: c.start,
                    end: c.end,
                    classNames: ['consultation-event'],
                    backgroundColor: '#facc15',
                    textColor: '#1a1a2e',
                    borderColor: '#facc15',
                    extendedProps: {
                        type: 'consultation',
                        status: c.status || 'accepted',
                        reason: c.reason,
                        notes: c.notes,
                        location: c.location,
                        personName: c.personName,
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
