const ROWS_PER_PAGE = 10;

let allStudents = [];
let filteredStudents = [];
let currentPage = 1;

const tableBody = document.getElementById('studentsTableBody');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const paginationContainer = document.getElementById('paginationContainer');
const searchInput = document.getElementById('searchInput');

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth(['admin'])) return;

    fetchStudents();

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applySearchFilter();
            currentPage = 1;
            render();
        });
    }
});

function showLoading(show) {
    loadingState.style.display = show ? 'block' : 'none';
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function fetchStudents() {
    showLoading(true);

    try {
        const res = await apiCall('/admin/students');
        if (!res || !res.ok) throw new Error('Failed to fetch students');

        allStudents = await res.json();
        applySearchFilter();
        currentPage = 1;
        render();
    } catch (e) {
        console.error(e);
        allStudents = [];
        filteredStudents = [];
        render();
    } finally {
        showLoading(false);
    }
}

function applySearchFilter() {
    const q = (searchInput?.value || '').toLowerCase().trim();
    if (!q) {
        filteredStudents = [...allStudents];
        return;
    }

    filteredStudents = (allStudents || []).filter(s =>
        String(s.name || '').toLowerCase().includes(q)
        || String(s.sectionName || '').toLowerCase().includes(q)
        || String(s.gradeLevel || '').toLowerCase().includes(q)
    );
}

function render() {
    if ((filteredStudents || []).length === 0) {
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
    const pageRows = filteredStudents.slice(start, start + ROWS_PER_PAGE);

    tableBody.innerHTML = pageRows.map(s => `
        <tr>
            <td>${escapeHtml(s.name)}</td>
            <td>${escapeHtml(s.sectionName || '—')}</td>
            <td>${escapeHtml(s.gradeLevel || '—')}</td>
        </tr>
    `).join('');
}

function renderPagination() {
    const totalPages = Math.ceil(filteredStudents.length / ROWS_PER_PAGE);
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
    const totalPages = Math.ceil(filteredStudents.length / ROWS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable();
    renderPagination();
}
