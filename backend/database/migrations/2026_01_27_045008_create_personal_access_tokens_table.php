<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Legacy duplicate migration — no-op to avoid duplicate table creation.
     */
    public function up(): void
    {
        // Intentionally empty: table is created by earlier UUID-compatible migration.
    }

    public function down(): void
    {
        // no-op
    }
};
