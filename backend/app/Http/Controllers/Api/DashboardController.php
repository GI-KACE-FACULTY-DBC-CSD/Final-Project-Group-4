<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Lecturer;
use App\Models\ClassSession;
use App\Models\Alert;
use App\Models\AttendanceRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Lightweight stats for admin dashboard (one fast request instead of five heavy ones).
     */
    public function stats(Request $request)
    {
        $user = $request->user();
        if (! $user || $user->role !== 'admin') {
            abort(403, 'Forbidden');
        }

        $studentsCount = Student::count();
        $lecturersCount = Lecturer::count();
        $sessions = ClassSession::count();
        $ongoingSessions = ClassSession::where('status', 'ongoing')->count();
        $unreadAlertsCount = Alert::where('read', false)->count();

        $totalAttendance = AttendanceRecord::count();
        $presentCount = AttendanceRecord::where('status', 'present')->count();
        $attendanceRate = $totalAttendance > 0
            ? (int) round(($presentCount / $totalAttendance) * 100)
            : 0;

        // Last 7 days trend: single aggregated query (PostgreSQL and SQLite compatible)
        $startDate = Carbon::today()->subDays(6)->startOfDay();
        $driver = DB::connection()->getDriverName();
        $dateExpr = $driver === 'sqlite' ? 'date(timestamp)' : 'DATE(timestamp)';
        $rows = AttendanceRecord::query()
            ->select(DB::raw("{$dateExpr} as day"), 'status', DB::raw('COUNT(*) as cnt'))
            ->where('timestamp', '>=', $startDate)
            ->groupBy(DB::raw($dateExpr), 'status')
            ->get();

        $byDay = [];
        foreach ($rows as $r) {
            $day = $r->day instanceof \DateTimeInterface
                ? $r->day->format('Y-m-d')
                : (is_string($r->day) ? substr($r->day, 0, 10) : (string) $r->day);
            if (! isset($byDay[$day])) {
                $byDay[$day] = ['present' => 0, 'late' => 0, 'absent' => 0, 'total' => 0];
            }
            $byDay[$day][$r->status] = (int) $r->cnt;
            $byDay[$day]['total'] += (int) $r->cnt;
        }

        $attendanceTrend = [];
        for ($i = 0; $i < 7; $i++) {
            $date = Carbon::today()->subDays(6 - $i);
            $dayKey = $date->format('Y-m-d');
            $dayData = $byDay[$dayKey] ?? ['present' => 0, 'late' => 0, 'absent' => 0, 'total' => 0];
            $attendanceTrend[] = [
                'date' => $date->format('M j'),
                'present' => $dayData['present'],
                'late' => $dayData['late'],
                'absent' => $dayData['absent'],
                'total' => $dayData['total'],
            ];
        }

        // Recent alerts only (limit 6)
        $recentAlerts = Alert::with(['student.user', 'session'])
            ->orderBy('timestamp', 'desc')
            ->limit(6)
            ->get()
            ->map(function ($alert) {
                return [
                    'id' => $alert->id,
                    'type' => $alert->type,
                    'message' => $alert->message,
                    'studentId' => $alert->student_id,
                    'sessionId' => $alert->session_id,
                    'timestamp' => $alert->timestamp->toISOString(),
                    'severity' => $alert->severity,
                    'read' => $alert->read,
                ];
            });

        return response()->json([
            'stats' => [
                'students' => $studentsCount,
                'lecturers' => $lecturersCount,
                'sessions' => $sessions,
                'alerts' => $unreadAlertsCount,
                'totalAttendance' => $totalAttendance,
                'attendanceRate' => $attendanceRate,
                'ongoingSessions' => $ongoingSessions,
            ],
            'attendanceTrend' => $attendanceTrend,
            'recentAlerts' => $recentAlerts,
        ]);
    }
}
