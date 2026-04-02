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
        Schema::table('students', function (Blueprint $table) {
            // FACEIO specific fields for secure biometric storage
            $table->string('faceio_enrollment_id')->nullable()->unique()->after('student_id'); // Unique FACEIO enrollment ID
            $table->text('faceio_biometric_hash')->nullable()->after('faceio_enrollment_id'); // Hashed biometric payload
            $table->timestamp('faceio_enrollment_date')->nullable()->after('faceio_biometric_hash'); // When enrollment occurred
            $table->boolean('faceio_liveness_verified')->default(false)->after('faceio_enrollment_date'); // Liveness detection passed
        });

        Schema::table('attendance_records', function (Blueprint $table) {
            // Add FACEIO verification hash to attendance records
            $table->text('biometric_verification_hash')->nullable()->after('biometric_accuracy'); // Hash of biometric used for this attendance
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['faceio_enrollment_id', 'faceio_biometric_hash', 'faceio_enrollment_date', 'faceio_liveness_verified']);
            $table->dropUnique(['faceio_enrollment_id']);
        });

        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropColumn(['biometric_verification_hash']);
        });
    }
};
