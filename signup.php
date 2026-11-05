<?php
session_start();
require 'config/db.php';
require 'includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $first  = $_POST['first_name'] ?? '';
    $middle = $_POST['middle_name'] ?? '';
    $last   = $_POST['last_name'] ?? '';
    $phone  = $_POST['phone_number'] ?? '';
    $email  = $_POST['school_email'] ?? '';
    $course = $_POST['course'] ?? '';
    $year   = $_POST['year_level'] ?? '';
    $pass   = $_POST['password'] ?? '';

    if (
        !is_string($first) || !is_string($middle) || !is_string($last)
        || !is_string($phone) || !is_string($email) || !is_string($course)
        || !is_string($year) || !is_string($pass)
    ) {
        die('Invalid form submission.');
    }

    $first = trim($first);
    $middle = trim($middle);
    $last = trim($last);
    $phone = trim($phone);
    $email = trim($email);
    $year = filter_var($year, FILTER_VALIDATE_INT);

    // basic validation
    if ($first === '' || $last === '')                    
        die('First and last name are required');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) 
        die('Invalid email');
    if (!preg_match('/^[0-9]{11}$/', $phone))        
        die('Phone must be 11 digits');
    if (strlen($pass) < 8)                           
         die('Password must be 8+ chars');
    if (!in_array($course, ['BSIT', 'BEED', 'ACT', 'BSBA'], true))
        die('Invalid course');
    if ($year === false || $year < 1 || $year > 4)   
        die('Invalid year level');

    $hash = hash_password($pass);

    $stmt = $pdo->prepare(
        'INSERT INTO users
            (first_name, middle_name, last_name, phone_number, school_email,
             course, year_level, password_hash, password_algo)
         VALUES (?,?,?,?,?,?,?,?,"bcrypt")'
    );

    try {
        $stmt->execute([$first, $middle ?: null, $last, $phone, $email,
                        $course, $year, $hash]);
        header('Location: user/main.php');
        exit;
    } catch (PDOException $e) {
        // 23000 = duplicate email/phone
        if ($e->getCode() === '23000') {
            die('Email or phone number already registered.');
        }
        throw $e;
    }
}
?>

<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TLC LibSys</title>

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Inspiration&family=M+PLUS+1p&family=Montserrat+Alternates:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Pontano+Sans:wght@300&display=swap" rel="stylesheet">

        <link rel="stylesheet" href="assets/css/login-signup.css">

    </head>
    <body>
        <div id="page">
            <div class="inactive_section" id="login_section">
                <img id="logo" src="assets/imgs/logo.png" alt="">
                <h1>TLC Library</h1>

                <p>Already have an account? Login now</p>
                <a href="index.php"><button>Login</button></a>
            </div>

            <div class="active_section" id="signup_section">
                <h1>Sign Up</h1><hr>
                <p>Please provide your information to sign up.</p>
                
                <form action="signup.php" method="post"> 
                    <div class="input_container flex">
                        <div>
                            <input type="text" name="first_name" id="first_name" placeholder="First Name" required>
                            <input type="text" name="middle_name" id="middle_name" placeholder="Middle Name">
                            <input type="text" name="last_name" id="last_name" placeholder="Last Name" required>
                            <input type="password" name="password" id="password" placeholder="Password" required>
                        </div>
                        <div>
                            <!-- Opens a numeric keypad on mobile devices and native maxlength blocks typing -->
                            <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="11" minlength="11" name="phone_number" id="phone_number" placeholder="Phone Number" required>

                            <input type="email" name="school_email" id="school_email" placeholder="School Email" required>
                            <select name="course" id="course" required>
                                <option value="">Course</option>
                                <option value="BSIT">BSIT</option>
                                <option value="BEED">BEED</option>
                                <option value="ACT">ACT</option>
                                <option value="BSBA">BSBA</option>
                            </select>
                            <select name="year_level" id="year_level" required>
                                <option value="">Year Level</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit">Sign Up</button>
                </form>
            </div>
        </div>

        <script>
            document.querySelector('form').addEventListener('submit', function (e) {
                const pass = document.getElementById('password').value;
                const phone = document.getElementById('phone_number').value;

                if (pass.length < 8) {
                    e.preventDefault();
                    alert('Password must be at least 8 characters.');
                    return;
                }
                if (!/^[0-9]{11}$/.test(phone)) {
                    e.preventDefault();
                    alert('Phone number must be exactly 11 digits.');
                }
            });
        </script>
    </body>
</html>