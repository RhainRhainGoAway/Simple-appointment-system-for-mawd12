// ============================================
// LOCAL DATE FORMATTING (timezone-safe)
// ============================================
function toLocalDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// ============================================
// DATE NAVIGATION VARIABLES
// ============================================

let currentWeekStart = getMonday(new Date());
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Pagination state
let allTeachers = [];
let filteredTeachers = [];
let currentPage = 1;
const rowsPerPage = 4;

const searchInput = document.getElementById('searchInput');

function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    if (day === 0) {
        // Sunday -> next Monday
        d.setDate(d.getDate() + 1);
    } else if (day === 6) {
        // Saturday -> next Monday
        d.setDate(d.getDate() + 2);
    } else {
        // Mon-Fri -> this week's Monday
        d.setDate(d.getDate() - (day - 1));
    }
    d.setHours(0, 0, 0, 0);
    return d;
}

// ============================================
// DATE RANGE UPDATE
// ============================================

function updateDateRange() {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 4);

    const startDay = currentWeekStart.getDate();
    const endDay = weekEnd.getDate();
    const month = months[currentWeekStart.getMonth()];
    const year = currentWeekStart.getFullYear();

    document.getElementById('dateRangeText').textContent = `${startDay}-${endDay} ${month}, ${year}`;
    updateTableHeaders();
}

function updateTableHeaders() {
    const headerCells = document.querySelectorAll('.schedule-table thead th');
    for (let i = 1; i <= 5; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + (i - 1));
        const dayNum = date.getDate();
        const dayName = daysOfWeek[date.getDay()];
        if (headerCells[i]) {
            headerCells[i].textContent = `${dayNum} ${dayName}`;
        }
    }
}

// ============================================
// WEEK NAVIGATION
// ============================================

function previousWeek() {
    const prevWeek = new Date(currentWeekStart);
    prevWeek.setDate(prevWeek.getDate() - 7);
    const earliest = getMonday(new Date());
    if (prevWeek < earliest) return; // Don't go before current week
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    updateDateRange();
    loadTeacherSchedules();
}

function nextWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    updateDateRange();
    loadTeacherSchedules();
}

function goToToday() {
    currentWeekStart = getMonday(new Date());
    updateDateRange();
    loadTeacherSchedules();
}

// ============================================
// FORMAT DATE FOR MODAL
// ============================================

function formatFullDate(weekStart, dayOffset) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayOffset);
    const daysOfWeekFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    return `${daysOfWeekFull[date.getDay()]}, ${monthsFull[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatFullDateFromLocalDateStr(dateStr) {
    const parts = String(dateStr).split('-').map(Number);
    if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) return '';
    const [y, m, d] = parts;
    const date = new Date(y, m - 1, d);
    const daysOfWeekFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    return `${daysOfWeekFull[date.getDay()]}, ${monthsFull[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============================================
// LOAD TEACHER SCHEDULES FROM API
// ============================================

async function loadTeacherSchedules() {
    const tbody = document.getElementById('teacherScheduleBody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Loading...</td></tr>';

    const startDate = toLocalDateStr(currentWeekStart);

    try {
        const response = await apiCall(`/teacheravailability/week?start=${startDate}`);
        if (response && response.ok) {
            allTeachers = await response.json();

            // Safety filter: don't show teachers with no available slots across the week
            allTeachers = (allTeachers || []).filter(t =>
                Array.isArray(t.schedule)
                && t.schedule.some(d => !d.closed && Array.isArray(d.slots) && d.slots.length > 0)
            );

            applySearchFilter();
            currentPage = 1;
            renderTeacherTable();
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Failed to load schedules</td></tr>';
        }
    } catch (error) {
        console.error('Error loading schedules:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Error loading schedules</td></tr>';
    }
}

function applySearchFilter() {
    const query = (searchInput?.value || '').toLowerCase().trim();
    if (!query) {
        filteredTeachers = [...allTeachers];
        return;
    }

    filteredTeachers = (allTeachers || []).filter(t =>
        String(t.teacherName || '').toLowerCase().includes(query)
    );
}

function renderTeacherTable() {
    const tbody = document.getElementById('teacherScheduleBody');
    const totalPages = Math.ceil(filteredTeachers.length / rowsPerPage);
    const start = (currentPage - 1) * rowsPerPage;
    const pageTeachers = filteredTeachers.slice(start, start + rowsPerPage);

    if (pageTeachers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No teacher schedules available</td></tr>';
        document.getElementById('paginationContainer').innerHTML = '';
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tbody.innerHTML = pageTeachers.map(teacher => {
        const dayCells = teacher.schedule.map((day, dayIndex) => {
            // Check if this day is in the past
            const slotDate = new Date(currentWeekStart);
            slotDate.setDate(slotDate.getDate() + dayIndex);
            slotDate.setHours(0, 0, 0, 0);
            const isPast = slotDate < today;
            const bookDateStr = toLocalDateStr(slotDate);

            if (isPast || day.closed) {
                return `<td><div class="slots-container"><button class="time-slot closed">Closed</button></div></td>`;
            }

            if (day.fullyBooked) {
                return `<td><div class="slots-container"><button class="time-slot fully-booked" disabled>Fully Booked</button></div></td>`;
            }

            if (!day.slots || day.slots.length === 0) {
                return `<td><div class="slots-container"><button class="time-slot closed">Closed</button></div></td>`;
            }
            const slotButtons = day.slots.map(slot => {
                const timeRange = `${slot.startTime} - ${slot.endTime}`;
                return `<button class="time-slot" data-teacher-id="${teacher.teacherId}" data-teacher-name="${escapeHtml(teacher.teacherName)}" data-book-date="${bookDateStr}" data-day-index="${dayIndex}" data-time-range="${escapeHtml(timeRange)}">${escapeHtml(timeRange)}</button>`;
            }).join('');
            const hasToggle = day.slots.length >= 3;
            const toggleButton = hasToggle
                ? `<button type="button" class="slot-toggle" aria-label="Toggle slots" aria-expanded="false"><i class='bx bx-chevron-down'></i></button>`
                : '';
            const expandedClass = hasToggle ? '' : ' expanded';
            return `<td><div class="slot-cell"><div class="slots-container${expandedClass}">${slotButtons}</div>${toggleButton}</div></td>`;
        }).join('');

        return `
            <tr>
                <td>
                    <div class="teacher-info">
                        <img src="${teacher.teacherProfilePicture || '../../assets/logo-0.png'}" alt="Teacher" class="teacher-avatar">
                        <div>
                            <p class="teacher-name">${escapeHtml(teacher.teacherName)}</p>
                        </div>
                    </div>
                </td>
                ${dayCells}
            </tr>
        `;
    }).join('');

    // Attach click handlers to time slots
    tbody.querySelectorAll('.time-slot:not(.closed)').forEach(slot => {
        slot.addEventListener('click', function() {
            const teacherName = this.dataset.teacherName;
            const timeRange = this.dataset.timeRange;

            const bookDateStr = this.dataset.bookDate;
            if (!bookDateStr) {
                appAlert('Unable to determine the selected date. Please refresh and try again.', { title: 'Error', variant: 'danger' });
                return;
            }

            const dateText = formatFullDateFromLocalDateStr(bookDateStr) || formatFullDate(currentWeekStart, parseInt(this.dataset.dayIndex));

            // Store teacher ID for booking
            bookingState.teacherId = parseInt(this.dataset.teacherId);

            // Exact local date for API
            bookingState.bookDate = bookDateStr;

            openBookingModal(teacherName, dateText, timeRange);
        });
    });

    tbody.querySelectorAll('.slot-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const cell = toggle.closest('.slot-cell');
            const container = cell?.querySelector('.slots-container');
            if (!container) return;
            const isExpanded = container.classList.toggle('expanded');
            toggle.classList.toggle('expanded', isExpanded);
            toggle.setAttribute('aria-expanded', String(isExpanded));
        });
    });

    // Render pagination
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const container = document.getElementById('paginationContainer');
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    const MAX_VISIBLE_PAGES = 5;
    const maxStart = Math.max(1, totalPages - MAX_VISIBLE_PAGES + 1);
    const startPage = Math.min(Math.max(1, currentPage), maxStart);
    const endPage = Math.min(totalPages, startPage + MAX_VISIBLE_PAGES - 1);

    html += `<button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                <i class='bx bx-chevron-left'></i>
             </button>`;

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }

    html += `<button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class='bx bx-chevron-right'></i>
             </button>`;

    container.innerHTML = html;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredTeachers.length / rowsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTeacherTable();
}

// ============================================
// PAGE INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    updateDateRange();

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applySearchFilter();
            currentPage = 1;
            renderTeacherTable();
        });
    }

    const todayBtn = document.querySelector('.btn-outline-secondary');
    if (todayBtn) {
        todayBtn.addEventListener('click', goToToday);
    }

    // Load booking modal HTML
    fetch('../../components/modals/book.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('booking-modal-container').innerHTML = html;
        });

    // Load teacher schedules from API
    loadTeacherSchedules();
});

