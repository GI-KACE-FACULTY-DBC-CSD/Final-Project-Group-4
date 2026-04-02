<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Student;
use App\Models\Lecturer;
use App\Models\ClassSession;
use App\Models\AttendanceRecord;
use App\Models\Alert;
use App\Models\Course;
use Illuminate\Support\Facades\DB;

class ResetStudentsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'students:reset';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset all students data while keeping admin and lecturer accounts';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Resetting students data...');

        // Delete all attendance records
        AttendanceRecord::truncate();
        $this->info('✓ Cleared attendance records');

        // Delete all alerts
        Alert::truncate();
        $this->info('✓ Cleared alerts');

        // Delete all class sessions
        ClassSession::truncate();
        $this->info('✓ Cleared class sessions');

        // Delete all students (this will cascade to users due to foreign key)
        Student::truncate();
        $this->info('✓ Cleared students');

        // Delete student user accounts (keep admin and lecturer)
        User::where('role', 'student')->delete();
        $this->info('✓ Cleared student user accounts');

        // Keep admin and lecturer accounts
        $adminCount = User::where('role', 'admin')->count();
        $lecturerCount = User::where('role', 'lecturer')->count();

        $this->info("✓ Kept {$adminCount} admin account(s)");
        $this->info("✓ Kept {$lecturerCount} lecturer account(s)");

        $this->info('Students data reset complete!');
        $this->info('You can now register new students through the admin panel.');

        return Command::SUCCESS;
    }
}