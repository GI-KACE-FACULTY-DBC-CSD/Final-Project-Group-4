<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Add new temporary column as NON-NULLABLE
        Schema::table('sessions', function (Blueprint $table) {
            $table->string('new_id'); // remove nullable()
        });

        // Step 2: Copy old IDs to new column
        DB::statement('UPDATE sessions SET new_id = id');

        // Step 3: Drop old primary key
        $constraint = DB::selectOne("
            SELECT name 
            FROM sys.key_constraints 
            WHERE type = 'PK' AND parent_object_id = OBJECT_ID('sessions')
        ")->name;

        DB::statement("ALTER TABLE sessions DROP CONSTRAINT [$constraint]");

        // Step 4: Drop old column, rename new column, set primary key
        Schema::table('sessions', function (Blueprint $table) {
            $table->dropColumn('id');
            $table->renameColumn('new_id', 'id');
            $table->primary('id');
        });
    }

    public function down(): void
    {
        // Reverse: restore original UUID column as NON-NULLABLE
        Schema::table('sessions', function (Blueprint $table) {
            $table->uuid('old_id'); // remove nullable()
        });

        DB::statement('UPDATE sessions SET old_id = id');

        $constraint = DB::selectOne("
            SELECT name 
            FROM sys.key_constraints 
            WHERE type = 'PK' AND parent_object_id = OBJECT_ID('sessions')
        ")->name;

        DB::statement("ALTER TABLE sessions DROP CONSTRAINT [$constraint]");

        Schema::table('sessions', function (Blueprint $table) {
            $table->dropColumn('id');
            $table->renameColumn('old_id', 'id');
            $table->primary('id');
        });
    }
};