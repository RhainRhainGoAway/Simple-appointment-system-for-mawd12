// API Configuration - Docker API URL
const API_BASE = 'http://localhost:5001/api';

// Store sections data
let sectionsData = [];
let sectionsLoaded = false;
let sectionsLoadPromise = null;

// ============================================
// FETCH SECTIONS ON PAGE LOAD
// ============================================
async function fetchSections() {
    try {
        const response = await fetch(`${API_BASE}/sections`);
        if (response.ok) {
            sectionsData = await response.json();
        }
    } catch (error) {
        console.error('Error fetching sections:', error);
    } finally {
        sectionsLoaded = true;
    }
}

// Call on page load
sectionsLoadPromise = fetchSections();

async function ensureSectionsLoaded() {
    if (sectionsLoaded) return;
    try {
        if (!sectionsLoadPromise) sectionsLoadPromise = fetchSections();
        await sectionsLoadPromise;
    } catch {
        // swallow; UI will handle empty results
    }
}

function normalizeGradeLevel(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function getSectionField(section, field) {
    // Handle both camelCase and PascalCase JSON
    return section?.[field] ?? section?.[field[0].toUpperCase() + field.slice(1)];
}

async function fetchSectionsByGrade(gradeLevel) {
    const grade = String(gradeLevel || '').trim();
    if (!grade) return [];

    // Prefer server-side filtering to avoid relying on initial /sections load.
    const candidates = [grade];
    const m = grade.match(/\bgrade\s*(\d+)\b/i);
    if (m?.[1]) {
        const num = m[1];
        candidates.push(num);
        candidates.push(`Grade${num}`);
        candidates.push(`grade ${num}`);
        candidates.push(`GRADE ${num}`);
    }

    for (const g of candidates) {
        try {
            const res = await fetch(`${API_BASE}/sections/by-grade/${encodeURIComponent(g)}`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) return data;
                if (Array.isArray(data) && candidates.length === 1) return data;
            }
        } catch (e) {
            console.error('Error fetching sections by grade:', e);
        }
    }

    return [];
}

// ============================================
// LOGIN HANDLER
// ============================================
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const errorDiv = document.getElementById('login-error');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Clear previous errors
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: form.email.value,
                password: form.password.value
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Store authentication data
            localStorage.setItem('token', data.token);
            localStorage.setItem('userName', data.name);
            localStorage.setItem('userEmail', data.email);
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('userStudentNumber', data.studentNumber || '');
            localStorage.setItem('userProfilePicture', data.profilePicture || '');

            // Redirect based on role
            window.location.href = '..' + data.redirect;
        } else {
            errorDiv.textContent = data.message || 'Login failed!';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Connection error. Make sure the API server is running.';
        errorDiv.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
});

// ============================================
// REGISTRATION HANDLER
// ============================================
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const errorDiv = document.getElementById('register-error');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Clear previous errors
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
    
    // Validate email domain - only allow @santarosa.sti.edu.ph
    const email = form.email.value.trim();
    const allowedDomain = '@santarosa.sti.edu.ph';
    if (!email.toLowerCase().endsWith(allowedDomain)) {
        errorDiv.textContent = 'Only @santarosa.sti.edu.ph email addresses are allowed.';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Student-only registration
    const studentNumber = form.studentNumber ? form.studentNumber.value : '';
    const gradeLevel = form.gradeLevel ? form.gradeLevel.value : '';
    const sectionId = form.sectionId ? form.sectionId.value : '';

    if (!studentNumber.trim()) {
        errorDiv.textContent = 'Student number is required.';
        errorDiv.style.display = 'block';
        return;
    }
    if (!gradeLevel || !sectionId) {
        errorDiv.textContent = 'Please select your grade level and section.';
        errorDiv.style.display = 'block';
        return;
    }

    const sectionIdValue = parseInt(sectionId, 10);
    if (!Number.isFinite(sectionIdValue)) {
        errorDiv.textContent = 'Please select a valid section.';
        errorDiv.style.display = 'block';
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: form.name.value,
                email: form.email.value,
                password: form.password.value,
                role: 'student',
                studentNumber: studentNumber,
                sectionId: sectionIdValue
            })
        });

        const data = await response.json();

        if (response.ok) {
            await appAlert('Registration successful! Please login.', { title: 'Success' });
            form.reset();
            document.getElementById('sectionSelect').disabled = true;
            document.getElementById('sectionSelect').innerHTML = '<option value="" hidden>--Select Section--</option>';
            showForm('login-form');
        } else {
            errorDiv.textContent = data.message || 'Registration failed!';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Registration error:', error);
        errorDiv.textContent = 'Connection error. Make sure the API server is running.';
        errorDiv.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register';
    }
});

// ============================================
// GRADE LEVEL SELECT - Filter Sections
// ============================================
document.getElementById('gradeLevelSelect').addEventListener('change', async function() {
    const gradeLevel = this.value;
    const sectionSelect = document.getElementById('sectionSelect');

    sectionSelect.disabled = true;
    sectionSelect.innerHTML = '<option value="" hidden>--Select Section--</option>';

    if (!gradeLevel) return;

    // Show a lightweight loading state in the dropdown
    sectionSelect.innerHTML = '<option value="" hidden>Loading sections...</option>';

    let sections = await fetchSectionsByGrade(gradeLevel);

    // Fallback: if the by-grade endpoint fails/returns empty, use the cached /sections list.
    if (!Array.isArray(sections) || sections.length === 0) {
        await ensureSectionsLoaded();
        const target = normalizeGradeLevel(gradeLevel);
        sections = (sectionsData || []).filter(s => normalizeGradeLevel(getSectionField(s, 'gradeLevel')) === target);
    }

    // Reset options
    sectionSelect.innerHTML = '<option value="" hidden>--Select Section--</option>';

    (sections || []).forEach(section => {
        const id = getSectionField(section, 'id');
        const name = getSectionField(section, 'name');
        if (id == null || !name) return;

        const option = document.createElement('option');
        option.value = id;
        option.textContent = name;
        sectionSelect.appendChild(option);
    });

    const hasOptions = sectionSelect.querySelectorAll('option').length > 1;
    sectionSelect.disabled = !hasOptions;

    if (!hasOptions) {
        sectionSelect.innerHTML = '<option value="" hidden>No sections available</option>';
    }
});

// ============================================
// FORM TOGGLE
// ============================================
function showForm(formId) {
    document.querySelectorAll('.form-box').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(formId).classList.add('active');
    
    // Clear error messages when switching forms
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
}


