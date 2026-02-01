/*
 * PROFILE.JS - Profile Modal JavaScript Functionality
 * Ito yung JS file para sa profile modal/popup
 * 
 * Main features:
 * 1. Open Profile Modal - Para i-display yung profile edit form
 * 2. Close Profile Modal - Para i-close yung modal
 * 3. Load Profile Data - Load real user data from localStorage
 * 4. Upload Profile Picture - Para mag-upload ng profile picture
 */

// API Configuration
const PROFILE_API_BASE = 'http://localhost:5000/api';

// ============================================
// LOAD PROFILE DATA
// ============================================

/**
 * loadProfileData() - Function para i-load yung user data sa profile modal
 * Kukunin from localStorage (set during login)
 */
function loadProfileData() {
    // Get data from localStorage (set during login)
    const userName = localStorage.getItem('userName') || '';
    const userEmail = localStorage.getItem('userEmail') || '';
    const userRole = localStorage.getItem('userRole') || '';
    const studentNumber = localStorage.getItem('userStudentNumber') || '';
    const profilePicture = localStorage.getItem('userProfilePicture') || '';
    
    // Update profile header
    const headerName = document.getElementById('profileHeaderName');
    const headerEmail = document.getElementById('profileHeaderEmail');
    
    if (headerName) headerName.textContent = userName || 'User';
    if (headerEmail) headerEmail.textContent = userEmail || 'No email';
    
    // Update profile avatar
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) {
        profileAvatar.src = profilePicture || '/assets/default-avatar.png';
    }
    
    // Update form fields
    const nameInput = document.getElementById('profileName');
    const emailInput = document.getElementById('profileEmail');
    const studentNumberInput = document.getElementById('profileStudentNumber');
    const studentNumberField = document.getElementById('studentNumberField');
    
    if (nameInput) nameInput.value = userName;
    if (emailInput) emailInput.value = userEmail;
    
    // Show/hide student number field based on role
    if (studentNumberField) {
        if (userRole === 'teacher') {
            studentNumberField.style.display = 'none';
        } else {
            studentNumberField.style.display = 'block';
            if (studentNumberInput) studentNumberInput.value = studentNumber;
        }
    }
    // Branch is static - already set to "Santa Rosa" in HTML
}

// ============================================
// HANDLE PROFILE PICTURE CHANGE
// ============================================

/**
 * handleProfilePictureChange() - Handle when user selects a new profile picture
 */
async function handleProfilePictureChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB.');
        return;
    }
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Image = e.target.result;
        
        // Update preview immediately
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar) {
            profileAvatar.src = base64Image;
        }
        
        // Upload to server
        await uploadProfilePicture(base64Image);
    };
    reader.readAsDataURL(file);
}

/**
 * uploadProfilePicture() - Upload the profile picture to the server
 */
async function uploadProfilePicture(base64Image) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${PROFILE_API_BASE}/auth/profile/picture`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                profilePicture: base64Image
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Update localStorage
            localStorage.setItem('userProfilePicture', base64Image);
            
            // Update all profile images on the page
            updateAllProfileImages(base64Image);
            
            alert('Profile picture updated successfully!');
        } else {
            const errorData = await response.json();
            alert(errorData.message || 'Failed to update profile picture.');
        }
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        alert('Connection error. Please try again.');
    }
}

/**
 * updateAllProfileImages() - Update all profile images on the page
 */
function updateAllProfileImages(imageUrl) {
    // Update profile button avatar
    const profileBtnAvatar = document.getElementById('profileBtnAvatar');
    if (profileBtnAvatar) profileBtnAvatar.src = imageUrl;
    
    // Update profile menu avatar
    const profileMenuAvatar = document.getElementById('profileMenuAvatar');
    if (profileMenuAvatar) profileMenuAvatar.src = imageUrl;
    
    // Update profile modal avatar
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) profileAvatar.src = imageUrl;
}

// ============================================
// OPEN PROFILE MODAL
// ============================================

/**
 * openProfileModal() - Function para i-open yung profile edit modal
 * Ginagamit ang CSS classes para sa smooth animation
 * 
 * Flow:
 * 1. Load profile data from localStorage
 * 2. Display yung modal overlay (flex para centered)
 * 3. Add 'show' class after slight delay (para mag-trigger yung CSS animation)
 * 4. Close yung profile dropdown menu (cleanup)
 */
function openProfileModal() {
    const modal = document.getElementById('profileModalOverlay');
    
    // Safety check - baka wala yung modal sa DOM
    if (!modal) {
        console.error('Profile modal not found');
        return;
    }
    
    // Load profile data first
    loadProfileData();
    
    // Display yung modal
    modal.style.display = 'flex';
    
    // setTimeout para sa smooth animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Close yung profile dropdown menu na nag-open ng modal
    const profileMenu = document.getElementById('profileMenu');
    if (profileMenu) {
        profileMenu.classList.remove('show');
    }
}

// ============================================
// CLOSE PROFILE MODAL
// ============================================

/**
 * closeProfileModal() - Function para i-close yung profile modal
 * May animation din before mag-hide completely
 * 
 * @param event - Optional click event (para i-check kung san nag-click)
 * 
 * Kapag may event, chinecheck kung yung click ay sa backdrop mismo
 * Hindi mag-cclose kung nag-click sa loob ng modal content
 */
function closeProfileModal(event) {
    // Check kung yung click ay sa overlay/backdrop mismo
    // Kung hindi, meaning sa loob ng modal nag-click, so wag i-close
    if (event && event.target !== event.currentTarget) return;
    
    const modal = document.getElementById('profileModalOverlay');
    if (!modal) return;
    
    // Remove 'show' class para mag-fade out
    modal.classList.remove('show');
    
    // After ng animation (300ms), hide completely
    // Kailangan to kasi kung i-hide agad, hindi makikita yung fade out animation
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);  // 300ms = yung duration ng CSS transition
}

// ============================================
// CLOSE PROFILE (via button - just closes modal)
// ============================================

/**
 * saveProfileChanges() - Closes the profile modal
 * Profile fields are read-only, so this just closes the modal
 */
function saveProfileChanges() {
    closeProfileModal();
}

// ============================================
// KEYBOARD SHORTCUT - ESC KEY TO CLOSE
// ============================================

/**
 * Event listener para sa keyboard press
 * Kung pinindot yung Escape key, i-close yung modal
 * Common UX pattern to para sa modals
 */
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeProfileModal();
    }
});

