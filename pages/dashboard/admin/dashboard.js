document.addEventListener('DOMContentLoaded', function() {
    requireAuth(['admin']);
});

// ============================================
// PROFILE MENU FUNCTIONALITY
// ============================================

function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    if (!menu) return;
    menu.classList.toggle('show');
}

document.addEventListener('click', function(e) {
    const dropdown = document.querySelector('.profile-dropdown');
    const menu = document.getElementById('profileMenu');
    if (!dropdown || !menu) return;
    if (!dropdown.contains(e.target)) {
        menu.classList.remove('show');
    }
});
