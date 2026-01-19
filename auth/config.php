<?php 
/*
 * CONFIG.PHP - Database Configuration File
 * Ito yung file para sa database connection ng system natin
 * Ginagamit natin ang MySQLi extension para makapag-connect sa MySQL database
 * 
 * Note: Palitan mo yung credentials kapag mag-deploy na sa live server ha!
 */

// Database credentials - ito yung mga login details papunta sa database
$host = "localhost";          // Hostname ng server (localhost kasi local dev tayo)
$user = "root";               // Username ng MySQL (default sa XAMPP ay 'root')
$password = "";               // Password (walang password by default sa XAMPP)
$database = "students_db";    // Pangalan ng database natin

// Gumawa ng bagong MySQLi connection object
// Basically iko-connect niya yung PHP natin sa MySQL database
$conn = new mysqli($host, $user, $password, $database); 

// Check kung successful ba yung connection o hindi
// Kung may error, i-display yung error message tapos tigilan na yung script
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Pag umabot dito, ibig sabihin okay na yung connection! 
?>