<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('student_id');
            $table->foreign('student_id')
                  ->references('id')
                  ->on('students')
                  ->onDelete('cascade');   // OK

            $table->uuid('session_id');
            $table->foreign('session_id')
                  ->references('id')
                  ->on('class_sessions')
                  ->onDelete('no action');  // FIX HERE

            $table->dateTime('timestamp');
            $table->dateTime('time_in');
            $table->dateTime('time_out')->nullable();

            $table->enum('status', ['present', 'late', 'absent'])->default('present');

            $table->integer('accuracy');

            $table->enum('biometric_type', ['fingerprint', 'facial'])->default('facial');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};