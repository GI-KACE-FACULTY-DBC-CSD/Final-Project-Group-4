<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ClassSession;

echo "Checking class sessions...\n\n";

$now = now();
$activeSessions = ClassSession::where('start_time', '<=', $now)
    ->where('end_time', '>', $now)
    ->get();

echo "Active sessions: " . $activeSessions->count() . "\n";
echo "Total sessions: " . ClassSession::count() . "\n\n";

if ($activeSessions->count() > 0) {
    echo "Active sessions:\n";
    foreach ($activeSessions as $session) {
        echo "- " . $session->name . " (" . $session->start_time . " to " . $session->end_time . ")\n";
    }
} else {
    echo "No active sessions found.\n";
    echo "\nAll sessions:\n";
    $allSessions = ClassSession::all();
    foreach ($allSessions as $session) {
        echo "- " . $session->name . " (" . $session->start_time . " to " . $session->end_time . ")\n";
    }
}