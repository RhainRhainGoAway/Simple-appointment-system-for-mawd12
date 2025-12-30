// ============================================
// BOOK-SCHEDULE.JS - Book Consultation Page
// ============================================

// Date navigation functions
let currentWeekStart = new Date('2025-09-22');
const originalWeekStart = new Date('2025-09-22');

// Days of week
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function updateDateRange() {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 4);
    
    const startDay = currentWeekStart.getDate();
    const endDay = weekEnd.getDate();
    const month = months[currentWeekStart.getMonth()];
    const year = currentWeekStart.getFullYear();
    
    document.getElementById('dateRangeText').textContent = `${startDay}-${endDay} ${month}, ${year}`;
    
    // Update table headers
    updateTableHeaders();
}

function updateTableHeaders() {
    const headerCells = document.querySelectorAll('.schedule-table thead th');
    for (let i = 1; i <= 5; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + (i - 1));
        const dayNum = date.getDate();
        const dayName = daysOfWeek[date.getDay()];
        if (headerCells[i]) {
            headerCells[i].textContent = `${dayNum} ${dayName}`;
        }
    }
}

function previousWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    updateDateRange();
}

function nextWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    updateDateRange();
}

function goToToday() {
    // Get current date and find the Monday of current week
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
    currentWeekStart = new Date(today.setDate(diff));
    updateDateRange();
}

// Format full date for modal display
function formatFullDate(weekStart, dayOffset) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayOffset);
    
    const daysOfWeekFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = daysOfWeekFull[date.getDay()];
    const monthName = monthsFull[date.getMonth()];
    const dayNum = date.getDate();
    const year = date.getFullYear();
    
    return `${dayName}, ${monthName} ${dayNum}, ${year}`;
}

// Time slot click handler - Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize date range display
    updateDateRange();
    
    // Add click handler to Today button
    const todayBtn = document.querySelector('.btn-outline-secondary');
    if (todayBtn) {
        todayBtn.addEventListener('click', goToToday);
    }
    
    // Load booking modal HTML
    fetch('/components/modals/book.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('booking-modal-container').innerHTML = html;
        });
    
    // Time slot click handlers
    document.querySelectorAll('.time-slot:not(.closed)').forEach(slot => {
        slot.addEventListener('click', function() {
            const teacherRow = this.closest('tr');
            const teacherName = teacherRow.querySelector('.teacher-name').textContent;
            const timeSlot = this.textContent;
            
            // Get the day column index
            const cell = this.closest('td');
            const row = cell.parentElement;
            const cellIndex = Array.from(row.children).indexOf(cell);
            
            // Get the date from the header
            const headerCells = document.querySelectorAll('.schedule-table thead th');
            const dayHeader = headerCells[cellIndex]?.textContent || '';
            
            // Format the full date
            const dateText = formatFullDate(currentWeekStart, cellIndex - 1);
            
            // Open booking modal
            openBookingModal(teacherName, dateText, timeSlot);
        });
        });
    });

