<?php
if ($argc < 2) {
    echo "Usage: php generate_reset_token.php user@example.com\n";
    exit(1);
}
$email = $argv[1];
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::where('email', $email)->first();
if (! $user) {
    echo "USER_NOT_FOUND\n";
    exit(0);
}

$broker = app('auth.password.broker');
$token = $broker->createToken($user);
echo $token . "\n";
