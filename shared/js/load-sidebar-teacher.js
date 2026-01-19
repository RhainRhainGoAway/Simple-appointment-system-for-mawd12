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
            })
            .catch(error => console.error('Error loading sidebar:', error));  // Error handling kung may mali
    }
});

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

    // Check kung may toggle button at sidebar (para safe)
    if (toggle && sidebar) {
        toggle.addEventListener('click', () => {
            // Toggle yung 'close' class sa sidebar
            sidebar.classList.toggle('close');
            
            // Save yung current state sa localStorage para ma-remember
            // Kahit mag-refresh yung page, nandun pa rin yung preference ng user
            const isClosed = sidebar.classList.contains('close');
            localStorage.setItem('sidebarClosed', isClosed);
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
    
    // Kunin yung saved state galing localStorage
    const sidebarClosed = localStorage.getItem('sidebarClosed');
    
    // Apply yung state sa sidebar
    if (sidebar && sidebarClosed === 'true') {
        sidebar.classList.add('close');     // Closed state
    } else if (sidebar) {
        sidebar.classList.remove('close');  // Open state
    }
}
