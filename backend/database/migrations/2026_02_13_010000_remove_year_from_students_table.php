<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RemoveYearFromStudentsTable extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('students', 'year')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropColumn('year');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('students', 'year')) {
            Schema::table('students', function (Blueprint $table) {
                $table->integer('year')->nullable();
            });
        }
    }
}
