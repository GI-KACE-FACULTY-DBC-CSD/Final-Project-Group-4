<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Re-add faceio biometric columns if they were removed so enrollment works.
     */
    public function up(): void
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
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'faceio_enrollment_id')) {
                $table->dropUnique(['faceio_enrollment_id']);
                $table->dropColumn('faceio_enrollment_id');
            }
            if (Schema::hasColumn('students', 'faceio_biometric_hash')) {
                $table->dropColumn('faceio_biometric_hash');
            }
            if (Schema::hasColumn('students', 'faceio_enrollment_date')) {
                $table->dropColumn('faceio_enrollment_date');
            }
            if (Schema::hasColumn('students', 'faceio_liveness_verified')) {
                $table->dropColumn('faceio_liveness_verified');
            }
        });
    }
};
