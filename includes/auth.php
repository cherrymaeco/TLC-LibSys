<?php

function hash_password(string $plain): string {
    return password_hash($plain, PASSWORD_DEFAULT);
}

function verify_password(string $plain, string $hash): bool {
    return password_verify($plain, $hash);
}

?>