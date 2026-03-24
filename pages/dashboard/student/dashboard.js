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
    // Set welcome name
    const userName = localStorage.getItem('userName');
    if (userName) {
        const firstName = userName.split(' ')[0];
        document.getElementById('welcomeName').textContent = firstName;
    }

    loadStats();

    // Keep the right sidebar non-scrollable by:
    // - showing max 3 teachers
    // - reducing history rows based on how many teachers are shown
    (async () => {
        const teacherCount = await loadTeachers();
        await loadHistory(teacherCount);
    })();
});

async function loadStats() {
    try {
        const response = await apiCall('/appointments/student/stats');
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

async function loadTeachers() {
    try {
        const response = await apiCall('/schedules/teachers');
        if (response && response.ok) {
            const teachers = await response.json();
            const container = document.getElementById('teacherList');
            if (teachers.length === 0) {
                container.innerHTML = '<p class="text-muted small">No teachers available</p>';
                return 0;
            }

            const shownTeachers = teachers.slice(0, 3);
            container.innerHTML = shownTeachers.map(t => `
                <div class="teacher-item">
                    <div class="teacher-info">
                        <img src="${t.profilePicture || '/appointment_system/assets/logo-0.png'}" alt="Teacher">
                        <span>${escapeHtml(t.name)}</span>
                    </div>
                    <button class="request-btn" onclick="window.location.href='/appointment_system/pages/book-schedule/book-schedule.html'">Request</button>
                </div>
            `).join('');

            return shownTeachers.length;
        }
    } catch (error) {
        console.error('Error loading teachers:', error);
    }

    return 0;
}

function getHistoryRowLimit(teacherCount) {
    if (teacherCount === 1) return 9;
    if (teacherCount === 2) return 8;
    if (teacherCount >= 3) return 7;
    return 9;
}

async function loadHistory(teacherCount = 0) {
    try {
        const response = await apiCall('/appointments/student/history');
        if (response && response.ok) {
            const history = await response.json();
            const tbody = document.getElementById('historyTableBody');
            if (history.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-muted small">No consultation history yet</td></tr>';
                return;
            }

            const maxRows = getHistoryRowLimit(teacherCount);
            const rows = history.slice(0, maxRows);

            tbody.innerHTML = rows.map(h => `
                <tr>
                    <td>
                        <div class="history-item">
                            <img src="${h.teacherProfilePicture || '/appointment_system/assets/logo-0.png'}" alt="">
                            <span>${escapeHtml(h.teacherName)}</span>
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
