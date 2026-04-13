/*
 * LOAD-SIDEBAR-TEACHER.JS - Dynamic Sidebar Loader for Teacher Pages
 * Ito yung JS file na naglo-load ng sidebar dynamically para sa teacher pages
 * 
 * Bakit dynamic loading?
 * - Para hindi na kailangan i-copy paste yung sidebar HTML sa every page
 * - Mas madali mag-maintain kasi isang file lang babaguhin mo
 * - Cleaner code at mas organized yung project structure
 * 
 * Note: Same logic to sa student version, pero iba lang yung HTML file na loload
 * Dependencies: sidebar-teacher.html sa components/sidebar folder
 */

// ============================================
// SIDEBAR LOADING ON PAGE LOAD
// ============================================

// DOMContentLoaded event - wait muna na fully loaded yung HTML bago mag-execute
document.addEventListener('DOMContentLoaded', function() {
    // Hanapin yung container kung saan ilalagay yung sidebar
    const sidebarContainer = document.getElementById('sidebar-container');
    
    // Check muna kung may container ba talaga (para hindi mag-error)
    if (sidebarContainer) {
        // Fetch API - modern way para mag-request ng data/files
        // Kinukuha natin yung HTML content ng teacher sidebar file
        fetch('/appointment_system/components/sidebar/sidebar-teacher.html')
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
 * initSidebarToggle() - Initialize yung sidebar open/close functionality
 * Kapag clinick yung toggle button (hamburger icon), mag-oopen or close yung sidebar
 * Ginagamit to para sa responsive design at space management
 */
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
        sidebar.classList.add('no-transition');
        sidebar.classList.add('close');
        sidebar.classList.add('is-collapsed');
        localStorage.setItem('sidebarClosed', true);

        requestAnimationFrame(() => {
            sidebar.classList.remove('no-transition');
        });
    }
}
