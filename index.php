<?php
session_start();
require 'config/db.php';
require 'includes/auth.php';

$loginError = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $pass  = $_POST['password'] ?? '';

    if (!is_string($email) || !is_string($pass)) {
        $loginError = 'Invalid email or password.';
    } else {
        $email = trim($email);

        $stmt = $pdo->prepare(
            'SELECT user_id, first_name, password_hash, role, is_active
             FROM users WHERE school_email = ? LIMIT 1'
        );
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && verify_password($pass, $user['password_hash'])) {
            if (!$user['is_active']) {
                $loginError = 'Account disabled.';
            } else {
                session_regenerate_id(true);
                $_SESSION['user_id']   = $user['user_id'];
                $_SESSION['first_name']= $user['first_name'];
                $_SESSION['role']      = $user['role'];

                $pdo->prepare('UPDATE users SET last_login_at = NOW() WHERE user_id = ?')
                    ->execute([$user['user_id']]);

                header('Location: ' . ($user['role'] === 'admin' ? 'admin/dashboard.html' : 'user/main.php'));
                exit;
            }
        } else {
            $loginError = 'Invalid email or password.';
        }
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
        <?php if ($loginError !== null): ?>
            <div class="toast toast--error" id="login-error" role="alert">
                <?= htmlspecialchars($loginError, ENT_QUOTES, 'UTF-8') ?>
            </div>
        <?php endif; ?>

        <div id="page">
            <div class="active_section" id="login_section">
                <h1>Welcome Back!</h1><hr>
                <p>Please enter your credentials to log in</p>

                <form action="index.php" method="post">  
                    <div class="input_container">
                        <input type="email" name="email" id="email" placeholder="Email" required>
                        <input type="password" name="password" id="password" placeholder="Password" required>
                    </div>

                    <p style="text-align: left; margin-left: 12rem;" id="forgot_pass">Forgot password?</p>
                    <button type="submit">Login</button>

                </form>
            </div>

            <div class="inactive_section" id="signup_section">
                <img id="logo" src="assets/imgs/logo.png" alt="">
                <h1>TLC Library</h1>

                <p>New to our platform? Sign up now</p>
                <a href="signup.php"><button>Sign Up</button></a>
            </div>
        </div>

        <?php if ($loginError !== null): ?>
            <script>
                window.setTimeout(function () {
                    const toast = document.getElementById('login-error');
                    if (toast) {
                        toast.classList.add('toast--hidden');
                        window.setTimeout(function () {
                            toast.remove();
                        }, 300);
                    }
                }, 4000);
            </script>
        <?php endif; ?>
    </body>
</html>