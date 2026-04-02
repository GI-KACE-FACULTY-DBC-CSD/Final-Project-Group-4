<?php

// Legacy migration stub removed. UUIDs are created as primary `id` columns
// in the individual create_* migrations instead of adding separate `uuid`
// columns. This migration intentionally does nothing to avoid conflicts.

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // no-op
    }

    public function down(): void
    {
        // no-op
    }
};
