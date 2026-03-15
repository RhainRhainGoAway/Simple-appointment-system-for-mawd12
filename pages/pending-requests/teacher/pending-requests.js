// ============================================
// Pending Requests – Teacher
// ============================================

// ---------- Config ----------
const ROWS_PER_PAGE = 8;

// ---------- State ----------
let allRequests      = [];
let filteredRequests = [];
let currentPage      = 1;

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
    fetchPendingRequests();

    // Search handler
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        filteredRequests = allRequests.filter(row =>
            row.firstName.toLowerCase().includes(query) ||
            row.lastName.toLowerCase().includes(query) ||
            row.sectionName.toLowerCase().includes(query)
        );
        currentPage = 1;
        render();
    });
});

// ============================================
// Fetch pending requests from API
// ============================================
async function fetchPendingRequests() {
    showLoading(true);

    try {
        const response = await apiCall('/appointments/teacher/pending');

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
    const pageData = filteredRequests.slice(start, start + ROWS_PER_PAGE);

    tableBody.innerHTML = pageData.map(row => `
        <tr>
            <td data-label="First Name">${escapeHtml(row.firstName)}</td>
            <td data-label="Last Name">${escapeHtml(row.lastName)}</td>
            <td data-label="Section">${escapeHtml(row.sectionName)}</td>
            <td data-label="Date & Time">${row.appointmentDate} at ${row.startTime} - ${row.endTime}</td>
            <td data-label="Action">
                <div class="action-buttons">
                    <button class="btn-accept" onclick="acceptRequest(${row.id})">Accept</button>
                    <button class="btn-decline" onclick="declineRequest(${row.id})">Decline</button>
                    <button class="btn-view" onclick="openDetailsModal(${row.id})" title="View details">
                        <i class='bx bx-show'></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
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

        fetchPendingRequests();
    } catch (error) {
        console.error('Error accepting appointment:', error);
        alert('Failed to accept appointment. Please try again.');
    }
}

async function declineRequest(id) {
    try {
        const response = await apiCall(`/appointments/${id}/decline`, { method: 'PUT' });

        if (!response || !response.ok) {
            throw new Error('Failed to decline');
        }

        fetchPendingRequests();
    } catch (error) {
        console.error('Error declining appointment:', error);
        alert('Failed to decline appointment. Please try again.');
    }
}

// ============================================
// View details modal
// ============================================
let modalTargetId = null;

function openDetailsModal(id) {
    const row = allRequests.find(r => r.id === id);
    if (!row) return;

    modalTargetId = id;

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
