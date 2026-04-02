<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Points balance per student
        Schema::create('student_points', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id')->unique();
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->unsignedInteger('points_balance')->default(0);
            $table->timestamps();
        });

        // Point earn/spend history
        Schema::create('point_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->integer('amount'); // positive = earn, negative = spend
            $table->string('type', 32); // 'checkin', 'perfect_week', 'redemption', etc.
            $table->string('reference')->nullable(); // e.g. privilege_id for redemptions
            $table->timestamps();
        });

        // Badges/achievements earned (unlock once)
        Schema::create('student_achievements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->string('achievement_key', 64); // e.g. first_checkin, perfect_week_1
            $table->timestamp('earned_at');
            $table->timestamps();
            $table->unique(['student_id', 'achievement_key']);
        });

        // Redeemable privileges (school rewards)
        Schema::create('redeemable_privileges', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('points_cost');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Redemptions (student spent points for a privilege)
        Schema::create('redemptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->uuid('privilege_id');
            $table->foreign('privilege_id')->references('id')->on('redeemable_privileges')->onDelete('cascade');
            $table->unsignedInteger('points_spent');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('redemptions');
        Schema::dropIfExists('redeemable_privileges');
        Schema::dropIfExists('student_achievements');
        Schema::dropIfExists('point_transactions');
        Schema::dropIfExists('student_points');
    }
};
