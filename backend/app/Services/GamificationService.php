<?php

namespace App\Services;

use App\Models\Student;
use App\Models\StudentPoints;
use App\Models\PointTransaction;
use App\Models\StudentAchievement;
use App\Models\AttendanceRecord;
use App\Models\ClassSession;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class GamificationService
{
    public const POINTS_CHECKIN_PRESENT = 10;
    public const POINTS_CHECKIN_LATE = 5;
    public const POINTS_PERFECT_WEEK = 50;
    public const POINTS_PERFECT_MONTH = 100;
    public const POINTS_STREAK_3 = 30;
    public const POINTS_STREAK_5 = 50;
    public const POINTS_FIRST_CHECKIN = 25;

    /** Award points for a check-in. Call when attendance record is created. */
    public function awardCheckInPoints(string $studentId, string $status = 'present'): void
    {
        $points = $status === 'present' ? self::POINTS_CHECKIN_PRESENT : self::POINTS_CHECKIN_LATE;
        $this->addPoints($studentId, $points, 'checkin');

        // First check-in achievement
        $count = AttendanceRecord::where('student_id', $studentId)->count();
        if ($count === 1) {
            $this->grantAchievement($studentId, 'first_checkin', self::POINTS_FIRST_CHECKIN);
        }
    }

    public function addPoints(string $studentId, int $amount, string $type, ?string $reference = null): void
    {
        $row = StudentPoints::firstOrCreate(
            ['student_id' => $studentId],
            ['points_balance' => 0]
        );
        $row->increment('points_balance', $amount);
        PointTransaction::create([
            'student_id' => $studentId,
            'amount' => $amount,
            'type' => $type,
            'reference' => $reference,
        ]);
    }

    public function grantAchievement(string $studentId, string $key, int $bonusPoints = 0): bool
    {
        $exists = StudentAchievement::where('student_id', $studentId)->where('achievement_key', $key)->exists();
        if ($exists) {
            return false;
        }
        StudentAchievement::create([
            'student_id' => $studentId,
            'achievement_key' => $key,
            'earned_at' => now(),
        ]);
        if ($bonusPoints > 0) {
            $this->addPoints($studentId, $bonusPoints, 'achievement', $key);
        }
        return true;
    }

    /** Compute streaks and perfect weeks/months from attendance; grant achievements and points. */
    public function syncAchievementsAndStreaks(Student $student): array
    {
        $courseId = $student->course_id;
        if (!$courseId) {
            return ['current_week_streak' => 0, 'current_month_streak' => 0, 'perfect_weeks' => 0, 'perfect_months' => 0];
        }

        $sessions = ClassSession::where('course_id', $courseId)
            ->where('start_time', '<=', now())
            ->orderBy('start_time')
            ->get();

        $records = AttendanceRecord::where('student_id', $student->id)
            ->whereIn('status', ['present', 'late'])
            ->get()
            ->keyBy('session_id');

        // Group sessions by week (year-week) and month (year-month)
        $byWeek = [];
        $byMonth = [];
        foreach ($sessions as $s) {
            $dt = Carbon::parse($s->start_time);
            $wk = $dt->format('Y-W');
            $mo = $dt->format('Y-m');
            if (!isset($byWeek[$wk])) {
                $byWeek[$wk] = [];
            }
            $byWeek[$wk][] = $s->id;
            if (!isset($byMonth[$mo])) {
                $byMonth[$mo] = [];
            }
            $byMonth[$mo][] = $s->id;
        }

        $perfectWeeks = 0;
        $perfectMonths = 0;
        foreach ($byWeek as $weekKey => $sessionIds) {
            $attended = count(array_filter($sessionIds, fn($id) => $records->has($id)));
            if ($attended === count($sessionIds) && count($sessionIds) > 0) {
                $perfectWeeks++;
            }
        }
        foreach ($byMonth as $monthKey => $sessionIds) {
            $attended = count(array_filter($sessionIds, fn($id) => $records->has($id)));
            if ($attended === count($sessionIds) && count($sessionIds) > 0) {
                $perfectMonths++;
            }
        }

        // Consecutive week streak (from most recent backwards)
        $weeksOrdered = array_keys($byWeek);
        rsort($weeksOrdered);
        $currentWeekStreak = 0;
        foreach ($weeksOrdered as $wk) {
            $sessionIds = $byWeek[$wk];
            $attended = count(array_filter($sessionIds, fn($id) => $records->has($id)));
            if ($attended === count($sessionIds) && count($sessionIds) > 0) {
                $currentWeekStreak++;
            } else {
                break;
            }
        }

        $monthsOrdered = array_keys($byMonth);
        rsort($monthsOrdered);
        $currentMonthStreak = 0;
        foreach ($monthsOrdered as $mo) {
            $sessionIds = $byMonth[$mo];
            $attended = count(array_filter($sessionIds, fn($id) => $records->has($id)));
            if ($attended === count($sessionIds) && count($sessionIds) > 0) {
                $currentMonthStreak++;
            } else {
                break;
            }
        }

        // Grant achievements (once)
        if ($perfectWeeks >= 1) {
            $this->grantAchievement($student->id, 'perfect_week_1', self::POINTS_PERFECT_WEEK);
        }
        if ($perfectMonths >= 1) {
            $this->grantAchievement($student->id, 'perfect_month_1', self::POINTS_PERFECT_MONTH);
        }
        if ($currentWeekStreak >= 3) {
            $this->grantAchievement($student->id, 'streak_weeks_3', self::POINTS_STREAK_3);
        }
        if ($currentWeekStreak >= 5) {
            $this->grantAchievement($student->id, 'streak_weeks_5', self::POINTS_STREAK_5);
        }

        return [
            'current_week_streak' => $currentWeekStreak,
            'current_month_streak' => $currentMonthStreak,
            'perfect_weeks' => $perfectWeeks,
            'perfect_months' => $perfectMonths,
        ];
    }

    /** Leaderboard by points earned in period; shows actual student names. */
    public function getLeaderboard(string $period = 'week', int $limit = 20): array
    {
        $start = $period === 'month'
            ? Carbon::now()->startOfMonth()
            : Carbon::now()->startOfWeek();
        $end = Carbon::now();

        $totals = PointTransaction::where('amount', '>', 0)
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('student_id, sum(amount) as total')
            ->groupBy('student_id')
            ->orderByDesc('total')
            ->limit($limit)
            ->get();

        $studentIds = $totals->pluck('student_id')->filter()->unique()->values()->all();
        $students = Student::with('user')->whereIn('id', $studentIds)->get()->keyBy('id');

        $result = [];
        foreach ($totals as $index => $row) {
            $student = $students->get($row->student_id);
            $label = $student && $student->user
                ? trim($student->user->name)
                : ($student ? $student->student_id : 'Student');
            if ($label === '') {
                $label = $student ? $student->student_id : 'Student';
            }

            $result[] = [
                'rank' => $index + 1,
                'label' => $label,
                'points' => (int) $row->total,
                'student_id' => $row->student_id,
            ];
        }
        return $result;
    }
}
