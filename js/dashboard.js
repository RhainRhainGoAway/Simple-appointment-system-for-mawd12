// Profile Menu Toggle
function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    menu.classList.toggle('show');
}

// Close profile menu when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.querySelector('.profile-dropdown');
    const menu = document.getElementById('profileMenu');
    if (dropdown && !dropdown.contains(e.target)) {
        menu.classList.remove('show');
    }
});

// Right sidebar toggle for mobile
function toggleRightSidebar() {
    const rightSidebar = document.getElementById('rightSidebar');
    rightSidebar.classList.toggle('open');
}

// Close right sidebar when clicking outside on mobile
document.addEventListener('click', function(e) {
    const rightSidebar = document.getElementById('rightSidebar');
    const toggleBtn = document.querySelector('.right-sidebar-toggle');
    if (window.innerWidth <= 992) {
        if (rightSidebar && toggleBtn && !rightSidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
            rightSidebar.classList.remove('open');
        }
    }
});

