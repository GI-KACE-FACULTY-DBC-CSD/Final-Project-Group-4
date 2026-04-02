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
        // Remove FACEIO-specific columns from students and attendance_records
        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'faceio_enrollment_id')) {
                // Drop unique index then column
                try {
                    $table->dropUnique(['faceio_enrollment_id']);
                } catch (\Exception $e) {
                    // Ignore if index does not exist
                }
            }

            $columnsToDrop = [
                'faceio_enrollment_id',
                'faceio_biometric_hash',
                'faceio_enrollment_date',
                'faceio_liveness_verified',
            ];

            foreach ($columnsToDrop as $col) {
                if (Schema::hasColumn('students', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('attendance_records', function (Blueprint $table) {
            if (Schema::hasColumn('attendance_records', 'biometric_verification_hash')) {
                $table->dropColumn('biometric_verification_hash');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'faceio_enrollment_id')) {
                $table->string('faceio_enrollment_id')->nullable()->unique()->after('student_id');
            }
            if (!Schema::hasColumn('students', 'faceio_biometric_hash')) {
                $table->text('faceio_biometric_hash')->nullable()->after('faceio_enrollment_id');
            }
            if (!Schema::hasColumn('students', 'faceio_enrollment_date')) {
                $table->timestamp('faceio_enrollment_date')->nullable()->after('faceio_biometric_hash');
            }
            if (!Schema::hasColumn('students', 'faceio_liveness_verified')) {
                $table->boolean('faceio_liveness_verified')->default(false)->after('faceio_enrollment_date');
            }
        });

        Schema::table('attendance_records', function (Blueprint $table) {
            if (!Schema::hasColumn('attendance_records', 'biometric_verification_hash')) {
                $table->text('biometric_verification_hash')->nullable()->after('accuracy');
            }
        });
    }
};
