// ============================================
// SIDEBAR LOADING ON PAGE LOAD (ADMIN)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const sidebarContainer = document.getElementById('sidebar-container');

    if (sidebarContainer) {
        fetch('/appointment_system/components/sidebar/sidebar-admin.html')
            .then(response => response.text())
            .then(html => {
                sidebarContainer.innerHTML = html;
                initSidebarToggle();
                restoreSidebarState();
                initSidebarCloseOnNavigation();
            })
            .catch(error => console.error('Error loading admin sidebar:', error));
    }
});

function initSidebarCloseOnNavigation() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    sidebar.addEventListener('click', (event) => {
        const link = event.target && event.target.closest ? event.target.closest('a') : null;
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href || href === '#' || href.startsWith('#') || href.toLowerCase().startsWith('javascript:')) return;
        if (link.target && link.target.toLowerCase() === '_blank') return;

        sidebar.classList.add('close');
        sidebar.classList.add('is-collapsed');
        localStorage.setItem('sidebarClosed', true);
    });

    // If navigation happens outside the sidebar links (back/forward, address bar, etc.),
    // make sure the next page still starts with the sidebar closed.
    window.addEventListener('pagehide', () => {
        localStorage.setItem('sidebarClosed', true);
    });
}

function initSidebarToggle() {
    const body = document.querySelector("body");
    const sidebar = body.querySelector(".sidebar");
    const toggle = body.querySelector(".toggle");

    if (toggle && sidebar) {
        toggle.addEventListener('click', () => {
            const isCurrentlyClosed = sidebar.classList.contains('close');

            // OPENING
            if (isCurrentlyClosed) {
                sidebar.classList.remove('is-collapsed');
                sidebar.classList.remove('close');
                localStorage.setItem('sidebarClosed', false);
                return;
            }

            // CLOSING
            sidebar.classList.add('close');
            localStorage.setItem('sidebarClosed', true);

            const onTransitionEnd = (event) => {
                if (event.propertyName !== 'width') return;
                sidebar.removeEventListener('transitionend', onTransitionEnd);
                if (sidebar.classList.contains('close')) {
                    sidebar.classList.add('is-collapsed');
                }
            };

            sidebar.addEventListener('transitionend', onTransitionEnd);
        });
    }
}

function restoreSidebarState() {
    const sidebar = document.querySelector(".sidebar");

    // Default behavior: always start CLOSED on every page load.
    // This ensures first login is closed and navigating between pages collapses it.
    if (sidebar) {
        sidebar.classList.add('close');
        sidebar.classList.add('is-collapsed');
        localStorage.setItem('sidebarClosed', true);
    }
}
