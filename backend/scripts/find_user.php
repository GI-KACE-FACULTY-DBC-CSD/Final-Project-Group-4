<?php
if ($argc < 2) {
    echo "Usage: php find_user.php search_term\n";
    exit(1);
}
$term = $argv[1];
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$matches = \DB::table('users')
    ->select('id','email','created_at')
    ->where('email', 'like', "%{$term}%")
    ->orderBy('created_at', 'desc')
    ->limit(20)
    ->get();

if (count($matches) === 0) {
    echo "NO_MATCHES\n";
    exit(0);
}

foreach ($matches as $m) {
    echo "{$m->id} \t {$m->email} \t {$m->created_at}\n";
}
