// ============================================
// PROFILE MENU FUNCTIONALITY
// ============================================

function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    menu.classList.toggle('show');
}

document.addEventListener('click', function(e) {
    const dropdown = document.querySelector('.profile-dropdown');
    const menu = document.getElementById('profileMenu');
    if (dropdown && !dropdown.contains(e.target)) {
        menu.classList.remove('show');
    }
});

// ============================================
// RIGHT SIDEBAR FUNCTIONALITY (MOBILE)
// ============================================

function toggleRightSidebar() {
    const rightSidebar = document.getElementById('rightSidebar');
    rightSidebar.classList.toggle('open');
}

document.addEventListener('click', function(e) {
    const rightSidebar = document.getElementById('rightSidebar');
    const toggleBtn = document.querySelector('.right-sidebar-toggle');
    if (window.innerWidth <= 992) {
        if (rightSidebar && toggleBtn && !rightSidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
            rightSidebar.classList.remove('open');
        }
    }
});

// ============================================
// DASHBOARD DATA LOADING
// ============================================

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', function() {
    const userName = localStorage.getItem('userName');
    if (userName) {
        const firstName = userName.split(' ')[0];
        document.getElementById('welcomeName').textContent = firstName;
    }

    initDashboard();
});

let pendingStudentsCount = 0;

async function initDashboard() {
    await loadStats();
    pendingStudentsCount = await loadPendingStudents();
    await loadHistory();
}

async function loadStats() {
    try {
        const response = await apiCall('/appointments/teacher/stats');
        if (response && response.ok) {
            const data = await response.json();
            document.getElementById('pending-count').textContent = data.pending;
            document.getElementById('approved-count').textContent = data.accepted;
            document.getElementById('cancelled-count').textContent = data.cancelled;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadPendingStudents() {
    try {
        const response = await apiCall('/schedules/teacher-pending-students');
        if (response && response.ok) {
            const students = await response.json();
            const container = document.getElementById('pendingStudentsList');
            if (students.length === 0) {
                container.innerHTML = '<p class="text-muted small">No pending requests</p>';
                return 0;
            }
            container.innerHTML = students.map(s => `
                <div class="teacher-item">
                    <div class="teacher-info">
                        <img src="${s.profilePicture || '/appointment_system/assets/logo-0.png'}" alt="Student">
                        <span>${escapeHtml(s.name)}</span>
                    </div>
                    <button class="request-btn" onclick="window.location.href='/appointment_system/pages/pending-requests/teacher/pending-requests.html'">View</button>
                </div>
            `).join('');

            return students.length;
        }
    } catch (error) {
        console.error('Error loading pending students:', error);
    }

    return 0;
}

async function loadHistory() {
    try {
        const response = await apiCall('/appointments/teacher/history');
        if (response && response.ok) {
            const history = await response.json();
            const tbody = document.getElementById('historyTableBody');
            if (history.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-muted small">No consultation history yet</td></tr>';
                return;
            }

            // Keep sidebar from needing scroll: show fewer rows when there are pending requests.
            const MAX_HISTORY_ROWS = pendingStudentsCount >= 3 ? 6 : (pendingStudentsCount >= 1 ? 8 : 10);
            const rows = history.slice(0, MAX_HISTORY_ROWS);

            tbody.innerHTML = rows.map(h => `
                <tr>
                    <td>
                        <div class="history-item">
                            <img src="${h.studentProfilePicture || '/appointment_system/assets/logo-0.png'}" alt="">
                            <span>${escapeHtml(h.studentName)}</span>
                        </div>
                    </td>
                    <td>${escapeHtml(h.appointmentDate)}</td>
                    <td>${escapeHtml(h.startTime)} - ${escapeHtml(h.endTime)}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
}
