// Open Profile Modal
function openProfileModal() {
    const modal = document.getElementById('profileModalOverlay');
    if (!modal) {
        console.error('Profile modal not found');
        return;
    }
    modal.style.display = 'flex';
    // Trigger reflow for animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    // Close the profile dropdown menu
    const profileMenu = document.getElementById('profileMenu');
    if (profileMenu) {
        profileMenu.classList.remove('show');
    }
}

// Close Profile Modal
function closeProfileModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('profileModalOverlay');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Save Profile Changes
function saveProfileChanges() {
    const name = document.getElementById('profileName').value;
    const email = document.getElementById('profileEmail').value;
    const studentNumber = document.getElementById('profileStudentNumber').value;
    const branch = document.getElementById('profileBranch').value;

    // Here you would typically send this data to a server
    console.log('Saving profile:', { name, email, studentNumber, branch });
    
    // Show success feedback
    alert('Profile changes saved successfully!');
    closeProfileModal();
}

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeProfileModal();
    }
});
