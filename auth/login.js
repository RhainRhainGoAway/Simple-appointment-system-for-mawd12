/*
 * LOGIN.JS - Login Page JavaScript Functionality
 * Ito yung JS file para sa login/registration page
 * 
 * Main features:
 * 1. Form switching - Para lumipat sa login at register form
 * 2. Email validation - Para ma-ensure na STI email lang ang gagamitin
 */

// ============================================
// FORM SWITCHING FUNCTION
// ============================================
/**
 * showForm() - Function para mag-switch between login at register form
 * Tinatanggal yung 'active' class sa lahat ng forms, tapos inilalagay sa target form
 * 
 * @param formId - ID ng form na gusto mong i-show ('login-form' or 'register-form')
 */
function showForm(formId) {
    // Una, tanggalin muna yung 'active' class sa lahat ng form boxes
    // querySelectorAll() - kukunin lahat ng elements na may class na 'form-box'
    // forEach() - loop through each form
    document.querySelectorAll(".form-box").forEach(form => form.classList.remove("active"));
    
    // Tapos, idagdag yung 'active' class sa target form para ma-display siya
    document.getElementById(formId).classList.add("active");
}

// ============================================
// EMAIL VALIDATION FUNCTION
// ============================================
/**
 * validateEmail() - Function para i-validate kung STI email ba yung input
 * Ginagamit ang Regular Expression (Regex) para i-check yung pattern ng email
 * 
 * @param email - Yung email address na chinecheck
 * @returns boolean - TRUE kung valid STI email, FALSE kung hindi
 */
function validateEmail(email) {
    // Regex pattern para sa STI email format
    // ^ - start ng string
    // [a-zA-Z0-9._%+-]+ - letters, numbers, at special chars bago ang @
    // @santarosa\.sti\.edu\.ph$ - dapat STI Santa Rosa domain
    // $ - end ng string
    const pattern = /^[a-zA-Z0-9._%+-]+@santarosa\.sti\.edu\.ph$/;
    
    // test() method - returns true kung ang email ay match sa pattern
    return pattern.test(email);
}

// ============================================
// FORM SUBMISSION HANDLER
// ============================================
// DOMContentLoaded - mag-eexecute lang to pag fully loaded na yung HTML
// Best practice to para sure na na-load na yung mga elements bago mag-add ng event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Kunin lahat ng forms sa page
    const forms = document.querySelectorAll('form');
    
    // Loop through each form at lagyan ng submit event listener
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            // Hanapin yung email input field sa loob ng form na ito
            const emailInput = this.querySelector('input[type="email"]');
            
            // Validate yung email bago i-submit
            if (!validateEmail(emailInput.value)) {
                // Kung hindi valid, pigilan yung form submission
                e.preventDefault();  // Ito yung nag-pipigil sa form na mag-submit
                
                // Alert para sa user
                alert('Please use a valid @santarosa.sti.edu.ph email address');
                
                // Focus ulit sa email input para madali mag-edit
                emailInput.focus();
            }
            // Kung valid naman, mag-submit na siya normally (pupunta sa PHP backend)
        });
    });
});