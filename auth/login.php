<?php

// Start session para ma-access yung session variables
session_start();

// Kunin yung error messages galing sa session (kung meron)
// Ginagamit yung null coalescing operator (??) para kung walang value, empty string
$errors = [
    'login' => $_SESSION['login_error'] ?? '',       // Error sa login form
    'register' => $_SESSION['register_error'] ?? ''  // Error sa registration form
];

// I-check kung anong form ang dapat na active/visible
// Default ay 'login' kung walang nakaset sa session
$active_form = $_SESSION['active_form'] ?? 'login';

// Clear all session data para hindi umuulit yung error message pag nag-refresh
// One-time display lang dapat yung error messages
session_unset();

/**
 * Helper function para i-display ang error message
 * Returns HTML div with error message kung may laman
 * Returns empty string kung walang error
 * 
 * @param string $error - Yung error message
 * @return string - HTML para sa error display
 */
function showError($error) {
    return !empty($error) ? "<div class='error-message'>$error</div>" : '';
}

/**
 * Helper function para i-determine kung active ba yung form
 * Returns 'active' class kung match, empty kung hindi
 * Ginagamit to para sa CSS styling ng form visibility
 * 
 * @param string $form - Pangalan ng form na chinecheck ('login' or 'register')
 * @param string $active_form - Yung current active form
 * @return string - 'active' or ''
 */
function isActiveForm($form, $active_form) {
    return $form === $active_form ? 'active' : '';
}

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link rel="stylesheet" href="login.css">
</head>
<body>
    <div class="container">
        <div class="form-box <?= isActiveForm('login', $active_form); ?>" id="login-form">
            <form action="login_register.php" method="post">
                <h2>Login</h2>
                <?= showError($errors['login']) ?>
                <input type="email" name="email" placeholder="Email" required>
                <input type="password" name="password" placeholder="Password" required>
                <button type="submit" name="login">Login</button>
                <p>Email not registered? <a href="#" onclick="showForm('register-form')">Register</a></p>
            </form>
        </div>

        <div class="form-box <?= isActiveForm('register', $active_form); ?>" id="register-form">
            <form action="login_register.php" method="post">
                <h2>Register</h2>
                <?= showError($errors['register']) ?>
                <input type="text" name="name" placeholder="Name" required>
                <input type="email" name="email" placeholder="Email" required>
                <input type="password" name="password" placeholder="Password" required>
                <select name="role" required>
                    <option value="" hidden>--Select Role--</option>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                </select>
                <button type="submit" name="register">Register</button>
                <p>Email already registered? <a href="#" onclick="showForm('login-form')">Login</a></p>
            </form>
        </div>
    </div>

    <script src="login.js"></script>
</body>
</html>