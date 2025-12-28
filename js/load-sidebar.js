// Load sidebar dynamically into any page
document.addEventListener('DOMContentLoaded', function() {
    const sidebarContainer = document.getElementById('sidebar-container');
    
    if (sidebarContainer) {
        fetch('/html/sidebar-partial.html')
            .then(response => response.text())
            .then(html => {
                sidebarContainer.innerHTML = html;
                // Initialize sidebar toggle functionality
                initSidebarToggle();
                // Restore sidebar state from localStorage
                restoreSidebarState();
            })
            .catch(error => console.error('Error loading sidebar:', error));
    }
});

function initSidebarToggle() {
    const body = document.querySelector("body");
    const sidebar = body.querySelector(".sidebar");
    const toggle = body.querySelector(".toggle");

    if (toggle && sidebar) {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('close');
            // Save the state to localStorage
            const isClosed = sidebar.classList.contains('close');
            localStorage.setItem('sidebarClosed', isClosed);
        });
    }
}

function restoreSidebarState() {
    const sidebar = document.querySelector(".sidebar");
    const sidebarClosed = localStorage.getItem('sidebarClosed');
    
    if (sidebar && sidebarClosed === 'true') {
        sidebar.classList.add('close');
    } else if (sidebar) {
        sidebar.classList.remove('close');
    }
}
