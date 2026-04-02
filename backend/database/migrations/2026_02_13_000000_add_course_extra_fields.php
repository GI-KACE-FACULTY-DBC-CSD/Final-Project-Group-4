<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            if (!Schema::hasColumn('courses', 'description')) {
                $table->text('description')->nullable()->after('code');
            }
            if (!Schema::hasColumn('courses', 'duration_weeks')) {
                $table->integer('duration_weeks')->nullable()->after('description');
            }
        });

        Schema::table('course_modules', function (Blueprint $table) {
            if (!Schema::hasColumn('course_modules', 'description')) {
                $table->text('description')->nullable()->after('name');
            }
            if (!Schema::hasColumn('course_modules', 'duration_hours')) {
                $table->integer('duration_hours')->nullable()->after('description');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_modules', function (Blueprint $table) {
            if (Schema::hasColumn('course_modules', 'duration_hours')) {
                $table->dropColumn('duration_hours');
            }
            if (Schema::hasColumn('course_modules', 'description')) {
                $table->dropColumn('description');
            }
        });

        Schema::table('courses', function (Blueprint $table) {
            if (Schema::hasColumn('courses', 'duration_weeks')) {
                $table->dropColumn('duration_weeks');
            }
            if (Schema::hasColumn('courses', 'description')) {
                $table->dropColumn('description');
            }
        });
    }
};
