// ============================================
// CALENDAR.JS - Dashboard Calendar (fetches from API)
// ============================================

const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5 };

function getAppBasePath() {
    // Works when hosted at http://localhost/appointment_system/... (XAMPP)
    // and when hosted at domain root (e.g. /pages/...).
    const p = window.location.pathname || '';
    return p.includes('/appointment_system/') ? '/appointment_system' : '';
}

document.addEventListener('DOMContentLoaded', async function() {
    const dashboardCalendarEl = document.getElementById('calendar');
    if (!dashboardCalendarEl) return;

    const role = localStorage.getItem('userRole');
    const events = await loadDashboardEvents(role);

    const initialDate = getInitialDateForRole(role);

    const calendar = new FullCalendar.Calendar(dashboardCalendarEl, {
        initialView: 'timeGridWeek',
        initialDate: initialDate,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        firstDay: 1,
        slotMinTime: '07:00:00',
        slotMaxTime: '20:00:00',
        weekends: false,
        allDaySlot: false,
        height: 'auto',
        slotDuration: '00:30:00',
        slotLabelInterval: '01:00',
        eventDisplay: 'block',
        eventMinHeight: 20,
        eventOrder: 'start',
        eventOrderStrict: true,
        events: events,
        eventContent: function(arg) {
            // Only apply the custom layout in time-grid views.
            if (!String(arg.view?.type || '').startsWith('timeGrid')) return true;

            // Subject events: same DOM as My Schedule so CSS vertically centers time + title
            if (arg.event.extendedProps.type === 'subject') {
                const wrap = document.createElement('div');
                // Use non-fc-* classnames to avoid nesting FullCalendar's own .fc-event-main
                // which can cause the title text to be visually clipped.
                wrap.className = 'subject-card';
                const titleEl = document.createElement('div');
                titleEl.className = 'subject-card__title';
                titleEl.textContent = arg.event.title || '';
                const timeEl = document.createElement('div');
                timeEl.className = 'subject-card__time';
                timeEl.textContent = arg.timeText || '';
                wrap.appendChild(titleEl);
                wrap.appendChild(timeEl);
                return { domNodes: [wrap] };
            }

            if (arg.event.extendedProps.type !== 'consultation') return true;

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
            if (!String(info.view?.type || '').startsWith('timeGrid')) return;
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

            // Base stacking (prevents overlap issues between bookings)
            setZ(z);

            // Hover stacking (must be above *all* others; CSS can't override inline !important)
            info.el.addEventListener('mouseenter', () => setZ(999999));
            info.el.addEventListener('mouseleave', () => setZ(z));
        },
        eventClick: function(info) {
            // Keep class schedule blocks static.
            if (info.event.extendedProps.type === 'subject') return;

            const base = getAppBasePath();
            const schedulePath = role === 'teacher'
                ? `${base}/pages/my-schedule/teacher/my-schedule.html`
                : `${base}/pages/my-schedule/student/my-schedule.html`;
            window.location.href = schedulePath;
        },
        dateClick: function() {
            const base = getAppBasePath();
            const schedulePath = role === 'teacher'
                ? `${base}/pages/my-schedule/teacher/my-schedule.html`
                : `${base}/pages/my-schedule/student/my-schedule.html`;
            window.location.href = schedulePath;
        }
    });

    calendar.render();
});

async function loadDashboardEvents(role) {
    const events = [];

    // For students, load class schedules as recurring events
    if (role === 'student') {
        try {
            const res = await apiCall('/schedules/student');
                if (res && res.ok) {
                const schedules = await res.json();
                const baseDate = getMonday(new Date());
                for (let weekOffset = -4; weekOffset <= 4; weekOffset++) {
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
        } catch (e) {
            console.error('Error loading class schedules:', e);
        }
    }

    // Load consultations based on role
    const endpoint = role === 'teacher'
        ? '/appointments/teacher/consultations'
        : '/appointments/student/consultations';

    try {
        const res = await apiCall(endpoint);
        if (res && res.ok) {
            const consultations = await res.json();

            consultations.forEach(c => {
                if (role === 'teacher' && c.status && c.status !== 'accepted') return;
                const isPending = c.status === 'pending';
                const personName = isPending
                    ? `${(c.personName || c.title || '').trim()} (Pending)`
                    : (c.personName || c.title);
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
                        personName: personName,
                        personEmail: c.personEmail,
                        personProfilePicture: c.personProfilePicture
                    }
                });
            });
        }
    } catch (e) {
        console.error('Error loading consultations:', e);
    }

    return events;
}

function getInitialDateForRole(role) {
    const d = new Date();
    const day = d.getDay();

    // For teachers, if it's weekend, jump to next Monday so the week view shows upcoming school days.
    if (role === 'teacher') {
        if (day === 6) d.setDate(d.getDate() + 2); // Sat -> Mon
        if (day === 0) d.setDate(d.getDate() + 1); // Sun -> Mon
    }

    d.setHours(0, 0, 0, 0);
    return d;
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
