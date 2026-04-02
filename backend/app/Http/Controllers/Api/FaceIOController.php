<?php

namespace App\Http\Controllers\Api;

use App\Models\Student;
use App\Models\AttendanceRecord;
use App\Models\ClassSession;
use App\Http\Controllers\Controller;
use App\Services\GamificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FaceIOController extends Controller
{
    /** Allow check-in from this many hours before session start (same day). */
    private const EARLY_CHECKIN_HOURS = 2;

    /** Max euclidean distance to accept a face match (stricter = fewer false positives; 0.48 rejects wrong-person matches). */
    private const MAX_DESCRIPTOR_DISTANCE = 0.48;

    /** Min gap between best and second-best match; if smaller, match is ambiguous and we reject. */
    private const MIN_BEST_SECOND_GAP = 0.07;

    /**
     * Store facial biometric enrollment for a student (Face-API.js)
     * POST /api/biometric/enroll
     */
    public function enrollStudent(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'student_id' => 'required|string|exists:students,id',
                'biometric_hash' => 'required|string', // Hash from face-api.js
                'descriptor_data' => 'required|string', // Face descriptor as string
                'confidence' => 'numeric|min:0|max:1', // Confidence score
            ]);

            $student = Student::findOrFail($request->student_id);

            // Check if student already has enrollment
            if ($student->faceio_enrollment_id) {
                Log::warning("Student {$student->id} already has biometric enrollment");
                return response()->json([
                    'success' => false,
                    'message' => 'Student already has facial biometric enrolled. Revoke first to re-enroll.',
                ], 422);
            }

            // Store enrollment securely
            $student->update([
                'biometric_type' => 'face_api',
                'biometric_template' => $this->encryptBiometricData($request->descriptor_data),
                'faceio_enrollment_id' => $this->generateEnrollmentId(),
                'faceio_biometric_hash' => Hash::make($request->biometric_hash),
                'faceio_enrollment_date' => now(),
                'faceio_liveness_verified' => true,
            ]);

            Log::info("Face-API: Student {$student->id} enrolled successfully");

            return response()->json([
                'success' => true,
                'message' => 'Facial biometric enrolled successfully with liveness verification',
                'student_id' => $student->id,
                'enrollment_date' => $student->faceio_enrollment_date,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error("Face-API enrollment error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verify facial biometric for attendance check-in (Face-API.js)
     * POST /api/biometric/verify-attendance
     */
    public function verifyAttendance(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'biometric_hash' => 'required|string', // Hash from face-api.js verification
                'confidence' => 'numeric|min:0|max:1',
                'descriptor_data' => 'nullable|string', // Face descriptor (comma-separated floats) for server-side matching
            ]);

            $student = $this->resolveStudentFromFaceRequest($request);
            if (!$student) {
                if (Student::where('biometric_type', 'face_api')->whereNotNull('faceio_enrollment_id')->exists()) {
                    Log::warning("Face-API: No matching enrolled biometric found");
                    return response()->json([
                        'success' => false,
                        'message' => 'Facial verification failed. Face does not match any enrolled biometric.',
                    ], 422);
                }
                Log::warning("Face-API: No enrolled students found");
                return response()->json([
                    'success' => false,
                    'message' => 'Facial biometric not enrolled. Please enroll first.',
                ], 404);
            }

            // Student must be assigned to a course to clock in
            if (empty($student->course_id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not assigned to a course. Please contact administration.',
                ], 422);
            }

            // Once per day: if student already checked in today (any session), do not allow another check-in
            $now = now();
            $todayCheckIn = AttendanceRecord::where('student_id', $student->id)
                ->whereDate('time_in', $now->toDateString())
                ->orderBy('time_in')
                ->first();
            if ($todayCheckIn) {
                $student->load('user');
                $todayCheckIn->load('session');
                $timeStr = $todayCheckIn->time_in->format('g:i A');
                return response()->json([
                    'success' => true,
                    'already_checked_in_today' => true,
                    'message' => "You're already in! You checked in at {$timeStr}. Enjoy your day — no need to scan again.",
                    'student_name' => $student->user->name ?? $student->name ?? 'Student',
                    'student_id' => $student->student_id,
                    'time_in' => $todayCheckIn->time_in->toISOString(),
                    'session_name' => $todayCheckIn->session->name ?? null,
                ], 200);
            }

            // Find a session for this student's course that is "today" and within the check-in window.
            // Only allow check-in on the course's class days (schedule_days). If course is Tue/Wed/Fri, no check-in on Sunday even if a session exists for Sunday.
            $now = now();
            $todaySessions = ClassSession::where('course_id', $student->course_id)
                ->whereDate('start_time', $now->toDateString())
                ->orderBy('start_time')
                ->get();

            $student->load('course');
            $scheduleDays = $student->course->schedule_days ?? [];
            if (! empty($scheduleDays)) {
                $todaySessions = $todaySessions->filter(function ($s) use ($scheduleDays) {
                    $day = strtolower($s->start_time->format('D')); // "mon", "tue", "sun", etc.
                    return in_array($day, $scheduleDays, true);
                })->values();
            }

            $session = null;
            foreach ($todaySessions as $candidate) {
                $windowOpen = $candidate->start_time->copy()->subHours(self::EARLY_CHECKIN_HOURS);
                if ($now->gte($windowOpen) && $now->lte($candidate->end_time)) {
                    $session = $candidate;
                    break;
                }
            }

            if (! $session) {
                $message = $todaySessions->isEmpty()
                    ? 'No class scheduled for today for your course.'
                    : 'No active session for your course at the moment.';
                return response()->json([
                    'success' => false,
                    'message' => $message,
                ], 404);
            }

            $student->load('user');

            // Check if already marked attendance in this session
            $existingRecord = AttendanceRecord::where([
                'student_id' => $student->id,
                'session_id' => $session->id,
            ])->first();

            if ($existingRecord) {
                return response()->json([
                    'success' => false,
                    'message' => 'Attendance already marked for this session',
                    'student_name' => $student->user->name ?? $student->name ?? 'Student',
                    'time_in' => $existingRecord->time_in,
                ], 409);
            }

            // Record attendance: only columns from base migration to avoid 500 (omit optional biometric_verification_hash)
            $now = now();
            $attendance = AttendanceRecord::create([
                'student_id' => $student->id,
                'session_id' => $session->id,
                'timestamp' => $now,
                'time_in' => $now,
                'time_out' => null,
                'status' => 'present',
                'accuracy' => (int) min(100, max(0, round(($request->confidence ?? 0.95) * 100))),
                'biometric_type' => 'facial',
            ]);

            // Award gamification points for check-in
            try {
                app(GamificationService::class)->awardCheckInPoints($student->id, 'present');
            } catch (\Throwable $e) {
                Log::warning('Gamification award failed: ' . $e->getMessage());
            }

            // Log successful verification
            Log::info("Face-API: Attendance verified for student {$student->id}", [
                'session_id' => $session->id,
                'confidence' => $request->confidence,
                'biometric_hash' => substr($request->biometric_hash, 0, 16) . '...',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Attendance marked successfully via facial recognition',
                'student_name' => $student->user->name ?? $student->name,
                'student_id' => $student->student_id,
                'time_in' => $attendance->time_in,
                'session_name' => $session->name,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error("FACEIO verification error: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Facial verification failed. Please try again.',
            ], 500);
        }
    }

    /**
     * Sign out / checkout by face for the current session (set time_out on attendance record).
     * POST /api/biometric/checkout
     */
    public function checkoutAttendance(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'biometric_hash' => 'required|string',
                'confidence' => 'numeric|min:0|max:1',
                'descriptor_data' => 'nullable|string',
            ]);

            $student = $this->resolveStudentFromFaceRequest($request);
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Facial verification failed. Face does not match any enrolled biometric.',
                ], 422);
            }

            $now = now();
            $todayStart = $now->copy()->startOfDay();
            $todayEnd = $now->copy()->endOfDay();
            // Allow sign-out for "today's" session for this course even after session end time (same "today" as check-in)
            $record = AttendanceRecord::where('student_id', $student->id)
                ->whereNull('time_out')
                ->whereHas('session', function ($q) use ($student, $todayStart, $todayEnd) {
                    $q->where('course_id', $student->course_id)
                        ->whereBetween('start_time', [$todayStart, $todayEnd]);
                })
                ->orderByDesc('time_in')
                ->first();

            if (!$record) {
                return response()->json([
                    'success' => false,
                    'message' => 'No check-in found to sign out from. Check in first for the current session.',
                ], 404);
            }

            $record->update(['time_out' => $now]);
            $session = $record->session;

            Log::info("Face-API: Checkout for student {$student->id}", ['session_id' => $session->id]);

            return response()->json([
                'success' => true,
                'message' => 'Signed out successfully.',
                'student_name' => $student->user->name ?? $student->name,
                'student_id' => $student->student_id,
                'time_out' => $record->time_out,
                'session_name' => $session->name,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error("FACEIO checkout error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Sign out failed.',
            ], 500);
        }
    }

    /**
     * Resolve student from face request (descriptor or hash). Returns Student or null.
     */
    private function resolveStudentFromFaceRequest(Request $request): ?Student
    {
        $enrolled = Student::where('biometric_type', 'face_api')
            ->whereNotNull('faceio_enrollment_id')
            ->get();
        if ($enrolled->isEmpty()) {
            return null;
        }
        $student = null;
        $descriptorData = $request->descriptor_data;
        if (!empty($descriptorData)) {
            $requestDescriptor = $this->parseDescriptor($descriptorData);
            if ($requestDescriptor !== null) {
                $bestDistance = PHP_FLOAT_MAX;
                $secondBestDistance = PHP_FLOAT_MAX;
                $bestStudent = null;
                foreach ($enrolled as $s) {
                    if (empty($s->biometric_template)) {
                        continue;
                    }
                    try {
                        $storedStr = decrypt($s->biometric_template);
                        $storedDescriptor = $this->parseDescriptor($storedStr);
                        if ($storedDescriptor !== null && count($storedDescriptor) === count($requestDescriptor)) {
                            $distance = $this->euclideanDistance($requestDescriptor, $storedDescriptor);
                            if ($distance < $bestDistance) {
                                $secondBestDistance = $bestDistance;
                                $bestDistance = $distance;
                                $bestStudent = $s;
                            } elseif ($distance < $secondBestDistance) {
                                $secondBestDistance = $distance;
                            }
                        }
                    } catch (\Throwable $e) {
                        continue;
                    }
                }
                // Only accept if: (1) best match is confident enough, and (2) not ambiguous (best is clearly better than second-best)
                if ($bestStudent !== null && $bestDistance <= self::MAX_DESCRIPTOR_DISTANCE) {
                    $gap = $secondBestDistance - $bestDistance;
                    if ($gap >= self::MIN_BEST_SECOND_GAP || $secondBestDistance === PHP_FLOAT_MAX) {
                        $student = $bestStudent;
                    }
                }
            }
        }
        if ($student === null) {
            foreach ($enrolled as $s) {
                if (!empty($s->faceio_biometric_hash) && Hash::check($request->biometric_hash, $s->faceio_biometric_hash)) {
                    $student = $s;
                    break;
                }
            }
        }
        return $student;
    }

    /**
     * Get FACEIO application public ID configuration
     * GET /api/biometric/config
     */
    public function getConfig(): JsonResponse
    {
        try {
            // We're using client-side Face-API.js models; no remote public ID required.
            return response()->json([
                'success' => true,
                'provider' => 'face_api',
                'liveness_detection_enabled' => true,
            ]);
        } catch (\Exception $e) {
            Log::error("FACEIO config error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load FACEIO configuration',
            ], 500);
        }
    }

    /**
     * Get student's biometric enrollment status
     * GET /api/biometric/status/{studentId}
     */
    public function getEnrollmentStatus($studentId): JsonResponse
    {
        try {
            $student = Student::findOrFail($studentId);

            return response()->json([
                'success' => true,
                'enrolled' => $student->biometric_type === 'face_api' && !is_null($student->faceio_enrollment_id),
                'biometric_type' => $student->biometric_type,
                'enrollment_date' => $student->faceio_enrollment_date,
                'liveness_verified' => $student->faceio_liveness_verified ?? false,
                'last_verification' => AttendanceRecord::where('student_id', $student->id)
                    ->where('biometric_type', 'face_api')
                    ->latest('time_in')
                    ->value('time_in'),
            ]);
        } catch (\Exception $e) {
            Log::error("Biometric status error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch enrollment status',
            ], 500);
        }
    }

    /**
     * Generate unique enrollment ID
     */
    private function generateEnrollmentId(): string
    {
        return 'enr_' . uniqid() . '_' . bin2hex(random_bytes(4));
    }

    /**
     * Parse comma-separated descriptor string to array of floats (Face-API.js format).
     *
     * @return array<float>|null
     */
    private function parseDescriptor(string $data): ?array
    {
        $raw = explode(',', $data);
        $parts = [];
        foreach ($raw as $v) {
            $v = trim($v);
            if ($v !== '' && is_numeric($v)) {
                $parts[] = (float) $v;
            }
        }
        return $parts ?: null;
    }

    /**
     * Euclidean distance between two descriptor vectors (same length).
     */
    private function euclideanDistance(array $a, array $b): float
    {
        $n = min(count($a), count($b));
        $sum = 0.0;
        for ($i = 0; $i < $n; $i++) {
            $diff = (float) $a[$i] - (float) $b[$i];
            $sum += $diff * $diff;
        }
        return sqrt($sum);
    }

    /**
     * Encrypt biometric data at rest using Laravel's encryption
     */
    private function encryptBiometricData(string $data): string
    {
        return encrypt($data);
    }

    /**
     * Remove/revoke biometric enrollment
     * DELETE /api/biometric/enroll/{studentId}
     */
    public function revokeEnrollment($studentId): JsonResponse
    {
        try {
            $student = Student::findOrFail($studentId);

            $student->update([
                'biometric_type' => null,
                'biometric_template' => null,
                'faceio_enrollment_id' => null,
                'faceio_biometric_hash' => null,
                'faceio_enrollment_date' => null,
                'faceio_liveness_verified' => false,
            ]);

            Log::info("Face-API: Enrollment revoked for student {$student->id}");

            return response()->json([
                'success' => true,
                'message' => 'Biometric enrollment revoked successfully',
            ]);
        } catch (\Exception $e) {
            Log::error("FACEIO revocation error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to revoke enrollment',
            ], 500);
        }
    }
}
