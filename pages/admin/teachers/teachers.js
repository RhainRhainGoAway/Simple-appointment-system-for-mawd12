const ROWS_PER_PAGE = 10;

let allTeachers = [];
let filteredTeachers = [];
let currentPage = 1;

const tableBody = document.getElementById('teachersTableBody');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const paginationContainer = document.getElementById('paginationContainer');
const searchInput = document.getElementById('searchInput');

const dateRangeText = document.getElementById('dateRangeText');
const nextWeekBtn = document.getElementById('nextWeekBtn');

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
let currentWeekStart = getMonday(new Date());

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth(['admin'])) return;

    updateDateRange();
    fetchTeachers();

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applySearchFilter();
            currentPage = 1;
            render();
        });
    }
});

function toLocalDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

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

function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

function updateNavState() {
    if (!nextWeekBtn) return;
    const maxWeekStart = getMonday(new Date());
    nextWeekBtn.disabled = sameDay(currentWeekStart, maxWeekStart);
}

function updateDateRange() {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 4);

    const startDay = currentWeekStart.getDate();
    const endDay = weekEnd.getDate();
    const month = months[currentWeekStart.getMonth()];
    const year = currentWeekStart.getFullYear();

    if (dateRangeText) {
        dateRangeText.textContent = `${startDay}-${endDay} ${month}, ${year}`;
    }

    updateNavState();
}

function previousWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    updateDateRange();
    fetchTeachers();
}

function nextWeek() {
    const maxWeekStart = getMonday(new Date());

    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);

    currentWeekStart = next > maxWeekStart ? maxWeekStart : next;

    updateDateRange();
    fetchTeachers();
}

function goToToday() {
    currentWeekStart = getMonday(new Date());
    updateDateRange();
    fetchTeachers();
}

function showLoading(show) {
    loadingState.style.display = show ? 'block' : 'none';
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function numMins(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function openDetailsModal(teacherId) {
    const row = (allTeachers || []).find(t => Number(t.id) === Number(teacherId));
    if (!row) return;

    const d = row.dailyConsultedMinutes || {};
    const mon = numMins(d.monday);
    const tue = numMins(d.tuesday);
    const wed = numMins(d.wednesday);
    const thu = numMins(d.thursday);
    const fri = numMins(d.friday);

    const body = document.getElementById('detailsModalBody');
    if (!body) return;

    body.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Teacher</span>
            <span class="detail-value">${escapeHtml(row.name)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Monday</span>
            <span class="detail-value">${mon} mins</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Tuesday</span>
            <span class="detail-value">${tue} mins</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Wednesday</span>
            <span class="detail-value">${wed} mins</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Thursday</span>
            <span class="detail-value">${thu} mins</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Friday</span>
            <span class="detail-value">${fri} mins</span>
        </div>
    `;

    if (!window.bootstrap || !bootstrap.Modal) return;
    const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
    modal.show();
}

async function fetchTeachers() {
    showLoading(true);

    try {
        const startDate = toLocalDateStr(currentWeekStart);
        const res = await apiCall(`/admin/teachers?start=${encodeURIComponent(startDate)}`);
        if (!res || !res.ok) throw new Error('Failed to fetch teachers');

        allTeachers = await res.json();
        applySearchFilter();
        currentPage = 1;
        render();
    } catch (e) {
        console.error(e);
        allTeachers = [];
        filteredTeachers = [];
        render();
    } finally {
        showLoading(false);
    }
}

function applySearchFilter() {
    const q = (searchInput?.value || '').toLowerCase().trim();
    if (!q) {
        filteredTeachers = [...allTeachers];
        return;
    }

    filteredTeachers = (allTeachers || []).filter(t =>
        String(t.name || '').toLowerCase().includes(q)
        || String(t.email || '').toLowerCase().includes(q)
    );
}

function render() {
    if ((filteredTeachers || []).length === 0) {
        tableBody.innerHTML = '';
        emptyState.style.display = 'block';
        paginationContainer.innerHTML = '';
        return;
    }

    emptyState.style.display = 'none';
    renderTable();
    renderPagination();
}

function renderTable() {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const pageRows = filteredTeachers.slice(start, start + ROWS_PER_PAGE);

    tableBody.innerHTML = pageRows.map(t => `
        <tr>
            <td>${escapeHtml(t.name)}</td>
            <td>${escapeHtml(t.email)}</td>
            <td>
                <div class="d-flex align-items-center justify-content-between gap-2">
                    <span>${numMins(t.weeklyConsultedMinutes)} mins</span>
                    <button class="btn-view" onclick="openDetailsModal(${Number(t.id)})" title="View details">
                        <i class='bx bx-show'></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderPagination() {
    const totalPages = Math.ceil(filteredTeachers.length / ROWS_PER_PAGE);
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = '';

    const MAX_VISIBLE_PAGES = 5;
    const maxStart = Math.max(1, totalPages - MAX_VISIBLE_PAGES + 1);
    const startPage = Math.min(Math.max(1, currentPage), maxStart);
    const endPage = Math.min(totalPages, startPage + MAX_VISIBLE_PAGES - 1);

    html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                <i class='bx bx-chevron-left'></i>
             </button>`;

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }

    html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class='bx bx-chevron-right'></i>
             </button>`;

    paginationContainer.innerHTML = html;
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredTeachers.length / ROWS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable();
    renderPagination();
}
