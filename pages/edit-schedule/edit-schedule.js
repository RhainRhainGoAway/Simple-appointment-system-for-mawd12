// ============================================
// EDIT-SCHEDULE.JS - Edit Schedule Page Functionality
// ============================================

// Schedule State
let scheduleState = {
    weekly: {
        mon: { enabled: false, slots: [] },
        tue: { enabled: false, slots: [] },
        wed: { enabled: false, slots: [] },
        thu: { enabled: false, slots: [] },
        fri: { enabled: false, slots: [] },
        sat: { enabled: false, slots: [] }
    },
    specificDates: []
};

// Calendar State
let calendarState = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    selectedDate: null
};

// Modal instance
let specificHoursModal = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeWeeklySchedule();
    initializeSpecificHoursModal();
    loadSavedSchedule();
});

// ============================================
// WEEKLY SCHEDULE FUNCTIONS
// ============================================

function initializeWeeklySchedule() {
    // Add event listeners to day checkboxes
    document.querySelectorAll('.day-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const dayRow = this.closest('.day-row');
            const day = dayRow.dataset.day;
            
            if (this.checked) {
                dayRow.classList.add('active');
                scheduleState.weekly[day].enabled = true;
                
                // Add initial time slot if none exist
                if (scheduleState.weekly[day].slots.length === 0) {
                    addTimeSlot(day);
                }
                renderTimeSlots(day);
            } else {
                dayRow.classList.remove('active');
                scheduleState.weekly[day].enabled = false;
            }
        });
    });
}

function addTimeSlot(day, startTime = '00:00', startPeriod = 'AM', endTime = '00:00', endPeriod = 'AM') {
    const slot = {
        id: Date.now(),
        startTime: startTime,
        startPeriod: startPeriod,
        endTime: endTime,
        endPeriod: endPeriod,
        isPreferred: false
    };
    scheduleState.weekly[day].slots.push(slot);
    return slot;
}

function removeTimeSlot(day, slotId) {
    // Allow removing any slot, but keep at least one with 00:00
    if (scheduleState.weekly[day].slots.length <= 1) {
        // Reset to 00:00 instead of removing
        const slot = scheduleState.weekly[day].slots[0];
        slot.startTime = '00:00';
        slot.startPeriod = 'AM';
        slot.endTime = '00:00';
        slot.endPeriod = 'AM';
        slot.isPreferred = false;
        renderTimeSlots(day);
        return;
    }
    scheduleState.weekly[day].slots = scheduleState.weekly[day].slots.filter(s => s.id !== slotId);
    renderTimeSlots(day);
}

function renderTimeSlots(day) {
    const dayRow = document.querySelector(`.day-row[data-day="${day}"]`);
    const slotsContainer = dayRow.querySelector('.time-slots');
    const slots = scheduleState.weekly[day].slots;
    
    slotsContainer.innerHTML = '';
    
    slots.forEach((slot, index) => {
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

function updateSlotTime(day, slotId, field, value) {
    const slot = scheduleState.weekly[day].slots.find(s => s.id === slotId);
    if (slot) {
        slot[field] = value;
    }
}

function togglePreferred(day, slotId) {
    const slot = scheduleState.weekly[day].slots.find(s => s.id === slotId);
    if (slot) {
        slot.isPreferred = !slot.isPreferred;
        renderTimeSlots(day);
    }
}

function addNewSlotAfter(day, afterSlotId) {
    const slots = scheduleState.weekly[day].slots;
    const index = slots.findIndex(s => s.id === afterSlotId);
    
    const newSlot = {
        id: Date.now(),
        startTime: '00:00',
        startPeriod: 'AM',
        endTime: '00:00',
        endPeriod: 'AM',
        isPreferred: false
    };
    
    slots.splice(index + 1, 0, newSlot);
    renderTimeSlots(day);
}

// ============================================
// DATE-SPECIFIC HOURS FUNCTIONS
// ============================================

function initializeSpecificHoursModal() {
    specificHoursModal = new bootstrap.Modal(document.getElementById('specificHoursModal'));
    
    // Add Specific Hours button
    document.getElementById('addSpecificHoursBtn').addEventListener('click', () => {
        resetModalState();
        renderCalendar();
        addSpecificTimeSlotRow();
        specificHoursModal.show();
    });
    
    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        calendarState.currentMonth--;
        if (calendarState.currentMonth < 0) {
            calendarState.currentMonth = 11;
            calendarState.currentYear--;
        }
        renderCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        calendarState.currentMonth++;
        if (calendarState.currentMonth > 11) {
            calendarState.currentMonth = 0;
            calendarState.currentYear++;
        }
        renderCalendar();
    });
    
    // Accept button
    document.getElementById('acceptSpecificHours').addEventListener('click', () => {
        saveSpecificDate();
    });
    
    // Mark as closed checkbox
    document.getElementById('markAsClosed').addEventListener('change', function() {
        const timeSection = document.getElementById('specificTimeSlots');
        if (this.checked) {
            timeSection.style.opacity = '0.5';
            timeSection.style.pointerEvents = 'none';
        } else {
            timeSection.style.opacity = '1';
            timeSection.style.pointerEvents = 'auto';
        }
    });
}

function resetModalState() {
    calendarState.selectedDate = null;
    document.getElementById('specificTimeSlots').innerHTML = '';
    document.getElementById('markAsClosed').checked = false;
    document.getElementById('specificTimeSlots').style.opacity = '1';
    document.getElementById('specificTimeSlots').style.pointerEvents = 'auto';
}

function renderCalendar() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    document.getElementById('calendarMonthYear').textContent = 
        `${monthNames[calendarState.currentMonth]} ${calendarState.currentYear}`;
    
    const daysContainer = document.getElementById('calendarDays');
    daysContainer.innerHTML = '';
    
    const firstDay = new Date(calendarState.currentYear, calendarState.currentMonth, 1);
    const lastDay = new Date(calendarState.currentYear, calendarState.currentMonth + 1, 0);
    const today = new Date();
    
    // Get the day of week (0 = Sunday, we want Monday = 0)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    
    // Previous month days
    const prevMonthLastDay = new Date(calendarState.currentYear, calendarState.currentMonth, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day other-month';
        dayDiv.textContent = prevMonthLastDay - i;
        daysContainer.appendChild(dayDiv);
    }
    
    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.textContent = day;
        
        const currentDate = new Date(calendarState.currentYear, calendarState.currentMonth, day);
        
        // Check if today
        if (currentDate.toDateString() === today.toDateString()) {
            dayDiv.classList.add('today');
        }
        
        // Check if weekend
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            dayDiv.classList.add('weekend');
        }
        
        // Check if selected
        if (calendarState.selectedDate && 
            calendarState.selectedDate.toDateString() === currentDate.toDateString()) {
            dayDiv.classList.add('selected');
        }
        
        dayDiv.addEventListener('click', () => {
            calendarState.selectedDate = currentDate;
            renderCalendar();
        });
        
        daysContainer.appendChild(dayDiv);
    }
    
    // Next month days
    const totalCells = daysContainer.children.length;
    const remainingCells = 42 - totalCells; // 6 rows x 7 days
    for (let i = 1; i <= remainingCells && totalCells < 42; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day other-month';
        dayDiv.textContent = i;
        daysContainer.appendChild(dayDiv);
        if (daysContainer.children.length >= 42) break;
    }
}

function addSpecificTimeSlotRow() {
    const container = document.getElementById('specificTimeSlots');
    const rowId = Date.now();
    
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

function removeSpecificTimeRow(rowId) {
    const row = document.querySelector(`.specific-time-row[data-row-id="${rowId}"]`);
    if (row) {
        row.remove();
    }
}

function saveSpecificDate() {
    if (!calendarState.selectedDate) {
        alert('Please select a date');
        return;
    }
    
    let isClosed = document.getElementById('markAsClosed').checked;
    const timeRows = document.querySelectorAll('.specific-time-row');
    const timeSlots = [];
    
    if (!isClosed) {
        timeRows.forEach(row => {
            const inputs = row.querySelectorAll('.time-input');
            const selects = row.querySelectorAll('.period-select');
            const startTime = inputs[0].value;
            const endTime = inputs[1].value;
            const startPeriod = selects[0].value;
            const endPeriod = selects[1].value;
            
            // Check if 00:00 - 00:00, treat as closed
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
    
    // If all slots were 00:00-00:00, mark as closed
    if (timeSlots.length === 0 && !isClosed) {
        isClosed = true;
    }
    
    // Remove existing entry for same date
    scheduleState.specificDates = scheduleState.specificDates.filter(
        d => d.date.toDateString() !== calendarState.selectedDate.toDateString()
    );
    
    scheduleState.specificDates.push({
        date: new Date(calendarState.selectedDate),
        isClosed: isClosed,
        slots: timeSlots
    });
    
    renderSpecificDatesList();
    specificHoursModal.hide();
}

function renderSpecificDatesList() {
    const container = document.getElementById('specificDatesList');
    container.innerHTML = '';
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
    
    scheduleState.specificDates.forEach((item, index) => {
        const dateStr = `${dayNames[item.date.getDay()]}, ${monthNames[item.date.getMonth()]} ${item.date.getDate()}, ${item.date.getFullYear()}`;
        
        let timesHtml = '';
        if (item.isClosed) {
            timesHtml = '<span class="closed-badge">Closed</span>';
        } else {
            item.slots.forEach(slot => {
                timesHtml += `<span class="specific-time-pill">${slot.startTime} ${slot.startPeriod} - ${slot.endTime} ${slot.endPeriod}</span>`;
            });
        }
        
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

function removeSpecificDate(index) {
    scheduleState.specificDates.splice(index, 1);
    renderSpecificDatesList();
}

// ============================================
// SAVE/LOAD FUNCTIONS
// ============================================

function loadSavedSchedule() {
    // Load from localStorage (for demo) - in production, fetch from API
    const saved = localStorage.getItem('teacherSchedule');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            
            // Restore weekly schedule
            Object.keys(data.weekly).forEach(day => {
                scheduleState.weekly[day] = data.weekly[day];
                
                if (data.weekly[day].enabled) {
                    const checkbox = document.getElementById(`${day}Check`);
                    const dayRow = document.querySelector(`.day-row[data-day="${day}"]`);
                    if (checkbox && dayRow) {
                        checkbox.checked = true;
                        dayRow.classList.add('active');
                        // Just render, don't dispatch change (which would add another slot)
                        renderTimeSlots(day);
                    }
                }
            });
            
            // Restore specific dates
            if (data.specificDates) {
                scheduleState.specificDates = data.specificDates.map(item => ({
                    ...item,
                    date: new Date(item.date)
                }));
                renderSpecificDatesList();
            }
        } catch (e) {
            console.error('Error loading schedule:', e);
        }
    }
}

// Save Schedule Button
document.getElementById('saveScheduleBtn')?.addEventListener('click', function() {
    // Save to localStorage (for demo) - in production, POST to API
    const dataToSave = {
        weekly: scheduleState.weekly,
        specificDates: scheduleState.specificDates.map(item => ({
            ...item,
            date: item.date.toISOString()
        }))
    };
    
    localStorage.setItem('teacherSchedule', JSON.stringify(dataToSave));
    
    // Show success message
    const btn = this;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="bx bx-check me-2"></i>Saved!';
    btn.classList.add('btn-success');
    btn.classList.remove('btn-primary');
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('btn-success');
        btn.classList.add('btn-primary');
    }, 2000);
    
    console.log('Schedule saved:', dataToSave);
});
