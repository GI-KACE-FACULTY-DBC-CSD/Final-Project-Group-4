<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentPoints;
use App\Models\PointTransaction;
use App\Models\StudentAchievement;
use App\Models\RedeemablePrivilege;
use App\Models\Redemption;
use App\Services\GamificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GamificationController extends Controller
{
    protected GamificationService $gamification;

    public function __construct(GamificationService $gamification)
    {
        $this->gamification = $gamification;
    }

    protected function getStudentFromAuth(Request $request): ?Student
    {
        $user = $request->user();
        if (!$user || $user->role !== 'student') {
            return null;
        }
        return Student::where('user_id', $user->id)->first();
    }

    /** Achievement keys and display labels. */
    public static function achievementLabels(): array
    {
        return [
            'first_checkin' => ['label' => 'First Check-in', 'icon' => 'star'],
            'perfect_week_1' => ['label' => 'Perfect Week', 'icon' => 'calendar'],
            'perfect_month_1' => ['label' => 'Perfect Month', 'icon' => 'trophy'],
            'streak_weeks_3' => ['label' => '3-Week Streak', 'icon' => 'flame'],
            'streak_weeks_5' => ['label' => '5-Week Streak', 'icon' => 'flame'],
        ];
    }

    /**
     * GET /gamification/me - Current student's streaks, badges, points, recent transactions.
     */
    public function me(Request $request): JsonResponse
    {
        $student = $this->getStudentFromAuth($request);
        if (!$student) {
            return response()->json(['message' => 'Student not found.'], 403);
        }

        $streaks = $this->gamification->syncAchievementsAndStreaks($student);

        $pointsRow = StudentPoints::firstOrCreate(
            ['student_id' => $student->id],
            ['points_balance' => 0]
        );

        $achievements = StudentAchievement::where('student_id', $student->id)
            ->orderBy('earned_at', 'desc')
            ->get()
            ->map(function ($a) {
                $meta = self::achievementLabels()[$a->achievement_key] ?? ['label' => $a->achievement_key, 'icon' => 'award'];
                return [
                    'key' => $a->achievement_key,
                    'label' => $meta['label'],
                    'icon' => $meta['icon'],
                    'earned_at' => $a->earned_at->toISOString(),
                ];
            });

        $recentTransactions = PointTransaction::where('student_id', $student->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn ($t) => [
                'amount' => $t->amount,
                'type' => $t->type,
                'reference' => $t->reference,
                'created_at' => $t->created_at->toISOString(),
            ]);

        return response()->json([
            'points_balance' => $pointsRow->points_balance,
            'streaks' => $streaks,
            'badges' => $achievements,
            'achievements' => $achievements,
            'recent_transactions' => $recentTransactions,
        ]);
    }

    /**
     * GET /gamification/leaderboard?period=week|month - Anonymized leaderboard.
     */
    public function leaderboard(Request $request): JsonResponse
    {
        $period = $request->input('period', 'week');
        if (!in_array($period, ['week', 'month'], true)) {
            $period = 'week';
        }
        $list = $this->gamification->getLeaderboard($period, 20);
        $student = $this->getStudentFromAuth($request);
        $myRank = null;
        if ($student) {
            foreach ($list as $row) {
                if (($row['student_id'] ?? '') === $student->id) {
                    $myRank = $row['rank'];
                    break;
                }
            }
        }
        return response()->json([
            'period' => $period,
            'leaderboard' => array_map(fn ($r) => [
                'rank' => $r['rank'],
                'label' => $r['label'],
                'points' => $r['points'],
            ], $list),
            'my_rank' => $myRank,
        ]);
    }

    /**
     * GET /gamification/privileges - List redeemable privileges.
     */
    public function privileges(): JsonResponse
    {
        $list = RedeemablePrivilege::where('is_active', true)->orderBy('points_cost')->get();
        return response()->json($list->map(fn ($p) => [
            'id' => $p->id,
            'name' => $p->name,
            'description' => $p->description,
            'points_cost' => $p->points_cost,
        ]));
    }

    /**
     * POST /gamification/redeem - Redeem a privilege with points.
     */
    public function redeem(Request $request): JsonResponse
    {
        $request->validate(['privilege_id' => 'required|uuid|exists:redeemable_privileges,id']);

        $student = $this->getStudentFromAuth($request);
        if (!$student) {
            return response()->json(['message' => 'Student not found.'], 403);
        }

        $privilege = RedeemablePrivilege::where('id', $request->privilege_id)->where('is_active', true)->first();
        if (!$privilege) {
            return response()->json(['message' => 'Privilege not available.'], 404);
        }

        $pointsRow = StudentPoints::firstOrCreate(
            ['student_id' => $student->id],
            ['points_balance' => 0]
        );

        if ($pointsRow->points_balance < $privilege->points_cost) {
            return response()->json([
                'message' => 'Not enough points. You have ' . $pointsRow->points_balance . ', need ' . $privilege->points_cost . '.',
            ], 422);
        }

        $pointsRow->decrement('points_balance', $privilege->points_cost);
        PointTransaction::create([
            'student_id' => $student->id,
            'amount' => - (int) $privilege->points_cost,
            'type' => 'redemption',
            'reference' => $privilege->id,
        ]);
        Redemption::create([
            'student_id' => $student->id,
            'privilege_id' => $privilege->id,
            'points_spent' => $privilege->points_cost,
        ]);

        return response()->json([
            'message' => 'Redeemed successfully!',
            'privilege' => [
                'id' => $privilege->id,
                'name' => $privilege->name,
                'points_spent' => $privilege->points_cost,
            ],
            'new_balance' => $pointsRow->fresh()->points_balance,
        ]);
    }
}
