// ============================================
// Pending Requests – Teacher
// ============================================

// ---------- Config ----------
const ROWS_PER_PAGE = 8;

// ---------- State ----------
let allRequests      = [];
let filteredRequests = [];
let currentPage      = 1;

// Sections index (fallback for gradeLevel)
let sectionsById = new Map();

// ---------- DOM refs ----------
const tableBody           = document.getElementById('pendingTableBody');
const emptyState          = document.getElementById('emptyState');
const loadingState        = document.getElementById('loadingState');
const paginationContainer = document.getElementById('paginationContainer');
const searchInput         = document.getElementById('searchInput');

// ============================================
// Init
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth(['teacher'])) return;
    loadSectionsIndex().finally(() => {
        fetchRequests();
    });

    // Search handler
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        filteredRequests = allRequests.filter(row =>
            row.firstName.toLowerCase().includes(query) ||
            row.lastName.toLowerCase().includes(query) ||
            row.sectionName.toLowerCase().includes(query) ||
            (getGradeLevel(row) || '').toLowerCase().includes(query)
        );
        currentPage = 1;
        render();
    });
});

async function loadSectionsIndex() {
    try {
        const res = await apiCall('/sections');
        if (!res || !res.ok) return;
        const sections = await res.json();
        sectionsById = new Map((sections || []).map(s => [s.id, s]));
    } catch {
        // ignore
    }
}

// ============================================
// Fetch all requests (pending + history) from API
// ============================================
async function fetchRequests() {
    showLoading(true);

    try {
        const response = await apiCall('/appointments/teacher/all');

        if (!response || !response.ok) {
            throw new Error('Failed to fetch pending requests');
        }

        allRequests = await response.json();
        filteredRequests = [...allRequests];
        currentPage = 1;
        render();
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        allRequests = [];
        filteredRequests = [];
        render();
    }
}

// ============================================
// Render table + pagination
// ============================================
function render() {
    showLoading(false);

    if (filteredRequests.length === 0) {
        emptyState.style.display = 'none';
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    <i class='bx bx-calendar-x'></i>
                    <p>No pending requests found.</p>
                </td>
            </tr>
        `;
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
    const pageData = filteredRequests.slice(start, start + ROWS_PER_PAGE);

    tableBody.innerHTML = pageData.map(row => `
        <tr>
            <td data-label="First Name">${escapeHtml(row.firstName)}</td>
            <td data-label="Last Name">${escapeHtml(row.lastName)}</td>
            <td data-label="Section">${escapeHtml(row.sectionName)}</td>
            <td data-label="Grade Level">${escapeHtml(getGradeLevel(row) || '—')}</td>
            <td data-label="Date & Time">${row.appointmentDate} at ${row.startTime} - ${row.endTime}</td>
            <td data-label="Status" class="status-cell">
                ${row.status === 'pending' ? `
                    <div class="status-actions">
                        <button class="btn-accept" onclick="acceptRequest(${row.id})">Accept</button>
                        <button class="btn-decline" onclick="declineRequest(${row.id})">Decline</button>
                    </div>
                ` : `
                    <span class="status-badge ${row.status}">${escapeHtml(row.status)}</span>
                `}
            </td>
            <td data-label="Action" class="action-cell">
                <div class="action-buttons">
                    <button class="btn-view" onclick="openDetailsModal(${row.id})" title="View details">
                        <i class='bx bx-show'></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getGradeLevel(row) {
    if (!row) return '';
    if (row.gradeLevel && String(row.gradeLevel).trim() !== '') return row.gradeLevel;
    if (row.grade_level && String(row.grade_level).trim() !== '') return row.grade_level;
    if (row.sectionId != null) {
        const section = sectionsById.get(row.sectionId);
        if (section && section.gradeLevel) return section.gradeLevel;
        if (section && section.grade_level) return section.grade_level;
    }
    return '';
}

// ---------- Pagination ----------
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

// ============================================
// Accept / Decline
// ============================================
async function acceptRequest(id) {
    try {
        const response = await apiCall(`/appointments/${id}/accept`, { method: 'PUT' });

        if (!response || !response.ok) {
            throw new Error('Failed to accept');
        }

        updateRequestStatus(id, 'accepted');
        render();

        // Best-effort refresh from server (keeps UI state if refresh fails)
        fetchRequests().catch(() => {});
    } catch (error) {
        console.error('Error accepting appointment:', error);
        await appAlert('Failed to accept appointment. Please try again.', { title: 'Error', variant: 'danger' });
    }
}

async function declineRequest(id) {
    try {
        const response = await apiCall(`/appointments/${id}/decline`, { method: 'PUT' });

        if (!response || !response.ok) {
            throw new Error('Failed to decline');
        }

        updateRequestStatus(id, 'cancelled');
        render();

        // Best-effort refresh from server (keeps UI state if refresh fails)
        fetchRequests().catch(() => {});
    } catch (error) {
        console.error('Error declining appointment:', error);
        await appAlert('Failed to decline appointment. Please try again.', { title: 'Error', variant: 'danger' });
    }
}

function updateRequestStatus(id, newStatus) {
    const updateRow = (row) => {
        if (row && row.id === id) row.status = newStatus;
        return row;
    };

    allRequests = allRequests.map(updateRow);
    filteredRequests = filteredRequests.map(updateRow);
}

// ============================================
// View details modal
// ============================================
let modalTargetId = null;

function openDetailsModal(id) {
    const row = allRequests.find(r => r.id === id);
    if (!row) return;

    const isPending = row.status === 'pending';
    modalTargetId = isPending ? id : null;

    const modalAcceptBtn = document.getElementById('modalAcceptBtn');
    const modalDeclineBtn = document.getElementById('modalDeclineBtn');
    const modalFooter = document.querySelector('#detailsModal .modal-footer');
    modalAcceptBtn.style.display = isPending ? 'inline-block' : 'none';
    modalDeclineBtn.style.display = isPending ? 'inline-block' : 'none';
    if (modalFooter) modalFooter.style.display = isPending ? 'flex' : 'none';

    // Reason badges — show the reason field as a badge
    const badges = document.getElementById('reasonBadges');
    if (row.reason) {
        badges.innerHTML = `<span class="reason-badge"><i class='bx bx-notepad'></i>${escapeHtml(row.reason)}</span>`;
    } else {
        badges.innerHTML = `<span class="reason-badge"><i class='bx bx-notepad'></i>No reason provided</span>`;
    }

    // Notes
    const notesBox = document.getElementById('notesBox');
    notesBox.textContent = row.notes || 'No notes provided.';

    const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
    modal.show();
}

// Modal Accept / Decline buttons
document.getElementById('modalAcceptBtn').addEventListener('click', async () => {
    if (!modalTargetId) return;
    await acceptRequest(modalTargetId);
    bootstrap.Modal.getInstance(document.getElementById('detailsModal')).hide();
    modalTargetId = null;
});

document.getElementById('modalDeclineBtn').addEventListener('click', async () => {
    if (!modalTargetId) return;
    await declineRequest(modalTargetId);
    bootstrap.Modal.getInstance(document.getElementById('detailsModal')).hide();
    modalTargetId = null;
});

// ============================================
// Helpers
// ============================================
function showLoading(show) {
    loadingState.style.display = show ? 'block' : 'none';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
