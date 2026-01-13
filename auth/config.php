<?php 
$host = "localhost";
$user = "root";
$password = "";
$database = "students_db"; 

$conn = new mysqli($host, $user, $password, $database); 

//check for connection error
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>