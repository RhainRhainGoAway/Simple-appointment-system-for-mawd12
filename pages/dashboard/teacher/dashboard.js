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
    setupPushSubscription();
    await loadStats();
    await loadNotifications();
    pendingStudentsCount = await loadPendingStudents();
    await loadHistory();
}

function setupPushSubscription() {
    const subscribeFn = (typeof ensurePushSubscribed === 'function') ? ensurePushSubscribed : null;

    if (!subscribeFn) return;
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
        Promise.resolve(subscribeFn()).catch(() => {});
    }
}

async function loadStats() {
    try {
        const response = await apiCall('/appointments/teacher/stats');
        if (response && response.ok) {
            const data = await response.json();
            document.getElementById('pending-count').textContent = data.pending;
            document.getElementById('approved-count').textContent = data.accepted;
            document.getElementById('cancelled-count').textContent = data.cancelled;

            return data;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }

    return null;
}

function getStatusNotificationTextForTeacher(status) {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'accepted') return 'Accepted by teacher';
    if (normalized === 'declined') return 'Declined by teacher';
    if (normalized === 'cancelled') return 'Cancelled';
    return null;
}

async function loadNotifications() {
    const container = document.getElementById('notificationList');
    if (!container) return;

    try {
        const response = await apiCall('/appointments/teacher/all');
        if (!response || !response.ok) {
            container.innerHTML = '<p class="text-muted small">No new notifications</p>';
            return;
        }

        const all = await response.json();
        const recent = (Array.isArray(all) ? all : [])
            .filter(a => {
                const statusText = getStatusNotificationTextForTeacher(a.status);
                return !!statusText;
            })
            .slice(0, 6);

        if (recent.length === 0) {
            container.innerHTML = '<p class="text-muted small">No new notifications</p>';
            return;
        }

        container.innerHTML = recent.map(a => {
            const statusText = getStatusNotificationTextForTeacher(a.status);
            const fullName = `${a.firstName || ''} ${a.lastName || ''}`.trim();
            const who = fullName || 'Student';
            const avatarSrc = a.studentProfilePicture || '/appointment_system/assets/logo-0.png';
            const meta = `${who} • ${a.appointmentDate || ''} • ${a.startTime || ''} - ${a.endTime || ''}`.trim();
            return `
                <div class="notification-item">
                    <img class="notification-avatar" src="${avatarSrc}" alt="Profile">
                    <div>
                        <p class="title">${escapeHtml(statusText || '')}</p>
                        <p class="meta">${escapeHtml(meta)}</p>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading notifications:', error);
        container.innerHTML = '<p class="text-muted small">No new notifications</p>';
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

            tbody.innerHTML = history.map(h => `
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
