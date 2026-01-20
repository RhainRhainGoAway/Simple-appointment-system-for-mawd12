
// ============================================
// OPEN PROFILE MODAL
// ============================================

/**
 * openProfileModal() - Function para i-open yung profile edit modal
 * Ginagamit ang CSS classes para sa smooth animation
 * 
 * Flow:
 * 1. Display yung modal overlay (flex para centered)
 * 2. Add 'show' class after slight delay (para mag-trigger yung CSS animation)
 * 3. Close yung profile dropdown menu (cleanup)
 */
function openProfileModal() {
    const modal = document.getElementById('profileModalOverlay');
    
    // Safety check - baka wala yung modal sa DOM
    if (!modal) {
        console.error('Profile modal not found');
        return;
    }
    
    // Display yung modal
    modal.style.display = 'flex';
    
    // setTimeout para sa smooth animation
    // Kailangan ng slight delay para ma-trigger yung CSS transition
    // Reflow trick basically to
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Close yung profile dropdown menu na nag-open ng modal
    // Para clean yung UI
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
// SAVE PROFILE CHANGES
// ============================================

/**
 * saveProfileChanges() - Function para i-save yung profile changes
 * Currently, console.log lang muna (demo mode)
 * 
 * TODO (Future Implementation):
 * - AJAX request papunta sa PHP backend
 * - PHP file na mag-UPDATE sa database
 * - Proper validation at error handling
 */
function saveProfileChanges() {
    // Kunin lahat ng values galing sa form inputs
    const name = document.getElementById('profileName').value;
    const email = document.getElementById('profileEmail').value;
    const studentNumber = document.getElementById('profileStudentNumber').value;
    const branch = document.getElementById('profileBranch').value;

    // TODO: Dito dapat may AJAX/fetch request papunta sa server
    // Para i-update yung database
    // Example: fetch('/api/updateProfile', { method: 'POST', body: JSON.stringify(data) })
    console.log('Saving profile:', { name, email, studentNumber, branch });
    
    // Show success message (simple alert lang muna)
    // TODO: Gawing mas magandang notification/toast message
    alert('Profile changes saved successfully!');
    
    // Close yung modal after save
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

