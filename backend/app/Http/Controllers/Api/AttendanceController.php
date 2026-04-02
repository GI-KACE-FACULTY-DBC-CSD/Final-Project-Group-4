<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Services\GamificationService;
use App\Models\Student;
use App\Models\ClassSession;
use App\Services\FaceRecognitionService;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $query = AttendanceRecord::with(['student.user', 'session']);

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('session_id')) {
            $query->where('session_id', $request->session_id);
        }

        $limit = min((int) $request->input('limit', 200), 1000);
        $offset = (int) $request->input('offset', 0);
        $query->orderBy('timestamp', 'desc');
        $records = $query->offset($offset)->limit($limit)->get()->map(function ($record) {
            return [
                'id' => $record->id,
                'student' => [
                    'id' => $record->student->id ?? null,
                    'studentId' => $record->student->student_id ?? null,
                    'name' => $record->student->user->name ?? null,
                ],
                'session' => [
                    'id' => $record->session->id ?? null,
                    'name' => $record->session->name ?? null,
                ],
                'timestamp' => $record->timestamp->toISOString(),
                'timeIn' => $record->time_in->toISOString(),
                'timeOut' => $record->time_out ? $record->time_out->toISOString() : null,
                'status' => $record->status,
                'accuracy' => $record->accuracy,
                'biometricType' => $record->biometric_type,
            ];
        });

        return response()->json($records);
    }

    public function checkIn(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|string|exists:students,id',
            'session_id' => 'required|string|exists:class_sessions,id',
            'accuracy' => 'nullable|integer|min:0|max:100',
            'biometric_type' => 'nullable|in:fingerprint,facial',
        ]);

        $student = Student::where('id', $validated['student_id'])->firstOrFail();
        $session = ClassSession::where('id', $validated['session_id'])->firstOrFail();

        $now = now();
        // Once per day: only one check-in per student per calendar day
        $anyToday = AttendanceRecord::where('student_id', $student->id)
            ->whereDate('time_in', $now->toDateString())
            ->orderBy('time_in')
            ->first();
        if ($anyToday) {
            return response()->json([
                'message' => 'You\'re already in! You checked in at ' . $anyToday->time_in->format('g:i A') . '. Enjoy your day — no need to check in again.',
                'already_checked_in_today' => true,
                'id' => $anyToday->id,
                'studentId' => $student->id,
                'sessionId' => $anyToday->session_id,
                'timeIn' => $anyToday->time_in->toISOString(),
            ], 200);
        }

        // Check if already checked in for this session today (redundant after once-per-day, but keep for safety)
        $existing = AttendanceRecord::where('student_id', $student->id)
            ->where('session_id', $session->id)
            ->whereDate('time_in', $now->toDateString())
            ->first();

        if ($existing) {
            return response()->json([
                'message' => '🎉 You\'re already checked in for this session today! Have a fantastic day in class! 🚀',
                'id' => $existing->id,
                'studentId' => $existing->student->id ?? null,
                'sessionId' => $existing->session->id ?? null,
                'timestamp' => $existing->timestamp->toISOString(),
                'timeIn' => $existing->time_in->toISOString(),
                'timeOut' => null,
                'status' => $existing->status,
                'accuracy' => $existing->accuracy,
                'biometricType' => $existing->biometric_type,
            ], 200);
        }

        $startTime = $session->start_time;
        $isLate = $now->gt($startTime->addMinutes(15));

        $record = AttendanceRecord::create([
            'student_id' => $student->id,
            'session_id' => $session->id,
            'timestamp' => $now,
            'time_in' => $now,
            'status' => $isLate ? 'late' : 'present',
            'accuracy' => $validated['accuracy'] ?? 95,
            'biometric_type' => $validated['biometric_type'] ?? 'facial',
        ]);

        // Update session attendance count
        $session->increment('attendance_count');

        try {
            app(GamificationService::class)->awardCheckInPoints($student->id, $record->status);
        } catch (\Throwable $e) {
            \Log::warning('Gamification award failed: ' . $e->getMessage());
        }

        return response()->json([
            'id' => $record->id,
            'studentId' => $record->student->id ?? null,
            'sessionId' => $record->session->id ?? null,
            'timestamp' => $record->timestamp->toISOString(),
            'timeIn' => $record->time_in->toISOString(),
            'timeOut' => null,
            'status' => $record->status,
            'accuracy' => $record->accuracy,
            'biometricType' => $record->biometric_type,
        ], 201);
    }

    /**
     * Identify student by biometric template and clock them into their active session(s).
     * Used at entrance station: scan → identify → find active session → clock in.
     */
    public function checkInByBiometric(Request $request)
    {
        $validated = $request->validate([
            'biometric_type' => 'required|in:fingerprint,facial',
            'biometric_template' => 'required|string',
            'accuracy' => 'nullable|integer|min:0|max:100',
        ]);

        $student = null;

        if ($validated['biometric_type'] === 'facial') {
            // For facial recognition, use the face recognition service
            $faceService = new FaceRecognitionService();
            $faceFeatures = json_decode($validated['biometric_template'], true);

            if (!$faceFeatures) {
                return response()->json([
                    'message' => 'Invalid facial biometric data.',
                ], 400);
            }

            $match = $faceService->findMatchingStudent($faceFeatures, 0.7); // 70% threshold

            if (!$match) {
                return response()->json([
                    'message' => 'No student found matching this facial biometric.',
                ], 404);
            }

            $student = $match['student'];
        } else {
            // For fingerprint, use exact matching
            $student = Student::with('user')
                ->where('biometric_type', $validated['biometric_type'])
                ->where('biometric_template', $validated['biometric_template'])
                ->first();

            if (!$student) {
                return response()->json([
                    'message' => 'No student found matching this biometric.',
                ], 404);
            }
        }

        $now = now();
        // Once per day: only one check-in per student per calendar day
        $anyToday = AttendanceRecord::where('student_id', $student->id)
            ->whereDate('time_in', $now->toDateString())
            ->orderBy('time_in')
            ->first();
        if ($anyToday) {
            $student->load('course');
            return response()->json([
                'message' => 'You\'re already in! You checked in at ' . $anyToday->time_in->format('g:i A') . '. Enjoy your day — no need to check in again.',
                'already_checked_in_today' => true,
                'student' => [
                    'id' => $student->id,
                    'name' => $student->user->name ?? null,
                    'studentId' => $student->student_id,
                    'course' => $student->course->name ?? null,
                ],
                'attendanceRecords' => [],
            ], 200);
        }

        $activeSessions = ClassSession::where('course_id', $student->course_id)
            ->where('start_time', '<=', $now)
            ->where('end_time', '>', $now)
            ->get();

        if ($activeSessions->isEmpty()) {
            $student->load('course');
            return response()->json([
                'message' => 'No active session found for your course.',
                'student' => [
                    'id' => $student->id,
                    'name' => $student->user->name ?? null,
                    'studentId' => $student->student_id,
                    'course' => $student->course->name ?? null,
                ],
            ], 404);
        }

        $accuracy = $validated['accuracy'] ?? 95;
        $records = [];

        foreach ($activeSessions as $session) {
            $startTime = $session->getRawOriginal('start_time');
            $startTime = \Carbon\Carbon::parse($startTime);
            $isLate = $now->gt($startTime->copy()->addMinutes(15));

            $record = AttendanceRecord::create([
                'student_id' => $student->id,
                'session_id' => $session->id,
                'timestamp' => $now,
                'time_in' => $now,
                'status' => $isLate ? 'late' : 'present',
                'accuracy' => $accuracy,
                'biometric_type' => $validated['biometric_type'],
            ]);

            $session->increment('attendance_count');

            try {
                app(GamificationService::class)->awardCheckInPoints($student->id, $record->status);
            } catch (\Throwable $e) {
                \Log::warning('Gamification award failed: ' . $e->getMessage());
            }

            $records[] = [
                'id' => $record->id,
                'sessionId' => $session->id,
                'sessionName' => $session->name,
                'timestamp' => $record->timestamp->toISOString(),
                'timeIn' => $record->time_in->toISOString(),
                'status' => $record->status,
            ];
        }

        $student->load('course');
        return response()->json([
            'message' => 'Check-in successful.',
            'student' => [
                'id' => $student->id,
                'name' => $student->user->name ?? null,
                'studentId' => $student->student_id,
                'course' => $student->course->name ?? null,
            ],
            'attendanceRecords' => $records,
        ], 201);
    }

    /**
     * Check-in by student ID (for entrance station demo when no biometric device).
     * Finds active session(s) for the student and clocks them in.
     */
    public function checkInByStudentId(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|string', // UUID or student_id code e.g. STU001
            'accuracy' => 'nullable|integer|min:0|max:100',
        ]);

        $studentId = $validated['student_id'];

        // Check if student_id is a valid UUID format
        $isUuid = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/', $studentId);

        $student = Student::with('user')
            ->when($isUuid, function ($query) use ($studentId) {
                return $query->where('id', $studentId);
            })
            ->when(!$isUuid, function ($query) use ($studentId) {
                return $query->where('student_id', $studentId);
            })
            ->first();

        if (! $student) {
            return response()->json([
                'message' => 'Student not found.',
            ], 404);
        }

        $now = now();
        // Once per day: only one check-in per student per calendar day
        $anyToday = AttendanceRecord::where('student_id', $student->id)
            ->whereDate('time_in', $now->toDateString())
            ->orderBy('time_in')
            ->first();
        if ($anyToday) {
            $student->load('course');
            return response()->json([
                'message' => 'You\'re already in! You checked in at ' . $anyToday->time_in->format('g:i A') . '. Enjoy your day — no need to check in again.',
                'already_checked_in_today' => true,
                'student' => [
                    'id' => $student->id,
                    'name' => $student->user->name ?? null,
                    'studentId' => $student->student_id,
                    'course' => $student->course->name ?? null,
                ],
                'attendanceRecords' => [],
            ], 200);
        }

        $activeSessions = ClassSession::where('course_id', $student->course_id)
            ->where('start_time', '<=', $now)
            ->where('end_time', '>', $now)
            ->get();

        if ($activeSessions->isEmpty()) {
            $student->load('course');
            return response()->json([
                'message' => 'No active session found for your course.',
                'student' => [
                    'id' => $student->id,
                    'name' => $student->user->name ?? null,
                    'studentId' => $student->student_id,
                    'course' => $student->course->name ?? null,
                ],
            ], 404);
        }

        $accuracy = $validated['accuracy'] ?? 95;
        $records = [];

        foreach ($activeSessions as $session) {
            $startTime = $session->getRawOriginal('start_time');
            $startTime = \Carbon\Carbon::parse($startTime);
            $isLate = $now->gt($startTime->copy()->addMinutes(15));

            $record = AttendanceRecord::create([
                'student_id' => $student->id,
                'session_id' => $session->id,
                'timestamp' => $now,
                'time_in' => $now,
                'status' => $isLate ? 'late' : 'present',
                'accuracy' => $accuracy,
                'biometric_type' => 'facial',
            ]);

            $session->increment('attendance_count');

            try {
                app(GamificationService::class)->awardCheckInPoints($student->id, $record->status);
            } catch (\Throwable $e) {
                \Log::warning('Gamification award failed: ' . $e->getMessage());
            }

            $records[] = [
                'id' => $record->id,
                'sessionId' => $session->id,
                'sessionName' => $session->name,
                'timestamp' => $record->timestamp->toISOString(),
                'timeIn' => $record->time_in->toISOString(),
                'status' => $record->status,
            ];
        }

        $student->load('course');
        return response()->json([
            'message' => 'Check-in successful.',
            'student' => [
                'id' => $student->id,
                'name' => $student->user->name ?? null,
                'studentId' => $student->student_id,
                'course' => $student->course->name ?? null,
            ],
            'attendanceRecords' => $records,
        ], 201);
    }

    /**
     * Check-in by face recognition using captured face data.
     * Performs actual face matching against stored biometric data.
     */
    public function checkInByFace(Request $request)
    {
        $validated = $request->validate([
            'face_data' => 'required|string', // Base64 encoded image data
            'accuracy' => 'nullable|integer|min:0|max:100',
            'student_id' => 'nullable|string', // Optional student ID for demo
        ]);

        $faceService = new FaceRecognitionService();
        $student = null;

        // If student_id is provided, use it directly (fallback mode)
        if (!empty($validated['student_id'])) {
            $studentId = $validated['student_id'];

            // Check if student_id is a valid UUID format
            $isUuid = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/', $studentId);

            $student = Student::with('user')
                ->when($isUuid, function ($query) use ($studentId) {
                    return $query->where('id', $studentId);
                })
                ->when(!$isUuid, function ($query) use ($studentId) {
                    return $query->where('student_id', $studentId);
                })
                ->first();
        } else {
            // Perform face recognition
            try {
                $faceFeatures = $faceService->extractFaceFeatures($validated['face_data']);
                $match = $faceService->findMatchingStudent($faceFeatures, 0.6); // 60% similarity threshold

                \Log::info('Face recognition attempt', [
                    'face_features_count' => count($faceFeatures),
                    'match_found' => $match ? 'yes' : 'no',
                    'similarity' => $match ? $match['similarity'] : null,
                    'student_id' => $match ? $match['student']->id : null,
                    'student_name' => $match ? $match['student']->user->name ?? 'Unknown' : null,
                ]);

                if ($match) {
                    $student = $match['student'];
                }
            } catch (\InvalidArgumentException $e) {
                \Log::warning('Invalid face data received: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Invalid face image data. Please ensure you are capturing a proper face photo.',
                ], 400);
            } catch (\Exception $e) {
                \Log::error('Face recognition error: ' . $e->getMessage(), [
                    'trace' => $e->getTraceAsString()
                ]);
                return response()->json([
                    'message' => 'Face recognition processing failed: ' . $e->getMessage(),
                ], 500);
            }
        }

        if (!$student) {
            return response()->json([
                'message' => 'Face not recognized. Please try again or use Student ID.',
            ], 404);
        }

        $now = now();
        // Once per day: only one check-in per student per calendar day
        $anyToday = AttendanceRecord::where('student_id', $student->id)
            ->whereDate('time_in', $now->toDateString())
            ->orderBy('time_in')
            ->first();
        if ($anyToday) {
            $student->load('course');
            return response()->json([
                'message' => 'You\'re already in! You checked in at ' . $anyToday->time_in->format('g:i A') . '. Enjoy your day — no need to check in again.',
                'already_checked_in_today' => true,
                'student' => [
                    'id' => $student->id,
                    'name' => $student->user->name ?? null,
                    'studentId' => $student->student_id,
                    'course' => $student->course->name ?? null,
                ],
                'attendanceRecords' => [],
            ], 200);
        }

        $activeSessions = ClassSession::where('course_id', $student->course_id)
            ->where('start_time', '<=', $now)
            ->where('end_time', '>', $now)
            ->get();

        if ($activeSessions->isEmpty()) {
            $student->load('course');
            return response()->json([
                'message' => 'No active session found for your course.',
                'student' => [
                    'id' => $student->id,
                    'name' => $student->user->name ?? null,
                    'studentId' => $student->student_id,
                    'course' => $student->course->name ?? null,
                ],
            ], 404);
        }

        $accuracy = $validated['accuracy'] ?? 95;
        $records = [];

        foreach ($activeSessions as $session) {
            $startTime = $session->getRawOriginal('start_time');
            $startTime = \Carbon\Carbon::parse($startTime);
            $isLate = $now->gt($startTime->copy()->addMinutes(15));

            $record = AttendanceRecord::create([
                'student_id' => $student->id,
                'session_id' => $session->id,
                'timestamp' => $now,
                'time_in' => $now,
                'status' => $isLate ? 'late' : 'present',
                'accuracy' => $accuracy,
                'biometric_type' => 'facial',
            ]);

            $session->increment('attendance_count');

            try {
                app(GamificationService::class)->awardCheckInPoints($student->id, $record->status);
            } catch (\Throwable $e) {
                \Log::warning('Gamification award failed: ' . $e->getMessage());
            }

            $records[] = [
                'id' => $record->id,
                'sessionId' => $session->id,
                'sessionName' => $session->name,
                'timestamp' => $record->timestamp->toISOString(),
                'timeIn' => $record->time_in->toISOString(),
                'status' => $record->status,
            ];
        }

        $student->load('course');
        return response()->json([
            'message' => 'Face recognition check-in successful.',
            'student' => [
                'id' => $student->id,
                'name' => $student->user->name ?? null,
                'studentId' => $student->student_id,
                'course' => $student->course->name ?? null,
            ],
            'attendanceRecords' => $records,
        ], 201);
    }

    /**
     * Identify student by face (without check-in)
     * Used at entrance station to identify student before check-in
     */
    public function identifyByFace(Request $request)
    {
        $validated = $request->validate([
            'face_image' => 'required|string', // base64 encoded image
        ]);

        $faceService = new FaceRecognitionService();

        // Extract face features from the uploaded image
        try {
            $faceFeatures = $faceService->extractFaceFeatures($validated['face_image']);
        } catch (\InvalidArgumentException $e) {
            \Log::warning('Invalid face image data in identifyByFace: ' . $e->getMessage());
            return response()->json([
                'message' => 'Invalid face image data. Please ensure you are capturing a proper face photo.',
            ], 400);
        } catch (\Exception $e) {
            \Log::error('Face feature extraction error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Face processing failed: ' . $e->getMessage(),
            ], 500);
        }

        // Find matching student
        $match = $faceService->findMatchingStudent($faceFeatures, 0.6); // 60% threshold

        if (!$match) {
            return response()->json([
                'message' => 'Face not recognized. Please ensure you have registered your face for biometric authentication.',
            ], 404);
        }

        $student = $match['student'];
        $similarity = $match['similarity'];

        $student->load('user', 'course');

        return response()->json([
            'message' => 'Student identified successfully.',
            'student' => [
                'id' => $student->id,
                'name' => $student->user->name ?? null,
                'studentId' => $student->student_id,
                'course' => $student->course->name ?? null,
                'year' => $student->year,
            ],
            'similarity' => $similarity,
        ]);
    }

    public function checkOut(Request $request)
    {
        $validated = $request->validate([
            'attendance_id' => 'required|string|exists:attendance_records,id',
        ]);

        $record = AttendanceRecord::where('id', $validated['attendance_id'])->firstOrFail();

        $record->update([
            'time_out' => now(),
        ]);

        return response()->json([
            'id' => $record->id,
            'studentId' => $record->student->id ?? null,
            'sessionId' => $record->session->id ?? null,
            'timestamp' => $record->timestamp->toISOString(),
            'timeIn' => $record->time_in->toISOString(),
            'timeOut' => $record->time_out->toISOString(),
            'status' => $record->status,
            'accuracy' => $record->accuracy,
            'biometricType' => $record->biometric_type,
        ]);
    }
}
