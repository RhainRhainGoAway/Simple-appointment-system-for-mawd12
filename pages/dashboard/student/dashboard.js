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

    (async () => {
        await loadStats();
        await loadNotifications();
        await loadTeachers();
        await loadHistory();
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

            return data;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }

    return null;
}

function getStatusNotificationTextForStudent(status) {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'accepted') return 'Accepted by teacher';
    if (normalized === 'declined') return 'Declined by teacher';
    if (normalized === 'cancelled') return 'Cancelled by admin';
    return null;
}

async function loadNotifications() {
    const container = document.getElementById('notificationList');
    if (!container) return;

    try {
        const response = await apiCall('/appointments/student/all');
        if (!response || !response.ok) {
            container.innerHTML = '<p class="text-muted small">No new notifications</p>';
            return;
        }

        const all = await response.json();
        const recent = (Array.isArray(all) ? all : [])
            .filter(a => {
                const statusText = getStatusNotificationTextForStudent(a.status);
                return !!statusText;
            })
            .slice(0, 6);

        if (recent.length === 0) {
            container.innerHTML = '<p class="text-muted small">No new notifications</p>';
            return;
        }

        container.innerHTML = recent.map(a => {
            const statusText = getStatusNotificationTextForStudent(a.status);
            const avatarSrc = a.teacherProfilePicture || '/appointment_system/assets/logo-0.png';
            const meta = `${a.teacherName || 'Teacher'} • ${a.appointmentDate || ''} • ${a.startTime || ''} - ${a.endTime || ''}`.trim();
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

async function loadTeachers() {
    try {
        const response = await apiCall('/schedules/teachers');
        if (response && response.ok) {
            const teachers = await response.json();
            const container = document.getElementById('teacherList');
            if (teachers.length === 0) {
                container.innerHTML = '<p class="text-muted small">No teachers available</p>';
                return;
            }

            container.innerHTML = teachers.map(t => `
                <div class="teacher-item">
                    <div class="teacher-info">
                        <img src="${t.profilePicture || '/appointment_system/assets/logo-0.png'}" alt="Teacher">
                        <span>${escapeHtml(t.name)}</span>
                    </div>
                    <button class="request-btn" onclick="window.location.href='/appointment_system/pages/book-schedule/book-schedule.html'">Request</button>
                </div>
            `).join('');

            return;
        }
    } catch (error) {
        console.error('Error loading teachers:', error);
    }
}

async function loadHistory() {
    try {
        const response = await apiCall('/appointments/student/history');
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
