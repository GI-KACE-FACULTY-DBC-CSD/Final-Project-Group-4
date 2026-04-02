<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->uuid('course_id')->nullable()->after('student_id');
            $table->foreign('course_id')->references('id')->on('courses')->onDelete('set null');
        });

        // Backfill: create a course per distinct existing course string and set course_id
        $distinctCourses = DB::table('students')->distinct()->pluck('course')->filter();
        foreach ($distinctCourses as $courseName) {
            $courseId = (string) \Illuminate\Support\Str::uuid();
            DB::table('courses')->insert([
                'id' => $courseId,
                'name' => $courseName,
                'code' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            DB::table('students')->where('course', $courseName)->update(['course_id' => $courseId]);
        }

        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn('course');
        });

        Schema::table('class_sessions', function (Blueprint $table) {
            $table->uuid('course_id')->nullable()->after('location');
            $table->foreign('course_id')->references('id')->on('courses')->onDelete('set null');
        });

        // Backfill sessions: create courses for any session course not yet in courses, then set course_id
        $courseMap = DB::table('courses')->pluck('id', 'name');
        $distinctSessionCourses = DB::table('class_sessions')->distinct()->pluck('course')->filter();
        foreach ($distinctSessionCourses as $courseName) {
            if (! $courseMap->has($courseName)) {
                $courseId = (string) \Illuminate\Support\Str::uuid();
                DB::table('courses')->insert([
                    'id' => $courseId,
                    'name' => $courseName,
                    'code' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $courseMap->put($courseName, $courseId);
            }
        }
        $sessions = DB::table('class_sessions')->get();
        foreach ($sessions as $session) {
            $courseId = $courseMap->get($session->course);
            if ($courseId) {
                DB::table('class_sessions')->where('id', $session->id)->update(['course_id' => $courseId]);
            }
        }

        Schema::table('class_sessions', function (Blueprint $table) {
            $table->dropColumn('course');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->string('course')->nullable()->after('student_id');
        });
        // Restore course name from courses table where course_id set
        $students = DB::table('students')->whereNotNull('course_id')->get();
        foreach ($students as $s) {
            $course = DB::table('courses')->where('id', $s->course_id)->first();
            if ($course) {
                DB::table('students')->where('id', $s->id)->update(['course' => $course->name]);
            }
        }
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn('course_id');
        });

        Schema::table('class_sessions', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->string('course')->nullable()->after('location');
        });
        $sessions = DB::table('class_sessions')->whereNotNull('course_id')->get();
        foreach ($sessions as $s) {
            $course = DB::table('courses')->where('id', $s->course_id)->first();
            if ($course) {
                DB::table('class_sessions')->where('id', $s->id)->update(['course' => $course->name]);
            }
        }
        Schema::table('class_sessions', function (Blueprint $table) {
            $table->dropColumn('course_id');
        });
    }
};
