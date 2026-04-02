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
        Schema::create('alerts', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->enum('type', ['late_arrival', 'low_confidence', 'absence', 'system']);
            $table->string('message');

            $table->uuid('student_id')->nullable();
            $table->foreign('student_id')
                  ->references('id')
                  ->on('students')
                  ->onDelete('cascade'); // keep cascade here

            $table->uuid('session_id')->nullable();
            $table->foreign('session_id')
                  ->references('id')
                  ->on('class_sessions')
                  ->onDelete('no action'); // FIX

            $table->dateTime('timestamp');

            $table->enum('severity', ['info', 'warning', 'error'])->default('info');

            $table->boolean('read')->default(false);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};