const ROWS_PER_PAGE = 10;

let allTeachers = [];
let filteredTeachers = [];
let currentPage = 1;

const tableBody = document.getElementById('teachersTableBody');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const paginationContainer = document.getElementById('paginationContainer');
const searchInput = document.getElementById('searchInput');

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth(['admin'])) return;

    fetchTeachers();

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

async function fetchTeachers() {
    showLoading(true);

    try {
        const res = await apiCall('/admin/teachers');
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
            <td>${Number(t.weeklyConsultedMinutes || 0)} mins</td>
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

    html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                <i class='bx bx-chevron-left'></i>
             </button>`;

    for (let i = 1; i <= totalPages; i++) {
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
