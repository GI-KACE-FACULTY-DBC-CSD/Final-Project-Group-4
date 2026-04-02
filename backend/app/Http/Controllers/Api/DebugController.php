<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

class DebugController extends Controller
{
    /**
     * Show which database the app is actually using.
     * Useful when new data doesn't appear in pgAdmin (usually means app is still on SQLite).
     */
    public function database()
    {
        $connection = Config::get('database.default');
        $database = Config::get("database.connections.{$connection}.database");

        if ($connection === 'sqlite') {
            $database = $database ?: database_path('database.sqlite');
        }

        return response()->json([
            'connection' => $connection,
            'database' => $database,
            'message' => $connection === 'pgsql'
                ? 'Using PostgreSQL. Data will appear in pgAdmin.'
                : 'Using SQLite. To use PostgreSQL (pgAdmin), set DB_CONNECTION=pgsql and DB_* in .env and restart the server.',
        ]);
    }
}
