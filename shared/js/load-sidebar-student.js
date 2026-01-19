

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
            })
            .catch(error => console.error('Error loading sidebar:', error));  // Error handling kung may mali
    }
});

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
