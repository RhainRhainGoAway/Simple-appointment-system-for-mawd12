// ============================================
// Pending Requests – Student
// ============================================

// ---------- Config ----------
const ROWS_PER_PAGE = 8;

// ---------- State ----------
let allRequests = [];
let currentPage  = 1;

// ---------- DOM refs ----------
const tableBody = document.getElementById('pendingTableBody');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const paginationContainer = document.getElementById('paginationContainer');

// ============================================
// Init
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth(['student'])) return;
    fetchRequests();
});

// ============================================
// Fetch all appointments from API
// ============================================
async function fetchRequests() {
    showLoading(true);

    try {
        const response = await apiCall('/appointments/student/all');

        if (!response || !response.ok) {
            throw new Error('Failed to fetch requests');
        }

        allRequests = await response.json();
        currentPage = 1;
        render();
    } catch (error) {
        console.error('Error fetching requests:', error);
        allRequests = [];
        render();
    }
}

// ============================================
// Render table + pagination
// ============================================
function render() {
    showLoading(false);

    if (allRequests.length === 0) {
        tableBody.innerHTML = '';
        emptyState.style.display = 'block';
        paginationContainer.innerHTML = '';
        return;
    }

    emptyState.style.display = 'none';
    renderTable();
    renderPagination();
}

// ---------- Table ----------
function renderTable() {
    const start    = (currentPage - 1) * ROWS_PER_PAGE;
    const pageData = allRequests.slice(start, start + ROWS_PER_PAGE);

    tableBody.innerHTML = pageData.map(row => `
        <tr>
            <td data-label="Teacher">${row.teacherName}</td>
            <td data-label="Subject">${row.reason || '—'}</td>
            <td data-label="Date & Time">${row.appointmentDate} at ${row.startTime} - ${row.endTime}</td>
            <td data-label="Status">
                <span class="status-badge ${row.status}">${row.status}</span>
            </td>
            <td>
                <button class="btn-view" onclick="openDetailsModal(${row.id})" title="View details">
                    <i class='bx bx-show'></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ---------- Pagination ----------
function renderPagination() {
    const totalPages = Math.ceil(allRequests.length / ROWS_PER_PAGE);
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = '';

    // Previous button
    html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                <i class='bx bx-chevron-left'></i>
             </button>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }

    // Next button
    html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class='bx bx-chevron-right'></i>
             </button>`;

    paginationContainer.innerHTML = html;
}

function goToPage(page) {
    const totalPages = Math.ceil(allRequests.length / ROWS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable();
    renderPagination();
}

// ============================================
// View details modal
// ============================================
function openDetailsModal(id) {
    const row = allRequests.find(r => r.id === id);
    if (!row) return;

    const body = document.getElementById('detailsModalBody');
    body.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Teacher</span>
            <span class="detail-value">${row.teacherName}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Email</span>
            <span class="detail-value">${row.teacherEmail}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Subject</span>
            <span class="detail-value">${row.reason || '—'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Date</span>
            <span class="detail-value">${row.appointmentDate}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Time</span>
            <span class="detail-value">${row.startTime} - ${row.endTime}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value"><span class="status-badge ${row.status}">${row.status}</span></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Requested On</span>
            <span class="detail-value">${row.createdAt}</span>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
    modal.show();
}

// ============================================
// Helpers
// ============================================
function showLoading(show) {
    loadingState.style.display = show ? 'block' : 'none';
}
