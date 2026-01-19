<?php
/*
 * LOGIN_REGISTER.PHP - Backend Handler for Authentication
 * Ito yung main PHP file na nag-ha-handle ng login at registration
 * Lahat ng form submissions dito papunta para ma-process
 * 
 * Dalawang main function:
 * 1. Registration - Para mag-create ng bagong account
 * 2. Login - Para ma-authenticate yung existing user
 */

// Start ng session - kailangan to para magamit natin yung $_SESSION
// Dito natin isi-store yung user data at error messages
session_start();

// Include yung database connection file
// Dito nakuha yung $conn variable na gagamitin natin for queries
require_once 'config.php';

// ============================================
// REGISTRATION HANDLER
// ============================================
// Check kung ang form na sinubmit ay yung registration form
// Gamit natin yung isset() para i-check kung nag-exist ba yung 'register' button sa POST
if (isset($_POST['register'])) {
    // Kunin lahat ng data galing sa form
    $name = $_POST['name'];
    $email = $_POST['email'];
    
    // IMPORTANTE: Never mo i-store ang plain text password sa database!
    // Ginagamit natin yung password_hash() para ma-encrypt yung password
    // PASSWORD_DEFAULT ang pinaka-recommended na algorithm (currently bcrypt)
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
    $role = $_POST['role'];   // Either 'student' or 'teacher'

    // First, i-check muna natin kung ang email ay naka-register na
    // Kung oo, hindi na natin papayagan mag-register ulit (duplicate prevention)
    $checkemail = $conn->query("SELECT email FROM students WHERE email='$email'");
    
    if ($checkemail->num_rows > 0) {
        // May existing account na sa email na to, mag-error tayo
        $_SESSION['register_error'] = 'Email is already registered!';
        $_SESSION['active_form'] = 'register';  // Para active pa rin yung register form
    } else {
        // Walang duplicate, pwede na i-insert sa database!
        // INSERT query para idagdag yung bagong user sa 'students' table
        $conn->query("INSERT INTO students (name, email, password, role) VALUES ('$name', '$email', '$password', '$role')");
    }

    // Redirect pabalik sa login page
    // Gamit ng header() function para mag-redirect
    header('Location: login.php');
    exit();   // Important! Laging lagyan ng exit() pagkatapos ng header redirect
}

// ============================================
// LOGIN HANDLER
// ============================================
// Check kung ang form na sinubmit ay yung login form
if (isset($_POST['login'])) {
    $email = $_POST['email'];
    $password = $_POST['password'];

    // Query sa database para hanapin yung user gamit ang email
    // SELECT * meaning kukunin lahat ng columns ng matching row
    $result = $conn->query("SELECT * FROM students WHERE email='$email'");
    
    // Check kung may nakitang user (num_rows > 0 means may result)
    if ($result->num_rows > 0) {
        // fetch_assoc() - kukunin yung result as associative array
        // Para ma-access natin by column name (e.g., $user['name'])
        $user = $result->fetch_assoc();
        
        // Verify kung tama ba yung password na in-input
        // password_verify() - compares plain text password sa hashed password
        // Returns TRUE kung match, FALSE kung hindi
        if (password_verify($password, $user['password'])) {
            // LOGIN SUCCESSFUL! I-store ang user info sa session
            $_SESSION['name'] = $user['name'];
            $_SESSION['email'] = $user['email'];

            // Redirect base sa role ng user
            // Magkaiba yung dashboard ng teacher at student
            if ($user['role'] == 'teacher') {
                header('Location: ../pages/dashboard/teacher/dashboard.html');
            } else {
                header('Location: ../pages/dashboard/student/dashboard.html');
            }
            exit();
        }
    }

    // Pag umabot dito, meaning failed ang login (wrong email or password)
    $_SESSION['login_error'] = 'Invalid email or password!';
    $_SESSION['active_form'] = 'login';
    header('Location: login.php');
    exit();
}

?>