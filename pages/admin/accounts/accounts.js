const ROWS_PER_PAGE = 10;

let allAccounts = [];
let filteredAccounts = [];
let currentPage = 1;

const tableBody = document.getElementById('accountsTableBody');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const paginationContainer = document.getElementById('paginationContainer');
const searchInput = document.getElementById('searchInput');
const createTeacherBtn = document.getElementById('createTeacherBtn');

let createTeacherModal = null;
let changePasswordModal = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth(['admin'])) return;

    initModals();
    fetchAccounts();

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applySearchFilter();
            currentPage = 1;
            render();
        });
    }

    if (createTeacherBtn) {
        createTeacherBtn.addEventListener('click', openCreateTeacherModal);
    }

    const createTeacherForm = document.getElementById('createTeacherForm');
    if (createTeacherForm) {
        createTeacherForm.addEventListener('submit', handleCreateTeacher);
    }

    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }
});

function initModals() {
    if (!window.bootstrap || !bootstrap.Modal) return;
    const createEl = document.getElementById('createTeacherModal');
    if (createEl) createTeacherModal = new bootstrap.Modal(createEl);

    const passwordEl = document.getElementById('changePasswordModal');
    if (passwordEl) changePasswordModal = new bootstrap.Modal(passwordEl);
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

function formatRole(role) {
    const r = String(role || '').trim().toLowerCase();
    return r === 'teacher' ? 'Teacher' : 'Student';
}

function getRoleClass(role) {
    const r = String(role || '').trim().toLowerCase();
    return r === 'teacher' ? 'role-badge role-teacher' : 'role-badge role-student';
}

async function fetchAccounts() {
    showLoading(true);

    try {
        const res = await apiCall('/admin/accounts');
        if (!res || !res.ok) throw new Error('Failed to fetch accounts');

        allAccounts = await res.json();
        applySearchFilter();
        currentPage = 1;
        render();
    } catch (e) {
        console.error(e);
        allAccounts = [];
        filteredAccounts = [];
        render();
    } finally {
        showLoading(false);
    }
}

function applySearchFilter() {
    const q = (searchInput?.value || '').toLowerCase().trim();
    if (!q) {
        filteredAccounts = [...allAccounts];
        return;
    }

    filteredAccounts = (allAccounts || []).filter(a =>
        String(a.name || '').toLowerCase().includes(q)
        || String(a.email || '').toLowerCase().includes(q)
        || String(a.role || '').toLowerCase().includes(q)
        || String(a.studentNumber || '').toLowerCase().includes(q)
        || String(a.sectionName || '').toLowerCase().includes(q)
        || String(a.gradeLevel || '').toLowerCase().includes(q)
    );
}

function render() {
    if ((filteredAccounts || []).length === 0) {
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
    const pageRows = filteredAccounts.slice(start, start + ROWS_PER_PAGE);

    tableBody.innerHTML = pageRows.map(a => {
        const roleLabel = formatRole(a.role);
        const roleClass = getRoleClass(a.role);

        return `
            <tr>
                <td>${escapeHtml(a.name)}</td>
                <td><span class="${roleClass}">${roleLabel}</span></td>
                <td>${escapeHtml(a.email)}</td>
                <td>${escapeHtml(a.studentNumber || '-')}</td>
                <td>${escapeHtml(a.sectionName || '-')}</td>
                <td>${escapeHtml(a.gradeLevel || '-')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action" onclick="openPasswordModal(${Number(a.id)})">
                            <i class='bx bx-key'></i>
                            Change Password
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPagination() {
    const totalPages = Math.ceil(filteredAccounts.length / ROWS_PER_PAGE);
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
    const totalPages = Math.ceil(filteredAccounts.length / ROWS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable();
    renderPagination();
}

function openCreateTeacherModal() {
    const form = document.getElementById('createTeacherForm');
    if (form) form.reset();
    if (createTeacherModal) createTeacherModal.show();
}

async function handleCreateTeacher(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;

    if (!name || !email || !password) {
        await appAlert('Please complete all fields.', { title: 'Missing data', variant: 'danger' });
        return;
    }

    const allowedDomain = '@santarosa.sti.edu.ph';
    if (!email.toLowerCase().endsWith(allowedDomain)) {
        await appAlert('Only @santarosa.sti.edu.ph email addresses are allowed.', { title: 'Invalid email', variant: 'danger' });
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';

    try {
        const res = await apiCall('/admin/teachers', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });

        if (!res || !res.ok) {
            let message = 'Failed to create teacher account.';
            try {
                const data = await res.json();
                if (data && data.message) message = data.message;
            } catch {
                // ignore
            }
            throw new Error(message);
        }

        if (createTeacherModal) createTeacherModal.hide();
        form.reset();
        await fetchAccounts();
        await appAlert('Teacher account created successfully.', { title: 'Success', variant: 'primary' });
    } catch (e) {
        console.error(e);
        await appAlert(e.message || 'Failed to create teacher account.', { title: 'Error', variant: 'danger' });
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create';
    }
}

function openPasswordModal(userId) {
    const row = (allAccounts || []).find(a => Number(a.id) === Number(userId));
    if (!row) return;

    const userIdInput = document.getElementById('changePasswordUserId');
    const nameEl = document.getElementById('passwordAccountName');
    const emailEl = document.getElementById('passwordAccountEmail');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    if (userIdInput) userIdInput.value = row.id;
    if (nameEl) nameEl.textContent = row.name || '-';
    if (emailEl) emailEl.textContent = row.email || '-';
    if (newPassword) newPassword.value = '';
    if (confirmPassword) confirmPassword.value = '';

    if (changePasswordModal) changePasswordModal.show();
}

async function handleChangePassword(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    const userId = parseInt(document.getElementById('changePasswordUserId').value, 10);
    const newPassword = form.newPassword.value;
    const confirmPassword = form.confirmPassword.value;

    if (!Number.isFinite(userId)) {
        await appAlert('Invalid account selected.', { title: 'Error', variant: 'danger' });
        return;
    }

    if (!newPassword) {
        await appAlert('Please enter a new password.', { title: 'Missing data', variant: 'danger' });
        return;
    }

    if (newPassword !== confirmPassword) {
        await appAlert('Passwords do not match.', { title: 'Mismatch', variant: 'danger' });
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';

    try {
        const res = await apiCall(`/admin/accounts/${userId}/password`, {
            method: 'PUT',
            body: JSON.stringify({ newPassword })
        });

        if (!res || !res.ok) {
            let message = 'Failed to update password.';
            try {
                const data = await res.json();
                if (data && data.message) message = data.message;
            } catch {
                // ignore
            }
            throw new Error(message);
        }

        if (changePasswordModal) changePasswordModal.hide();
        form.reset();
        await appAlert('Password updated successfully.', { title: 'Success', variant: 'primary' });
    } catch (e) {
        console.error(e);
        await appAlert(e.message || 'Failed to update password.', { title: 'Error', variant: 'danger' });
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Password';
    }
}

window.openPasswordModal = openPasswordModal;
window.goToPage = goToPage;
