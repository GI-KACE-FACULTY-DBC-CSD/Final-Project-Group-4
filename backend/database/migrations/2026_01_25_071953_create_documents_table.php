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
        Schema::create('documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('type');
            $table->bigInteger('size');

            $table->uuid('uploaded_by');
            $table->foreign('uploaded_by')
                  ->references('id')
                  ->on('lecturers')
                  ->onDelete('cascade'); // keep cascade

            $table->dateTime('uploaded_at');

            $table->uuid('session_id');
            $table->foreign('session_id')
                  ->references('id')
                  ->on('class_sessions')
                  ->onDelete('no action'); // FIX HERE

            $table->string('url');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};