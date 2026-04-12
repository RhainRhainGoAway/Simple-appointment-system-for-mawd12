

// ============================================
// SIDEBAR LOADING ON PAGE LOAD
// ============================================

// DOMContentLoaded event - wait muna na fully loaded yung HTML bago mag-execute
document.addEventListener('DOMContentLoaded', function() {
    // Hanapin yung container kung saan ilalagay yung sidebar
    const sidebarContainer = document.getElementById('sidebar-container');
    
    // Check muna kung may container ba talaga 
    if (sidebarContainer) {
        // Fetch API - modern way para mag-request ng data/files
        // Kinukuha natin yung HTML content ng sidebar file
        fetch('/appointment_system/components/sidebar/sidebar-student.html')
            .then(response => response.text())    // Convert response to text (HTML)
            .then(html => {
                // Ilagay yung HTML content sa sidebar container
                sidebarContainer.innerHTML = html;
                
                // After ma-load yung sidebar, initialize yung toggle functionality
                initSidebarToggle();
                
                // Restore yung previous state ng sidebar (open or closed)
                restoreSidebarState();

                // Close sidebar kapag nag-navigate sa ibang page
                initSidebarCloseOnNavigation();
            })
            .catch(error => console.error('Error loading sidebar:', error));  // Error handling kung may mali
    }
});

// ============================================
// CLOSE SIDEBAR ON NAVIGATION
// ============================================

/**
 * Kapag nag-click ng link sa sidebar (navigating to another page),
 * auto-close natin yung sidebar and i-save sa localStorage.
 */
function initSidebarCloseOnNavigation() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const closeSidebarSmooth = () => {
        // If already closed, ensure final collapsed layout.
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

    const isNewTabIntent = (event, link) => {
        if (!event) return false;
        if (event.metaKey || event.ctrlKey || event.shiftKey) return true; // Cmd/Ctrl/Shift click
        if (event.type === 'auxclick' || event.button === 1) return true; // middle click
        if (link && link.target && link.target.toLowerCase() === '_blank') return true;
        return false;
    };

    const onNavClick = (event) => {
        const link = event.target && event.target.closest ? event.target.closest('a') : null;
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href || href === '#' || href.startsWith('#') || href.toLowerCase().startsWith('javascript:')) return;
        if (isNewTabIntent(event, link)) return;

        closeSidebarSmooth();
    };

    sidebar.addEventListener('click', onNavClick);
    // Support middle click opening in new tab
    sidebar.addEventListener('auxclick', onNavClick);

    // Kapag nag-leave ng page (kahit back/forward or manual URL),
    // i-set natin sa closed para closed ulit sa next page.
    window.addEventListener('pagehide', () => {
        localStorage.setItem('sidebarClosed', true);
    });
}

// ============================================
// SIDEBAR TOGGLE FUNCTIONALITY
// ============================================

/**
 * Initialize yung sidebar open/close functionality
 * Kapag clinick yung toggle button , mag-oopen or close yung sidebar
 * Ginagamit to para sa responsive design at space management
 */
function initSidebarToggle() {
    const body = document.querySelector("body");
    const sidebar = body.querySelector(".sidebar");
    const toggle = body.querySelector(".toggle");

    const openSidebar = () => {
        if (!sidebar || !sidebar.classList.contains('close')) return;
        // Remove centered tile layout first so content doesn't slide while expanding
        sidebar.classList.remove('is-collapsed');
        sidebar.classList.remove('close');
        localStorage.setItem('sidebarClosed', false);
    };

    const closeSidebar = () => {
        if (!sidebar) return;

        // If already closed, just ensure we're in the final collapsed layout.
        if (sidebar.classList.contains('close')) {
            sidebar.classList.add('is-collapsed');
            localStorage.setItem('sidebarClosed', true);
            return;
        }

        sidebar.classList.add('close');
        localStorage.setItem('sidebarClosed', true);

        // After the width transition completes, switch to centered 50x50 tiles
        const onTransitionEnd = (event) => {
            if (event.propertyName !== 'width') return;
            sidebar.removeEventListener('transitionend', onTransitionEnd);
            if (sidebar.classList.contains('close')) {
                sidebar.classList.add('is-collapsed');
            }
        };

        sidebar.addEventListener('transitionend', onTransitionEnd);
    };

    // Hover behavior: expand on hover, collapse when mouse leaves.
    // Keeps the sidebar "hands-free" so you don't have to click constantly.
    if (sidebar) {
        sidebar.addEventListener('mouseenter', openSidebar);
        sidebar.addEventListener('mouseleave', () => {
            // Switching browser tabs/windows can fire mouseleave; don't collapse in that case.
            if (document.hidden || !document.hasFocus()) return;
            closeSidebar();
        });
    }

    // Check kung may toggle button at sidebar (para safe)
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

// ============================================
// SIDEBAR STATE PERSISTENCE
// ============================================

/**
 * restoreSidebarState() - Restore yung previous state ng sidebar
 * Ginagamit ang localStorage para i-remember kung open o close ba yung sidebar
 * 
 * localStorage - browser storage na persistent kahit i-close yung browser
 * Perfect for storing user preferences like sidebar state
 */
function restoreSidebarState() {
    const sidebar = document.querySelector(".sidebar");

    // Default behavior: always start CLOSED on every page load.
    // Para closed sa first login at kahit mag-switch ng pages, nagsasara ulit.
    if (sidebar) {
        // Apply initial closed state without animating width.
        sidebar.classList.add('no-transition');
        sidebar.classList.add('close');
        sidebar.classList.add('is-collapsed');
        localStorage.setItem('sidebarClosed', true);

        requestAnimationFrame(() => {
            sidebar.classList.remove('no-transition');
        });
    }
}
