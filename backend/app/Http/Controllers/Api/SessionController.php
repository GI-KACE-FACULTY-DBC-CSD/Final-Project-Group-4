<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassSession;
use App\Models\Student;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    /**
     * Public list of sessions (no auth) for check-in kiosk to show current/upcoming sessions.
     */
    public function publicIndex(Request $request)
    {
        $sessions = ClassSession::with(['lecturer.user', 'course'])->get()->map(function ($session) {
            return [
                'id' => $session->id,
                'name' => $session->name,
                'lecturerId' => $session->lecturer->id ?? null,
                'startTime' => $session->start_time->toISOString(),
                'endTime' => $session->end_time->toISOString(),
                'location' => $session->location,
                'courseId' => $session->course_id,
                'courseName' => $session->course->name ?? null,
                'courseCode' => $session->course->code ?? null,
                'status' => $session->status,
                'attendanceCount' => $session->attendance_count,
                'totalStudents' => $session->total_students,
            ];
        });

        return response()->json($sessions);
    }

    public function index(Request $request)
    {
        $sessions = ClassSession::with(['lecturer.user', 'course'])->get()->map(function ($session) {
            return [
                'id' => $session->id,
                'name' => $session->name,
                'lecturerId' => $session->lecturer->id ?? null,
                'startTime' => $session->start_time->toISOString(),
                'endTime' => $session->end_time->toISOString(),
                'location' => $session->location,
                'courseId' => $session->course_id,
                'courseName' => $session->course->name ?? null,
                'courseCode' => $session->course->code ?? null,
                'status' => $session->status,
                'attendanceCount' => $session->attendance_count,
                'totalStudents' => $session->total_students,
            ];
        });

        return response()->json($sessions);
    }

    public function show($id)
    {
        $session = ClassSession::with(['lecturer.user', 'course'])->where('id', $id)->firstOrFail();

        return response()->json([
            'id' => $session->id,
            'name' => $session->name,
            'lecturerId' => $session->lecturer->id ?? null,
            'startTime' => $session->start_time->toISOString(),
            'endTime' => $session->end_time->toISOString(),
            'location' => $session->location,
            'courseId' => $session->course_id,
            'courseName' => $session->course->name ?? null,
            'courseCode' => $session->course->code ?? null,
            'status' => $session->status,
            'attendanceCount' => $session->attendance_count,
            'totalStudents' => $session->total_students,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'lecturer_id' => 'required|exists:lecturers,id',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'location' => 'required|string',
            'course_id' => 'required|string|exists:courses,id',
        ]);

        $validated['status'] = 'upcoming';
        $validated['attendance_count'] = 0;
        $validated['total_students'] = Student::where('course_id', $validated['course_id'])->count();

        $session = ClassSession::create($validated);
        $session->load('course');

        return response()->json([
            'id' => $session->id,
            'name' => $session->name,
            'lecturerId' => $session->lecturer->id ?? null,
            'startTime' => $session->start_time->toISOString(),
            'endTime' => $session->end_time->toISOString(),
            'location' => $session->location,
            'courseId' => $session->course_id,
            'courseName' => $session->course->name ?? null,
            'courseCode' => $session->course->code ?? null,
            'status' => $session->status,
            'attendanceCount' => $session->attendance_count,
            'totalStudents' => $session->total_students,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $session = ClassSession::where('id', $id)->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'start_time' => 'sometimes|date',
            'end_time' => 'sometimes|date|after:start_time',
            'location' => 'sometimes|string',
            'course_id' => 'sometimes|string|exists:courses,id',
        ]);

        if (isset($validated['course_id'])) {
            $validated['total_students'] = Student::where('course_id', $validated['course_id'])->count();
        }

        $session->update($validated);
        $session->load(['lecturer.user', 'course']);

        return response()->json([
            'id' => $session->id,
            'name' => $session->name,
            'lecturerId' => $session->lecturer->id ?? null,
            'startTime' => $session->start_time->toISOString(),
            'endTime' => $session->end_time->toISOString(),
            'location' => $session->location,
            'courseId' => $session->course_id,
            'courseName' => $session->course->name ?? null,
            'courseCode' => $session->course->code ?? null,
            'status' => $session->status,
            'attendanceCount' => $session->attendance_count,
            'totalStudents' => $session->total_students,
        ]);
    }

    public function destroy($id)
    {
        $session = ClassSession::where('id', $id)->firstOrFail();
        $session->delete();

        return response()->json(['message' => 'Session deleted successfully']);
    }

    /**
     * Get active (ongoing) sessions that a student belongs to (by course match).
     */
    public function activeForStudent($studentId)
    {
        $student = Student::with('user')->where('id', $studentId)->firstOrFail();
        $now = now();

        $sessions = ClassSession::with(['lecturer.user', 'course'])
            ->where('course_id', $student->course_id)
            ->where('start_time', '<=', $now)
            ->where('end_time', '>', $now)
            ->get()
            ->map(function ($session) {
                return [
                    'id' => $session->id,
                    'name' => $session->name,
                    'lecturerId' => $session->lecturer->id ?? null,
                    'startTime' => $session->start_time->toISOString(),
                    'endTime' => $session->end_time->toISOString(),
                    'location' => $session->location,
                    'courseId' => $session->course_id,
                    'courseName' => $session->course->name ?? null,
                    'status' => $session->status,
                    'attendanceCount' => $session->attendance_count,
                    'totalStudents' => $session->total_students,
                ];
            });

        return response()->json($sessions);
    }
}
