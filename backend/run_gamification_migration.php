<?php
/**
 * One-time script to run the gamification migration.
 * Run from backend folder: php run_gamification_migration.php
 * Or use: php artisan migrate --force
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Running migrations...\n";
\Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
echo \Illuminate\Support\Facades\Artisan::output();
echo "Done. You can delete this file.\n";
