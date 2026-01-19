/*
 * BOOK-SCHEDULE.JS - Book Consultation Page JavaScript
 * Ito yung main JS file para sa Book Consultation page ng students
 * 
 * Main features:
 * 1. Week Navigation - Para mag-navigate sa different weeks ng schedule
 * 2. Date Range Display - Para i-show kung anong dates ang nasa screen
 * 3. Time Slot Click Handler - Para ma-trigger yung booking modal
 * 
 * Dependencies:
 * - book.js (modal functionality)
 * - book.html (modal HTML)
 */

// ============================================
// DATE NAVIGATION VARIABLES
// ============================================

// Current week start date - ito yung Monday ng week na nasa display
// Date object para madaling mag-manipulate ng dates
let currentWeekStart = new Date('2025-09-22');

// Original week start - para sa reference kung gusto bumalik sa default
const originalWeekStart = new Date('2025-09-22');

// Array ng days of week - short names para sa headers
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat'];

// Array ng months - short names para sa display
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ============================================
// DATE RANGE UPDATE FUNCTION
// ============================================

/**
 * updateDateRange() - Updates yung date range display at table headers
 * Called every time mag-navigate sa different week
 * 
 * Displays format: "22-26 Sep, 2025" (Monday to Friday)
 */
function updateDateRange() {
    // Calculate yung end of week (Friday = +4 days from Monday)
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 4);  // Monday + 4 = Friday
    
    // Get individual date components para sa display
    const startDay = currentWeekStart.getDate();       // Day number (e.g., 22)
    const endDay = weekEnd.getDate();                  // Day number (e.g., 26)
    const month = months[currentWeekStart.getMonth()]; // Month name (e.g., "Sep")
    const year = currentWeekStart.getFullYear();       // Year (e.g., 2025)
    
    // Update yung date range text sa UI
    document.getElementById('dateRangeText').textContent = `${startDay}-${endDay} ${month}, ${year}`;
    
    // Update din yung table headers with actual dates
    updateTableHeaders();
}

// ============================================
// TABLE HEADERS UPDATE
// ============================================

/**
 * updateTableHeaders() - Update yung column headers sa schedule table
 * Para may date number at day name sa each column
 * 
 * Format: "22 Mon", "23 Tue", etc.
 */
function updateTableHeaders() {
    // Get all header cells - index 0 is "Time" column, 1-5 are the day columns
    const headerCells = document.querySelectorAll('.schedule-table thead th');
    
    // Loop through Monday to Friday (columns 1 to 5)
    for (let i = 1; i <= 5; i++) {
        // Calculate date for this column
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + (i - 1));  // i=1 is Monday (+0), i=2 is Tuesday (+1), etc.
        
        const dayNum = date.getDate();              // Day number
        const dayName = daysOfWeek[date.getDay()];  // Day name
        
        // Update header text
        if (headerCells[i]) {
            headerCells[i].textContent = `${dayNum} ${dayName}`;
        }
    }
}

// ============================================
// WEEK NAVIGATION FUNCTIONS
// ============================================

/**
 * previousWeek() - Navigate to previous week
 * Called when clicking the "previous" button
 * Subtracts 7 days from current week start
 */
function previousWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    updateDateRange();
}

/**
 * nextWeek() - Navigate to next week
 * Called when clicking the "next" button
 * Adds 7 days to current week start
 */
function nextWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    updateDateRange();
}

/**
 * goToToday() - Jump to current week (week containing today's date)
 * Finds the Monday of current week
 * 
 * Logic:
 * 1. Get today's date
 * 2. Calculate how many days since last Monday
 * 3. Subtract those days to get Monday
 */
function goToToday() {
    const today = new Date();
    const dayOfWeek = today.getDay();  // 0=Sunday, 1=Monday, etc.
    
    // Calculate difference to get to Monday
    // Special handling for Sunday (dayOfWeek = 0)
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    
    currentWeekStart = new Date(today.setDate(diff));
    updateDateRange();
}

// ============================================
// DATE FORMATTING FOR MODAL
// ============================================

/**
 * formatFullDate() - Convert week start + offset to full date string
 * Para sa modal display - shows complete formatted date
 * 
 * @param weekStart - Starting date of the week (Monday)
 * @param dayOffset - Number of days from Monday (0=Mon, 1=Tue, etc.)
 * @returns string - Formatted date like "Monday, September 22, 2025"
 */
function formatFullDate(weekStart, dayOffset) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayOffset);
    
    // Full day names para mas formal yung look
    const daysOfWeekFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = daysOfWeekFull[date.getDay()];
    const monthName = monthsFull[date.getMonth()];
    const dayNum = date.getDate();
    const year = date.getFullYear();
    
    return `${dayName}, ${monthName} ${dayNum}, ${year}`;
}

// ============================================
// PAGE INITIALIZATION
// ============================================

// DOMContentLoaded - Initialize everything kapag ready na yung page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize yung date range display
    updateDateRange();
    
    // Add click handler sa "Today" button
    const todayBtn = document.querySelector('.btn-outline-secondary');
    if (todayBtn) {
        todayBtn.addEventListener('click', goToToday);
    }
    
    // Dynamic load ng booking modal HTML
    // Fetching from components folder para organized yung structure
    fetch('../../components/modals/book.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('booking-modal-container').innerHTML = html;
        });
    
    // ============================================
    // TIME SLOT CLICK HANDLERS
    // ============================================
    
    // Add click event listeners sa lahat ng available time slots
    // Excluding yung may 'closed' class kasi hindi pwede yun i-book
    document.querySelectorAll('.time-slot:not(.closed)').forEach(slot => {
        slot.addEventListener('click', function() {
            // Get teacher info from the row
            const teacherRow = this.closest('tr');
            const teacherName = teacherRow.querySelector('.teacher-name').textContent;
            const timeSlot = this.textContent;  // Time range ng slot
            
            // Determine kung anong column/day yung clinick
            const cell = this.closest('td');
            const row = cell.parentElement;
            const cellIndex = Array.from(row.children).indexOf(cell);
            
            // Get yung date info from header para sa modal
            const headerCells = document.querySelectorAll('.schedule-table thead th');
            const dayHeader = headerCells[cellIndex]?.textContent || '';
            
            // Format yung full date para sa modal display
            // cellIndex - 1 kasi index 0 is "Time" column, days start at index 1
            const dateText = formatFullDate(currentWeekStart, cellIndex - 1);
            
            // Open yung booking modal with all the info
            // openBookingModal is defined sa book.js
            openBookingModal(teacherName, dateText, timeSlot);
        });
        });
    });

