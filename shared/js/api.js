const API_BASE = 'http://localhost:5001/api';

// ============================================
// API Helper Function for Authenticated Requests
// ============================================
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        });

        // Handle 401 Unauthorized - redirect to login
        if (response.status === 401) {
            localStorage.clear();
            window.location.href = '/auth/login.html';
            return null;
        }

        return response;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// ============================================
// Authentication Helpers
// ============================================

// Check if user is logged in
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// Get current user info from localStorage
function getCurrentUser() {
    return {
        name: localStorage.getItem('userName'),
        email: localStorage.getItem('userEmail'),
        role: localStorage.getItem('userRole')
    };
}

// Logout function
function logout() {
    localStorage.clear();
    window.location.href = '/appointment_system/auth/login.html';
}

// Protect pages - call this on protected pages
function requireAuth(allowedRoles = []) {
    if (!isAuthenticated()) {
        window.location.href = '/auth/login.html';
        return false;
    }

    if (allowedRoles.length > 0) {
        const userRole = localStorage.getItem('userRole');
        if (!allowedRoles.includes(userRole)) {
            alert('Access denied! You do not have permission to view this page.');
            window.location.href = '/auth/login.html';
            return false;
        }
    }

    return true;
}

// ============================================
// UI Helpers
// ============================================

// Load profile data into the dashboard profile button/menu
function loadProfileButtonData() {
    const userName = localStorage.getItem('userName') || 'User';
    const userEmail = localStorage.getItem('userEmail') || '';
    const userRole = localStorage.getItem('userRole') || '';
    const studentNumber = localStorage.getItem('userStudentNumber') || '';
    const profilePicture = localStorage.getItem('userProfilePicture') || '';
    
    // Update profile button avatar
    const profileBtnAvatar = document.getElementById('profileBtnAvatar');
    if (profileBtnAvatar) {
        profileBtnAvatar.src = profilePicture || '/appointment_system/assets/default-avatar.png';
    }
    
    // Update profile menu avatar
    const profileMenuAvatar = document.getElementById('profileMenuAvatar');
    if (profileMenuAvatar) {
        profileMenuAvatar.src = profilePicture || '/appointment_system/assets/default-avatar.png';
    }
    
    // Update profile button name
    const profileBtnName = document.getElementById('profileBtnName');
    if (profileBtnName) profileBtnName.textContent = userName;
    
    // Update profile button ID (student number for students, email for teachers)
    const profileBtnStudentId = document.getElementById('profileBtnStudentId');
    if (profileBtnStudentId) {
        if (userRole === 'student') {
            profileBtnStudentId.textContent = studentNumber || 'No Student ID';
        } else {
            profileBtnStudentId.textContent = userEmail || 'Teacher';
        }
    }
    
    // Update profile menu name
    const profileMenuName = document.getElementById('profileMenuName');
    if (profileMenuName) profileMenuName.textContent = userName;
    
    // Update profile menu email
    const profileMenuEmail = document.getElementById('profileMenuEmail');
    if (profileMenuEmail) profileMenuEmail.textContent = userEmail;
}

// Call this when the page loads to populate profile data
document.addEventListener('DOMContentLoaded', function() {
    // Only run on pages that have the profile button
    if (document.getElementById('profileBtnName')) {
        loadProfileButtonData();
    }
});
