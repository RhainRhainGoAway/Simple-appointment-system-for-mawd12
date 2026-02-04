// API Configuration - Docker API URL
const API_BASE = 'http://localhost:5001/api';

// Store sections data
let sectionsData = [];

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
    }
}

// Call on page load
fetchSections();

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
    
    // Validate student number if student role is selected
    const role = form.role.value;
    const studentNumber = form.studentNumber ? form.studentNumber.value : '';
    const sectionId = form.sectionId ? form.sectionId.value : '';
    
    if (role === 'student') {
        if (!studentNumber.trim()) {
            errorDiv.textContent = 'Student number is required for students.';
            errorDiv.style.display = 'block';
            return;
        }
        if (!sectionId) {
            errorDiv.textContent = 'Please select your grade level and section.';
            errorDiv.style.display = 'block';
            return;
        }
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
                role: form.role.value,
                studentNumber: role === 'student' ? studentNumber : null,
                sectionId: role === 'student' ? parseInt(sectionId) : null
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Registration successful! Please login.');
            form.reset();
            // Hide student fields after reset
            document.getElementById('studentFields').style.display = 'none';
            document.getElementById('sectionSelect').disabled = true;
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
// ROLE SELECT - Show/Hide Student Fields
// ============================================
document.getElementById('roleSelect').addEventListener('change', function() {
    const studentFields = document.getElementById('studentFields');
    if (this.value === 'student') {
        studentFields.style.display = 'block';
    } else {
        studentFields.style.display = 'none';
        // Reset student fields
        document.getElementById('studentNumberInput').value = '';
        document.getElementById('gradeLevelSelect').value = '';
        document.getElementById('sectionSelect').innerHTML = '<option value="" hidden>--Select Section--</option>';
        document.getElementById('sectionSelect').disabled = true;
    }
});

// ============================================
// GRADE LEVEL SELECT - Filter Sections
// ============================================
document.getElementById('gradeLevelSelect').addEventListener('change', function() {
    const gradeLevel = this.value;
    const sectionSelect = document.getElementById('sectionSelect');
    
    // Clear and reset section dropdown
    sectionSelect.innerHTML = '<option value="" hidden>--Select Section--</option>';
    
    if (gradeLevel) {
        // Filter sections by grade level
        const filteredSections = sectionsData.filter(s => s.gradeLevel === gradeLevel);
        
        // Add options
        filteredSections.forEach(section => {
            const option = document.createElement('option');
            option.value = section.id;
            option.textContent = section.name;
            sectionSelect.appendChild(option);
        });
        
        // Enable section dropdown
        sectionSelect.disabled = false;
    } else {
        sectionSelect.disabled = true;
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


