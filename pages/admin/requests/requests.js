const ROWS_PER_PAGE = 8;

let allRequests = [];
let filteredRequests = [];
let currentPage = 1;

const tableBody = document.getElementById('requestsTableBody');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const paginationContainer = document.getElementById('paginationContainer');
const searchInput = document.getElementById('searchInput');

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth(['admin'])) return;
    fetchRequests();

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

async function fetchRequests() {
    showLoading(true);

    try {
        const res = await apiCall('/admin/appointments');
        if (!res || !res.ok) throw new Error('Failed to fetch requests');

        allRequests = await res.json();
        applySearchFilter();
        currentPage = 1;
        render();
    } catch (e) {
        console.error(e);
        allRequests = [];
        filteredRequests = [];
        render();
    } finally {
        showLoading(false);
    }
}

function applySearchFilter() {
    const q = (searchInput?.value || '').toLowerCase().trim();
    if (!q) {
        filteredRequests = [...allRequests];
        return;
    }

    filteredRequests = (allRequests || []).filter(r =>
        String(r.studentName || '').toLowerCase().includes(q)
        || String(r.teacherName || '').toLowerCase().includes(q)
        || String(r.sectionName || '').toLowerCase().includes(q)
        || String(r.gradeLevel || '').toLowerCase().includes(q)
        || String(r.status || '').toLowerCase().includes(q)
        || String(r.reason || '').toLowerCase().includes(q)
    );
}

function render() {
    if (filteredRequests.length === 0) {
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
    const pageData = filteredRequests.slice(start, start + ROWS_PER_PAGE);

    tableBody.innerHTML = pageData.map(row => `
        <tr>
            <td data-label="Student">${escapeHtml(row.studentName)}</td>
            <td data-label="Section">${escapeHtml(row.sectionName || '—')}</td>
            <td data-label="Grade Level">${escapeHtml(row.gradeLevel || '—')}</td>
            <td data-label="Teacher">${escapeHtml(row.teacherName)}</td>
            <td data-label="Date & Time">${escapeHtml(row.appointmentDate)} at ${escapeHtml(row.startTime)} - ${escapeHtml(row.endTime)}</td>
            <td data-label="Status"><span class="status-badge ${escapeHtml(row.status)}">${escapeHtml(row.status)}</span></td>
            <td>
                <div class="action-buttons">
                    ${row.status === 'accepted' ? `
                        <button class="btn-cancel" onclick="cancelMeeting(${row.id})" title="Cancel meeting">
                            <i class='bx bx-x-circle'></i>
                        </button>
                    ` : ''}
                    <button class="btn-view" onclick="openDetailsModal(${row.id})" title="View details">
                        <i class='bx bx-show'></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function cancelMeeting(id) {
    const row = allRequests.find(r => r.id === id);
    if (!row) return;

    if (row.status !== 'accepted') {
        await appAlert('Only accepted meetings can be cancelled.', { title: 'Notice', variant: 'primary' });
        return;
    }

    const ok = await appConfirm(
        `Cancel this meeting?\n\nStudent: ${row.studentName}\nTeacher: ${row.teacherName}\nWhen: ${row.appointmentDate} ${row.startTime}-${row.endTime}`,
        { title: 'Cancel meeting', variant: 'danger', okText: 'Cancel meeting', cancelText: 'Keep it' }
    );
    if (!ok) return;

    try {
        const res = await apiCall(`/admin/appointments/${id}/cancel`, { method: 'PUT' });
        if (!res || !res.ok) {
            let message = 'Failed to cancel meeting.';
            try {
                const data = await res.json();
                if (data && data.message) message = data.message;
            } catch {
                // ignore
            }
            throw new Error(message);
        }

        // Update local state
        const updateRow = (r) => {
            if (r && r.id === id) return { ...r, status: 'cancelled' };
            return r;
        };
        allRequests = (allRequests || []).map(updateRow);

        applySearchFilter();
        const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ROWS_PER_PAGE));
        currentPage = Math.min(currentPage, totalPages);
        render();

        await appAlert('Meeting cancelled successfully.', { title: 'Success', variant: 'primary' });
    } catch (e) {
        console.error(e);
        await appAlert(e.message || 'Failed to cancel meeting. Please try again.', { title: 'Error', variant: 'danger' });
    }
}

function renderPagination() {
    const totalPages = Math.ceil(filteredRequests.length / ROWS_PER_PAGE);
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
    const totalPages = Math.ceil(filteredRequests.length / ROWS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable();
    renderPagination();
}

function openDetailsModal(id) {
    const row = allRequests.find(r => r.id === id);
    if (!row) return;

    const body = document.getElementById('detailsModalBody');
    body.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Student</span>
            <span class="detail-value">${escapeHtml(row.studentName)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Section</span>
            <span class="detail-value">${escapeHtml(row.sectionName || '—')}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Grade Level</span>
            <span class="detail-value">${escapeHtml(row.gradeLevel || '—')}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Teacher</span>
            <span class="detail-value">${escapeHtml(row.teacherName)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Date</span>
            <span class="detail-value">${escapeHtml(row.appointmentDate)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Time</span>
            <span class="detail-value">${escapeHtml(row.startTime)} - ${escapeHtml(row.endTime)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value"><span class="status-badge ${escapeHtml(row.status)}">${escapeHtml(row.status)}</span></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Reason</span>
            <span class="detail-value">${escapeHtml(row.reason || '—')}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Notes</span>
            <span class="detail-value">${escapeHtml(row.notes || '—')}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Location</span>
            <span class="detail-value">${escapeHtml(row.location || '—')}</span>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
    modal.show();
}
