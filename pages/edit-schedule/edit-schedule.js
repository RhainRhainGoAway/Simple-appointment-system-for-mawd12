/*
 * EDIT-SCHEDULE.JS - Edit Schedule Page JavaScript
 * Ito yung main JS file para sa teacher's schedule editing functionality
 * 
 * Main features:
 * 1. Weekly Schedule - Para i-set yung regular weekly availability
 * 2. Date-Specific Hours - Para i-set yung special hours for specific dates
 * 3. Calendar Modal - Para mag-select ng specific dates
 * 4. Save/Load Schedule - Para i-persist yung schedule data
 * 
 * Note: Currently ginagamit ang localStorage for storage (demo mode)
 * TODO: Implement .NET API backend para i-save sa database
 */

// ============================================
// SCHEDULE STATE OBJECT
// ============================================

// Main state object na nag-sstore ng lahat ng schedule data
// Weekly schedule - per day na availability
// SpecificDates - override dates na may custom hours or closed
let scheduleState = {
    weekly: {
        mon: { enabled: false, slots: [] },  // Monday schedule
        tue: { enabled: false, slots: [] },  // Tuesday schedule
        wed: { enabled: false, slots: [] },  // Wednesday schedule
        thu: { enabled: false, slots: [] },  // Thursday schedule
        fri: { enabled: false, slots: [] }   // Friday schedule
    },
    specificDates: []  // Array ng date-specific overrides
};

// ============================================
// CALENDAR STATE OBJECT
// ============================================

// State para sa calendar modal (date picker)
let calendarState = {
    currentMonth: new Date().getMonth(),    // Current displayed month (0-11)
    currentYear: new Date().getFullYear(),  // Current displayed year
    selectedDate: null                       // Yung napili na date sa calendar
};

// Bootstrap Modal instance para sa specific hours modal
let specificHoursModal = null;

// ============================================
// INITIALIZATION
// ============================================

// DOMContentLoaded - Setup everything kapag ready na yung page
document.addEventListener('DOMContentLoaded', function() {
    initializeWeeklySchedule();      // Setup weekly schedule UI
    initializeSpecificHoursModal();  // Setup date-specific modal
    loadSavedSchedule();             // Load any saved data from localStorage
});

// ============================================
// WEEKLY SCHEDULE FUNCTIONS
// ============================================

/**
 * initializeWeeklySchedule() - Setup ng event listeners para sa weekly schedule
 * Kapag nag-check/uncheck ng day, mag-aactivate or deactivate yung schedule row
 */
function initializeWeeklySchedule() {
    // Add event listeners sa lahat ng day checkboxes
    document.querySelectorAll('.day-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // Get yung parent row at day name
            const dayRow = this.closest('.day-row');
            const day = dayRow.dataset.day;  // e.g., 'mon', 'tue', etc.
            
            if (this.checked) {
                // Enabled - activate yung day row
                dayRow.classList.add('active');
                scheduleState.weekly[day].enabled = true;
                
                // Kung wala pang time slots, gumawa ng initial slot
                if (scheduleState.weekly[day].slots.length === 0) {
                    addTimeSlot(day);
                }
                renderTimeSlots(day);
            } else {
                // Disabled - deactivate yung day row
                dayRow.classList.remove('active');
                scheduleState.weekly[day].enabled = false;
            }
        });
    });
}

/**
 * addTimeSlot() - Add new time slot to a specific day
 * Creates a slot object with start time, end time, and preferred status
 * 
 * @param day - Day key (e.g., 'mon', 'tue')
 * @param startTime - Start time (default: '00:00')
 * @param startPeriod - AM or PM (default: 'AM')
 * @param endTime - End time (default: '00:00')
 * @param endPeriod - AM or PM (default: 'AM')
 * @returns object - The created slot object
 */
function addTimeSlot(day, startTime = '00:00', startPeriod = 'AM', endTime = '00:00', endPeriod = 'AM') {
    // Create slot object with unique ID (timestamp-based)
    const slot = {
        id: Date.now(),           // Unique identifier
        startTime: startTime,     // Start time string
        startPeriod: startPeriod, // AM/PM
        endTime: endTime,         // End time string
        endPeriod: endPeriod,     // AM/PM
        isPreferred: false        // Preferred time marker
    };
    
    scheduleState.weekly[day].slots.push(slot);
    return slot;
}

/**
 * removeTimeSlot() - Remove a time slot from a day
 * Keeps at least one slot (reset to 00:00 instead of removing completely)
 * 
 * @param day - Day key
 * @param slotId - ID of slot to remove
 */
function removeTimeSlot(day, slotId) {
    // Kung isa na lang yung slot, i-reset na lang instead of remove
    if (scheduleState.weekly[day].slots.length <= 1) {
        const slot = scheduleState.weekly[day].slots[0];
        slot.startTime = '00:00';
        slot.startPeriod = 'AM';
        slot.endTime = '00:00';
        slot.endPeriod = 'AM';
        slot.isPreferred = false;
        renderTimeSlots(day);
        return;
    }
    
    // Remove yung specific slot gamit filter
    scheduleState.weekly[day].slots = scheduleState.weekly[day].slots.filter(s => s.id !== slotId);
    renderTimeSlots(day);
}

/**
 * renderTimeSlots() - Render all time slots for a specific day
 * Generates HTML for each slot with inputs and buttons
 * 
 * @param day - Day key to render
 */
function renderTimeSlots(day) {
    const dayRow = document.querySelector(`.day-row[data-day="${day}"]`);
    const slotsContainer = dayRow.querySelector('.time-slots');
    const slots = scheduleState.weekly[day].slots;
    
    // Clear existing content
    slotsContainer.innerHTML = '';
    
    // Generate HTML for each slot
    slots.forEach((slot, index) => {
        // HTML template para sa isang time slot row
        // May star button (preferred), time inputs, delete, at add buttons
        const slotHtml = `
            <div class="time-slot-row" data-slot-id="${slot.id}">
                <button class="btn-icon btn-star ${slot.isPreferred ? 'active' : ''}" onclick="togglePreferred('${day}', ${slot.id})" title="Mark as preferred">
                    <i class='bx ${slot.isPreferred ? 'bxs-star' : 'bx-star'}'></i>
                </button>
                <div class="time-input-group">
                    <input type="text" class="time-input" value="${slot.startTime}" 
                           onchange="updateSlotTime('${day}', ${slot.id}, 'startTime', this.value)" 
                           placeholder="09:00">
                    <select class="period-select" onchange="updateSlotTime('${day}', ${slot.id}, 'startPeriod', this.value)">
                        <option value="AM" ${slot.startPeriod === 'AM' ? 'selected' : ''}>AM</option>
                        <option value="PM" ${slot.startPeriod === 'PM' ? 'selected' : ''}>PM</option>
                    </select>
                </div>
                <span class="time-separator">—</span>
                <div class="time-input-group">
                    <input type="text" class="time-input" value="${slot.endTime}" 
                           onchange="updateSlotTime('${day}', ${slot.id}, 'endTime', this.value)" 
                           placeholder="10:00">
                    <select class="period-select" onchange="updateSlotTime('${day}', ${slot.id}, 'endPeriod', this.value)">
                        <option value="AM" ${slot.endPeriod === 'AM' ? 'selected' : ''}>AM</option>
                        <option value="PM" ${slot.endPeriod === 'PM' ? 'selected' : ''}>PM</option>
                    </select>
                </div>
                <button class="btn-icon btn-delete" onclick="removeTimeSlot('${day}', ${slot.id})" title="Remove">
                    <i class='bx bx-x'></i>
                </button>
                <button class="btn-icon btn-add" onclick="addNewSlotAfter('${day}', ${slot.id})" title="Add time slot">
                    <i class='bx bx-plus'></i>
                </button>
            </div>
        `;
        slotsContainer.insertAdjacentHTML('beforeend', slotHtml);
    });
}

/**
 * updateSlotTime() - Update a specific field of a time slot
 * Called when user changes time input or AM/PM dropdown
 * 
 * @param day - Day key
 * @param slotId - Slot ID
 * @param field - Field name to update (startTime, startPeriod, endTime, endPeriod)
 * @param value - New value
 */
function updateSlotTime(day, slotId, field, value) {
    const slot = scheduleState.weekly[day].slots.find(s => s.id === slotId);
    if (slot) {
        slot[field] = value;
    }
}

/**
 * togglePreferred() - Toggle yung preferred status ng isang time slot
 * Preferred slots are highlighted para alam ng students kung kailan best mag-book
 * 
 * @param day - Day key
 * @param slotId - Slot ID
 */
function togglePreferred(day, slotId) {
    const slot = scheduleState.weekly[day].slots.find(s => s.id === slotId);
    if (slot) {
        slot.isPreferred = !slot.isPreferred;
        renderTimeSlots(day);  // Re-render para ma-update yung UI
    }
}

/**
 * addNewSlotAfter() - Add new time slot after a specific slot
 * Para ma-insert ng slot in between existing slots
 * 
 * @param day - Day key
 * @param afterSlotId - Slot ID kung saan i-insert after
 */
function addNewSlotAfter(day, afterSlotId) {
    const slots = scheduleState.weekly[day].slots;
    const index = slots.findIndex(s => s.id === afterSlotId);
    
    // Create new blank slot
    const newSlot = {
        id: Date.now(),
        startTime: '00:00',
        startPeriod: 'AM',
        endTime: '00:00',
        endPeriod: 'AM',
        isPreferred: false
    };
    
    // splice() para i-insert sa specific index (after the found slot)
    slots.splice(index + 1, 0, newSlot);
    renderTimeSlots(day);
}

// ============================================
// DATE-SPECIFIC HOURS MODAL FUNCTIONS
// ============================================

/**
 * initializeSpecificHoursModal() - Setup ng specific hours modal
 * Ito yung modal para mag-set ng special availability sa specific dates
 * Example: Closed on Dec 25, or extended hours on review week
 */
function initializeSpecificHoursModal() {
    // Initialize Bootstrap Modal instance
    specificHoursModal = new bootstrap.Modal(document.getElementById('specificHoursModal'));
    
    // "Add Specific Hours" button handler
    document.getElementById('addSpecificHoursBtn').addEventListener('click', () => {
        resetModalState();           // Clear previous data
        renderCalendar();            // Render the calendar
        addSpecificTimeSlotRow();    // Add one empty time slot row
        specificHoursModal.show();   // Show the modal
    });
    
    // Calendar navigation - Previous month button
    document.getElementById('prevMonth').addEventListener('click', () => {
        calendarState.currentMonth--;
        // Kung January, go back to December of previous year
        if (calendarState.currentMonth < 0) {
            calendarState.currentMonth = 11;  // December
            calendarState.currentYear--;
        }
        renderCalendar();
    });
    
    // Calendar navigation - Next month button
    document.getElementById('nextMonth').addEventListener('click', () => {
        calendarState.currentMonth++;
        // Kung December, go forward to January of next year
        if (calendarState.currentMonth > 11) {
            calendarState.currentMonth = 0;   // January
            calendarState.currentYear++;
        }
        renderCalendar();
    });
    
    // Accept button - Save yung specific date settings
    document.getElementById('acceptSpecificHours').addEventListener('click', () => {
        saveSpecificDate();
    });
    
    // "Mark as Closed" checkbox handler
    // Kapag checked, i-disable yung time slots kasi closed naman
    document.getElementById('markAsClosed').addEventListener('change', function() {
        const timeSection = document.getElementById('specificTimeSlots');
        if (this.checked) {
            // Dim yung time section para indicate na disabled
            timeSection.style.opacity = '0.5';
            timeSection.style.pointerEvents = 'none';  // Disable clicks
        } else {
            // Re-enable yung time section
            timeSection.style.opacity = '1';
            timeSection.style.pointerEvents = 'auto';
        }
    });
}

/**
 * resetModalState() - Reset modal to initial state
 * Called before showing modal para walang leftover data
 */
function resetModalState() {
    calendarState.selectedDate = null;
    document.getElementById('specificTimeSlots').innerHTML = '';
    document.getElementById('markAsClosed').checked = false;
    document.getElementById('specificTimeSlots').style.opacity = '1';
    document.getElementById('specificTimeSlots').style.pointerEvents = 'auto';
}

/**
 * renderCalendar() - Render yung calendar sa modal
 * Shows month view with clickable dates
 * Handles different month lengths, weekends, etc.
 */
function renderCalendar() {
    // Month names for display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Update header with current month/year
    document.getElementById('calendarMonthYear').textContent = 
        `${monthNames[calendarState.currentMonth]} ${calendarState.currentYear}`;
    
    const daysContainer = document.getElementById('calendarDays');
    daysContainer.innerHTML = '';  // Clear previous calendar
    
    // Get first and last day of the month
    const firstDay = new Date(calendarState.currentYear, calendarState.currentMonth, 1);
    const lastDay = new Date(calendarState.currentYear, calendarState.currentMonth + 1, 0);
    const today = new Date();
    
    // Calculate starting day (0 = Sunday, we want Monday = 0)
    // Adjust for weeks starting on Monday
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;  // Sunday becomes 6
    
    // Render previous month's trailing days (gray/faded)
    const prevMonthLastDay = new Date(calendarState.currentYear, calendarState.currentMonth, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day other-month';
        dayDiv.textContent = prevMonthLastDay - i;
        daysContainer.appendChild(dayDiv);
    }
    
    // Render current month's days
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.textContent = day;
        
        const currentDate = new Date(calendarState.currentYear, calendarState.currentMonth, day);
        
        // Highlight today's date
        if (currentDate.toDateString() === today.toDateString()) {
            dayDiv.classList.add('today');
        }
        
        // Mark weekends (different styling)
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {  // 0 = Sunday, 6 = Saturday
            dayDiv.classList.add('weekend');
        }

        // Disable Saturdays (no selection)
        const isSaturday = dayOfWeek === 6;
        if (isSaturday) {
            dayDiv.classList.add('disabled');
        }
        
        // Mark selected date
        if (calendarState.selectedDate && 
            calendarState.selectedDate.toDateString() === currentDate.toDateString()) {
            dayDiv.classList.add('selected');
        }
        
        // Add click handler para sa date selection (skip disabled Saturdays)
        if (!isSaturday) {
            dayDiv.addEventListener('click', () => {
                calendarState.selectedDate = currentDate;
                renderCalendar();  // Re-render para ma-update yung selected state
            });
        }
        
        daysContainer.appendChild(dayDiv);
    }
    
    // Render next month's leading days (to fill the grid)
    // Standard calendar grid is 6 rows x 7 days = 42 cells
    const totalCells = daysContainer.children.length;
    const remainingCells = 42 - totalCells;
    for (let i = 1; i <= remainingCells && totalCells < 42; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day other-month';
        dayDiv.textContent = i;
        daysContainer.appendChild(dayDiv);
        if (daysContainer.children.length >= 42) break;
    }
}

/**
 * addSpecificTimeSlotRow() - Add a time slot row sa specific hours modal
 * Similar sa weekly schedule slots pero para sa specific date lang
 */
function addSpecificTimeSlotRow() {
    const container = document.getElementById('specificTimeSlots');
    const rowId = Date.now();  // Unique ID based on timestamp
    
    // HTML template para sa time slot row
    const rowHtml = `
        <div class="specific-time-row" data-row-id="${rowId}">
            <input type="text" class="time-input" placeholder="00:00" value="00:00">
            <select class="period-select">
                <option value="AM">AM</option>
                <option value="PM">PM</option>
            </select>
            <span class="time-separator">—</span>
            <input type="text" class="time-input" placeholder="00:00" value="00:00">
            <select class="period-select">
                <option value="AM">AM</option>
                <option value="PM">PM</option>
            </select>
            <button class="btn-icon btn-delete" onclick="removeSpecificTimeRow(${rowId})">
                <i class='bx bx-x'></i>
            </button>
            <button class="btn-icon btn-add" onclick="addSpecificTimeSlotRow()">
                <i class='bx bx-plus'></i>
            </button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', rowHtml);
}

/**
 * removeSpecificTimeRow() - Remove a specific time row
 * 
 * @param rowId - ID of the row to remove
 */
function removeSpecificTimeRow(rowId) {
    const row = document.querySelector(`.specific-time-row[data-row-id="${rowId}"]`);
    if (row) {
        row.remove();
    }
}

/**
 * saveSpecificDate() - Save yung specific date configuration
 * Called when user clicks Accept button sa modal
 * Stores to scheduleState.specificDates array
 */
function saveSpecificDate() {
    // Validation - must have selected date
    if (!calendarState.selectedDate) {
        alert('Please select a date');
        return;
    }

    // Block Saturdays
    if (calendarState.selectedDate.getDay() === 6) {
        alert('Saturday is not available. Please choose another date.');
        return;
    }
    
    let isClosed = document.getElementById('markAsClosed').checked;
    const timeRows = document.querySelectorAll('.specific-time-row');
    const timeSlots = [];
    
    // Kung hindi closed, collect yung time slots
    if (!isClosed) {
        timeRows.forEach(row => {
            const inputs = row.querySelectorAll('.time-input');
            const selects = row.querySelectorAll('.period-select');
            const startTime = inputs[0].value;
            const endTime = inputs[1].value;
            const startPeriod = selects[0].value;
            const endPeriod = selects[1].value;
            
            // Special case: 00:00 - 00:00 means closed
            if (startTime === '00:00' && endTime === '00:00' && startPeriod === 'AM' && endPeriod === 'AM') {
                isClosed = true;
            } else {
                timeSlots.push({
                    startTime: startTime,
                    startPeriod: startPeriod,
                    endTime: endTime,
                    endPeriod: endPeriod
                });
            }
        });
    }
    
    // Kung walang valid slots at hindi explicitly marked as closed, treat as closed
    if (timeSlots.length === 0 && !isClosed) {
        isClosed = true;
    }
    
    // Remove existing entry kung may same date na (override)
    scheduleState.specificDates = scheduleState.specificDates.filter(
        d => d.date.toDateString() !== calendarState.selectedDate.toDateString()
    );
    
    // Add new entry
    scheduleState.specificDates.push({
        date: new Date(calendarState.selectedDate),
        isClosed: isClosed,
        slots: timeSlots
    });
    
    // Update UI at close modal
    renderSpecificDatesList();
    specificHoursModal.hide();
}

/**
 * renderSpecificDatesList() - Render yung list ng specific dates sa UI
 * Shows all configured date-specific schedules
 */
function renderSpecificDatesList() {
    const container = document.getElementById('specificDatesList');
    container.innerHTML = '';  // Clear existing
    
    // Short month and day names para sa display
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
    
    // Render each specific date entry
    scheduleState.specificDates.forEach((item, index) => {
        // Format date string
        const dateStr = `${dayNames[item.date.getDay()]}, ${monthNames[item.date.getMonth()]} ${item.date.getDate()}, ${item.date.getFullYear()}`;
        
        // Generate times HTML - either "Closed" badge or time pills
        let timesHtml = '';
        if (item.isClosed) {
            timesHtml = '<span class="closed-badge">Closed</span>';
        } else {
            item.slots.forEach(slot => {
                timesHtml += `<span class="specific-time-pill">${slot.startTime} ${slot.startPeriod} - ${slot.endTime} ${slot.endPeriod}</span>`;
            });
        }
        
        // Full item HTML
        const itemHtml = `
            <div class="specific-date-item" data-index="${index}">
                <div class="specific-date-header">
                    <span class="specific-date-title">${dateStr}</span>
                    <button class="btn-icon btn-delete" onclick="removeSpecificDate(${index})">
                        <i class='bx bx-x'></i>
                    </button>
                </div>
                <div class="specific-date-times">
                    ${timesHtml}
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', itemHtml);
    });
}

/**
 * removeSpecificDate() - Remove a specific date entry
 * 
 * @param index - Index sa specificDates array
 */
function removeSpecificDate(index) {
    scheduleState.specificDates.splice(index, 1);  // Remove from array
    renderSpecificDatesList();  // Re-render the list
}

// ============================================
// SAVE/LOAD FUNCTIONS
// ============================================

/**
 * loadSavedSchedule() - Load previously saved schedule from API
 */
async function loadSavedSchedule() {
    try {
        const response = await apiCall('/teacheravailability/my');
        if (!response || !response.ok) return;

        const data = await response.json();

        // Restore weekly schedule
        if (data.weekly) {
            Object.keys(data.weekly).forEach(day => {
                if (!scheduleState.weekly[day]) return;
                const dayData = data.weekly[day];
                scheduleState.weekly[day].enabled = dayData.enabled;
                scheduleState.weekly[day].slots = (dayData.slots || []).map(s => ({
                    id: Date.now() + Math.random(),
                    startTime: s.startTime,
                    startPeriod: s.startPeriod,
                    endTime: s.endTime,
                    endPeriod: s.endPeriod,
                    isPreferred: s.isPreferred
                }));

                if (dayData.enabled) {
                    const checkbox = document.getElementById(`${day}Check`);
                    const dayRow = document.querySelector(`.day-row[data-day="${day}"]`);
                    if (checkbox && dayRow) {
                        checkbox.checked = true;
                        dayRow.classList.add('active');
                        renderTimeSlots(day);
                    }
                }
            });
        }

        // Restore specific dates (group flat rows by date)
        if (data.specificDates && data.specificDates.length > 0) {
            const grouped = {};
            data.specificDates.forEach(item => {
                if (!grouped[item.date]) {
                    grouped[item.date] = { date: new Date(item.date + 'T00:00:00'), isClosed: item.isClosed, slots: [] };
                }
                if (!item.isClosed && item.startTime && item.endTime) {
                    grouped[item.date].slots.push({
                        startTime: item.startTime,
                        startPeriod: item.startPeriod,
                        endTime: item.endTime,
                        endPeriod: item.endPeriod
                    });
                }
            });
            scheduleState.specificDates = Object.values(grouped);
            renderSpecificDatesList();
        }
    } catch (e) {
        console.error('Error loading schedule:', e);
    }
}

// ============================================
// SAVE SCHEDULE BUTTON HANDLER
// ============================================

/**
 * Save button click handler - Saves schedule to API
 */
document.getElementById('saveScheduleBtn')?.addEventListener('click', async function() {
    const btn = this;
    const originalText = btn.innerHTML;

    // Build DTO matching the API's SaveScheduleDto
    const dataToSave = {
        weekly: {},
        specificDates: []
    };

    // Weekly schedule
    Object.keys(scheduleState.weekly).forEach(day => {
        const dayData = scheduleState.weekly[day];
        dataToSave.weekly[day] = {
            enabled: dayData.enabled,
            slots: dayData.slots.map(s => ({
                startTime: s.startTime,
                startPeriod: s.startPeriod,
                endTime: s.endTime,
                endPeriod: s.endPeriod,
                isPreferred: s.isPreferred
            }))
        };
    });

    // Specific dates
    scheduleState.specificDates.forEach(item => {
        const dateStr = item.date.getFullYear() + '-' +
            String(item.date.getMonth() + 1).padStart(2, '0') + '-' +
            String(item.date.getDate()).padStart(2, '0');

        dataToSave.specificDates.push({
            date: dateStr,
            isClosed: item.isClosed,
            slots: item.isClosed ? [] : (item.slots || []).map(s => ({
                startTime: s.startTime,
                startPeriod: s.startPeriod,
                endTime: s.endTime,
                endPeriod: s.endPeriod,
                isPreferred: false
            }))
        });
    });

    try {
        btn.disabled = true;
        const response = await apiCall('/teacheravailability/save', {
            method: 'POST',
            body: JSON.stringify(dataToSave)
        });

        if (response && response.ok) {
            btn.innerHTML = '<i class="bx bx-check me-2"></i>Saved!';
            btn.classList.add('btn-success');
            btn.classList.remove('btn-primary');
        } else {
            btn.innerHTML = '<i class="bx bx-x me-2"></i>Error!';
            btn.classList.add('btn-danger');
            btn.classList.remove('btn-primary');
        }
    } catch (e) {
        console.error('Error saving schedule:', e);
        btn.innerHTML = '<i class="bx bx-x me-2"></i>Error!';
        btn.classList.add('btn-danger');
        btn.classList.remove('btn-primary');
    }

    btn.disabled = false;
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('btn-success', 'btn-danger');
        btn.classList.add('btn-primary');
    }, 2000);
});
