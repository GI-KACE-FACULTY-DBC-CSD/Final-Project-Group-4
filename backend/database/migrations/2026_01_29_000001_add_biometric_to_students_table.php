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
            $table->string('biometric_type', 20)->nullable()->after('accuracy'); // 'fingerprint' | 'facial'
            $table->text('biometric_template')->nullable()->after('biometric_type'); // JSON string of face embeddings/features
            $table->text('face_image')->nullable()->after('biometric_template'); // Base64 encoded face image for reference
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['biometric_type', 'biometric_template', 'face_image']);
        });
    }
};
