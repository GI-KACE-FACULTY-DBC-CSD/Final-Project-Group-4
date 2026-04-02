<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Student;
use App\Models\ClassSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function attendance(Request $request)
    {
        $request->validate([
            'student_id' => 'nullable|string',
            'session_id' => 'nullable|string',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $query = AttendanceRecord::with(['student.user', 'session']);

        if ($request->has('student_id') && $request->student_id) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('session_id') && $request->session_id) {
            $query->where('session_id', $request->session_id);
        }

        if ($request->has('date_from')) {
            $query->whereDate('timestamp', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('timestamp', '<=', $request->date_to);
        }

        $records = $query->orderBy('timestamp', 'desc')->get()->map(function ($record) {
            return [
                'id' => $record->id,
                'studentId' => $record->student->id ?? null,
                'studentName' => $record->student->user->name ?? 'Unknown',
                'studentIdCode' => $record->student->student_id ?? 'N/A',
                'sessionId' => $record->session->id ?? null,
                'sessionName' => $record->session->name ?? 'Unknown',
                'timestamp' => $record->timestamp->toISOString(),
                'timeIn' => $record->time_in->toISOString(),
                'timeOut' => $record->time_out ? $record->time_out->toISOString() : null,
                'status' => $record->status,
                'accuracy' => $record->accuracy,
                'biometricType' => $record->biometric_type,
            ];
        });

        // Calculate statistics
        $stats = [
            'total' => $records->count(),
            'present' => $records->where('status', 'present')->count(),
            'late' => $records->where('status', 'late')->count(),
            'absent' => $records->where('status', 'absent')->count(),
            'avgAccuracy' => $records->avg('accuracy') ?? 0,
        ];

        return response()->json([
            'records' => $records,
            'statistics' => $stats,
        ]);
    }

    public function student(Request $request, $id)
    {
        $student = Student::with(['user', 'course'])->where('id', $id)->firstOrFail();

        $query = AttendanceRecord::where('student_id', $student->id)
            ->with('session')
            ->orderBy('timestamp', 'desc');

        if ($request->has('date_from')) {
            $query->whereDate('timestamp', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('timestamp', '<=', $request->date_to);
        }

        $records = $query->get()->map(function ($record) {
            return [
                'id' => $record->id,
                'sessionId' => $record->session->id ?? null,
                'sessionName' => $record->session->name ?? 'Unknown',
                'timestamp' => $record->timestamp->toISOString(),
                'timeIn' => $record->time_in->toISOString(),
                'timeOut' => $record->time_out ? $record->time_out->toISOString() : null,
                'status' => $record->status,
                'accuracy' => $record->accuracy,
                'biometricType' => $record->biometric_type,
            ];
        });

        // Calculate statistics
        $totalSessions = $records->count();
        $presentCount = $records->where('status', 'present')->count();
        $lateCount = $records->where('status', 'late')->count();
        $attendanceRate = $totalSessions > 0 ? round(($presentCount / $totalSessions) * 100, 2) : 0;

        return response()->json([
            'student' => [
                'id' => $student->id,
                'name' => $student->user->name,
                'email' => $student->user->email,
                'studentId' => $student->student_id,
                'courseId' => $student->course_id,
                'courseName' => $student->course->name ?? null,
                'courseCode' => $student->course->code ?? null,
                'year' => $student->year,
            ],
            'records' => $records,
            'statistics' => [
                'totalSessions' => $totalSessions,
                'present' => $presentCount,
                'late' => $lateCount,
                'attendanceRate' => $attendanceRate,
                'avgAccuracy' => round($records->avg('accuracy') ?? 0, 2),
            ],
        ]);
    }

    /**
     * Summary for admin reports page: totals + per-session breakdown (real data).
     */
    public function summary(Request $request)
    {
        $records = AttendanceRecord::with(['session'])->orderBy('timestamp', 'desc')->get();

        $totalRecords = $records->count();
        $totalStudents = (int) $records->pluck('student_id')->unique()->count();
        $presentCount = $records->where('status', 'present')->count();
        $lateCount = $records->where('status', 'late')->count();
        $absentCount = $records->where('status', 'absent')->count();
        $attendedCount = $presentCount + $lateCount;
        $averageRate = $totalRecords > 0 ? round(($attendedCount / $totalRecords) * 100, 1) : 0;

        $bySession = $records->groupBy('session_id')->map(function ($sessionRecords, $sessionId) {
            $first = $sessionRecords->first();
            $session = $first && $first->relationLoaded('session') ? $first->session : null;
            $date = $session && $session->start_time ? $session->start_time->toISOString() : null;
            return [
                'id' => $sessionId,
                'name' => $session ? ($session->name ?? 'Unknown') : 'Unknown',
                'date' => $date,
                'present' => $sessionRecords->where('status', 'present')->count(),
                'late' => $sessionRecords->where('status', 'late')->count(),
                'absent' => $sessionRecords->where('status', 'absent')->count(),
            ];
        })->values()->toArray();

        return response()->json([
            'total_records' => $totalRecords,
            'total_students' => $totalStudents,
            'average_rate' => $averageRate,
            'sessions' => $bySession,
        ]);
    }
}
