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

    const isNewTabIntent = (event, link) => {
        if (!event) return false;
        if (event.metaKey || event.ctrlKey || event.shiftKey) return true;
        if (event.type === 'auxclick' || event.button === 1) return true;
        if (link && link.target && link.target.toLowerCase() === '_blank') return true;
        return false;
    };

    const onNavClick = (event) => {
        const link = event.target && event.target.closest ? event.target.closest('a') : null;
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href || href === '#' || href.startsWith('#') || href.toLowerCase().startsWith('javascript:')) return;
        if (isNewTabIntent(event, link)) return;

        localStorage.setItem('sidebarClosed', true);
    };

    sidebar.addEventListener('click', onNavClick);
    sidebar.addEventListener('auxclick', onNavClick);

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

    const openSidebar = () => {
        if (!sidebar || !sidebar.classList.contains('close')) return;
        sidebar.classList.remove('is-collapsed');
        sidebar.classList.remove('close');
        localStorage.setItem('sidebarClosed', false);
    };

    const closeSidebar = () => {
        if (!sidebar) return;

        if (sidebar.classList.contains('close')) {
            sidebar.classList.add('is-collapsed');
            localStorage.setItem('sidebarClosed', true);
            return;
        }

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
    };

    if (sidebar) {
        sidebar.addEventListener('mouseenter', openSidebar);
        sidebar.addEventListener('mouseleave', () => {
            if (document.hidden || !document.hasFocus()) return;
            closeSidebar();
        });
    }

    if (toggle && sidebar) {
        toggle.addEventListener('click', () => {
            if (sidebar.classList.contains('close')) {
                openSidebar();
            } else {
                closeSidebar();
            }
        });
    }
}

function restoreSidebarState() {
    const sidebar = document.querySelector(".sidebar");

    // Default behavior: always start CLOSED on every page load.
    // This ensures first login is closed and navigating between pages collapses it.
    if (sidebar) {
        sidebar.classList.add('no-transition');
        sidebar.classList.add('close');
        sidebar.classList.add('is-collapsed');
        localStorage.setItem('sidebarClosed', true);

        requestAnimationFrame(() => {
            sidebar.classList.remove('no-transition');
        });
    }
}
