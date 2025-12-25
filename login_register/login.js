function showForm(formId) {
    document.querySelectorAll(".form-box").forEach(form =>  form.classList.remove("active"));
    document.getElementById(formId).classList.add("active");
}

function validateEmail(email) {
    const pattern = /^[a-zA-Z0-9._%+-]+@santarosa\.sti\.edu\.ph$/;
    return pattern.test(email);
}

document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const emailInput = this.querySelector('input[type="email"]');
            if (!validateEmail(emailInput.value)) {
                e.preventDefault();
                alert('Please use a valid @one.sti.edu.ph email address');
                emailInput.focus();
            }
        });
    });
});