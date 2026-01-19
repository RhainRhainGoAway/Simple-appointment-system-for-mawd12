/*
 * DASHBOARD.JS - Student Dashboard JavaScript
 * Ito yung JS file para sa student dashboard page
 * 
 * Main features:
 * 1. Profile Menu Toggle - Para i-show/hide yung profile dropdown
 * 2. Right Sidebar Toggle - Para sa mobile responsive na sidebar
 * 
 * Note: Shared functionality to ng teacher at student dashboard
 */

// ============================================
// PROFILE MENU FUNCTIONALITY
// ============================================

/**
 * toggleProfileMenu() - Para i-toggle yung visibility ng profile dropdown menu
 * Kapag clinick yung profile icon, mag-sshow or mag-hhide yung menu
 * Ginagamit yung classList.toggle() para mag-add/remove ng 'show' class
 */
function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    // toggle() - kung wala pang 'show' class, i-add; kung meron na, i-remove
    menu.classList.toggle('show');
}

/**
 * Event listener para i-close yung profile menu pag nag-click sa labas
 * Importante to para hindi stuck yung menu na open
 * 
 * Logic: Check kung yung click ay nasa loob ba ng dropdown area o hindi
 * Kung nasa labas, tanggalin yung 'show' class para mag-close yung menu
 */
document.addEventListener('click', function(e) {
    const dropdown = document.querySelector('.profile-dropdown');
    const menu = document.getElementById('profileMenu');
    
    // contains() - checks kung yung clicked element ay nasa loob ng dropdown
    // Kung HINDI nasa loob, ibig sabihin sa labas siya nag-click, so close the menu
    if (dropdown && !dropdown.contains(e.target)) {
        menu.classList.remove('show');
    }
});

// ============================================
// RIGHT SIDEBAR FUNCTIONALITY (MOBILE)
// ============================================

/**
 * toggleRightSidebar() - Para i-toggle yung right sidebar sa mobile view
 * Sa mobile kasi, naka-hide by default yung right sidebar
 * Kailangan may button para i-show siya
 */
function toggleRightSidebar() {
    const rightSidebar = document.getElementById('rightSidebar');
    rightSidebar.classList.toggle('open');
}

/**
 * Event listener para i-close yung right sidebar pag nag-click sa labas
 * Only active kapag mobile view (screen width <= 992px)
 * 
 * Chinecheck natin kung:
 * 1. Mobile ba yung screen size (992px or less)
 * 2. Ang click ba ay nasa labas ng sidebar AND toggle button
 * Kung oo sa dalawa, close yung sidebar
 */
document.addEventListener('click', function(e) {
    const rightSidebar = document.getElementById('rightSidebar');
    const toggleBtn = document.querySelector('.right-sidebar-toggle');
    
    // window.innerWidth - kukunin yung width ng browser window
    // 992px is yung breakpoint natin for tablet/mobile
    if (window.innerWidth <= 992) {
        // Check kung may sidebar at toggle button, at kung ang click ay nasa labas ng dalawa
        if (rightSidebar && toggleBtn && !rightSidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
            rightSidebar.classList.remove('open');
        }
    }
});
