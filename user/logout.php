<?php
const LOGIN_PAGE = '../index.php';

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {   // POST only, so a stray link can't log someone out
    header('Location: main.php');
    exit;
}

$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $cookie = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $cookie['path'], $cookie['domain'], $cookie['secure'], $cookie['httponly']);
}
session_destroy();

header('Cache-Control: no-store');
header('Location: ' . LOGIN_PAGE);
exit;
