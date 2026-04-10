// Read-only schedule monitor (Admin)

function toLocalDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

let currentWeekStart = getMonday(new Date());
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let allTeachers = [];
let filteredTeachers = [];
let currentPage = 1;
const rowsPerPage = 4;

const searchInput = document.getElementById('searchInput');

function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    if (day === 0) {
        d.setDate(d.getDate() + 1);
    } else if (day === 5) {
        d.setDate(d.getDate() + 3);
    } else if (day === 6) {
        d.setDate(d.getDate() + 2);
    } else {
        d.setDate(d.getDate() - (day - 1));
    }
    d.setHours(0, 0, 0, 0);
    return d;
}

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

function previousWeek() {
    const prevWeek = new Date(currentWeekStart);
    prevWeek.setDate(prevWeek.getDate() - 7);
    const earliest = getMonday(new Date());
    if (prevWeek < earliest) return;
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

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function loadTeacherSchedules() {
    const tbody = document.getElementById('teacherScheduleBody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Loading...</td></tr>';

    const startDate = toLocalDateStr(currentWeekStart);

    try {
        const response = await apiCall(`/admin/teacheravailability/week?start=${startDate}`);
        if (response && response.ok) {
            allTeachers = await response.json();
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

    tbody.innerHTML = pageTeachers.map(teacher => {
        const dayCells = (teacher.schedule || []).map(day => {
            if (day.closed) {
                return `<td><div class="slots-container"><button class="time-slot closed" disabled>Closed</button></div></td>`;
            }

            if (day.fullyBooked) {
                return `<td><div class="slots-container"><button class="time-slot fully-booked" disabled>Fully Booked</button></div></td>`;
            }

            if (!day.slots || day.slots.length === 0) {
                return `<td><div class="slots-container"><button class="time-slot closed" disabled>Closed</button></div></td>`;
            }

            const slotButtons = day.slots.map(slot => {
                const timeRange = `${slot.startTime} - ${slot.endTime}`;
                return `<button class="time-slot" disabled>${escapeHtml(timeRange)}</button>`;
            }).join('');

            return `<td><div class="slots-container">${slotButtons}</div></td>`;
        }).join('');

        return `
            <tr>
                <td>
                    <div class="teacher-info">
                        <img src="${teacher.teacherProfilePicture || '/appointment_system/assets/logo-0.png'}" alt="Teacher" class="teacher-avatar">
                        <div>
                            <p class="teacher-name">${escapeHtml(teacher.teacherName)}</p>
                        </div>
                    </div>
                </td>
                ${dayCells}
            </tr>
        `;
    }).join('');

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const container = document.getElementById('paginationContainer');
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                <i class='bx bx-chevron-left'></i>
             </button>`;

    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }

    html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class='bx bx-chevron-right'></i>
             </button>`;

    container.innerHTML = html;
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredTeachers.length / rowsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTeacherTable();
}

document.addEventListener('DOMContentLoaded', function() {
    if (!requireAuth(['admin'])) return;

    updateDateRange();
    loadTeacherSchedules();

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applySearchFilter();
            currentPage = 1;
            renderTeacherTable();
        });
    }
});
