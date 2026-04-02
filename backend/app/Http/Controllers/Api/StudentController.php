<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Student;
use App\Services\FaceRecognitionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentController extends Controller
{
    public function debug()
    {
        return response()->json([
            'students_count' => Student::count(),
            'users_with_student_role' => \App\Models\User::where('role', 'student')->count(),
            'sample_students' => Student::with('user')->take(3)->get(),
            'sample_users' => \App\Models\User::where('role', 'student')->take(3)->get(),
        ]);
    }

    public function index(Request $request)
    {
        $students = Student::with(['user', 'course'])->get();
        $studentIds = $students->pluck('id')->all();
        $avgAccuracyByStudent = AttendanceRecord::whereIn('student_id', $studentIds)
            ->whereNotNull('accuracy')
            ->selectRaw('student_id, avg(accuracy) as avg_accuracy')
            ->groupBy('student_id')
            ->pluck('avg_accuracy', 'student_id');

        $result = $students->map(function ($student) use ($avgAccuracyByStudent) {
            $biometricAccuracy = $avgAccuracyByStudent->get($student->id);
            $accuracy = $biometricAccuracy !== null
                ? (float) round($biometricAccuracy, 2)
                : $student->accuracy;
            return [
                'id' => $student->id,
                'email' => $student->user->email,
                'phone' => $student->user->phone ?? null,
                'name' => $student->user->name,
                'role' => 'student',
                // Expose student ID in both snake_case and camelCase for frontend compatibility
                'student_id' => $student->student_id,
                'studentId' => $student->student_id,
                'course_id' => $student->course_id,
                'courseId' => $student->course_id,
                'courseName' => $student->course->name ?? null,
                'courseCode' => $student->course->code ?? null,

                'accuracy' => $accuracy,
                'avatar' => $student->user->avatar,
            ];
        });

        return response()->json($result);
    }

    public function show($id)
    {
        $student = Student::with(['user', 'course'])->where('id', $id)->firstOrFail();

        return response()->json([
            'id' => $student->id,
            'email' => $student->user->email,
            'phone' => $student->user->phone ?? null,
            'name' => $student->user->name,
            'role' => 'student',
            // Expose student ID and course ID in both snake_case and camelCase
            'student_id' => $student->student_id,
            'studentId' => $student->student_id,
            'course_id' => $student->course_id,
            'courseId' => $student->course_id,
            'courseName' => $student->course->name ?? null,
            'courseCode' => $student->course->code ?? null,
            
            'accuracy' => $student->accuracy,
            'biometricRegistered' => ! empty($student->biometric_template),
            'avatar' => $student->user->avatar,
        ]);
    }

    public function update(Request $request, $id)
    {
        $student = Student::with('user')->where('id', $id)->firstOrFail();

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $student->user->id . ',id',
            'course_id' => 'sometimes|required|string|exists:courses,id',
            'phone' => 'sometimes|nullable|string|max:255',
        ]);

        if ($request->has('name')) {
            $student->user->name = $request->name;
        }
        if ($request->has('email')) {
            $student->user->email = $request->email;
        }
        if ($request->has('phone')) {
            $student->user->phone = $request->phone;
        }
        if ($request->has('course_id')) {
            $student->course_id = $request->course_id;
        }
        // Year is not used in GI-KACE deployment; ignore any year field

        $student->user->save();
        $student->save();
        $student->load('course');

        return response()->json([
            'message' => 'Student updated successfully',
            'student' => [
                'id' => $student->id,
                'email' => $student->user->email,
                'phone' => $student->user->phone ?? null,
                'name' => $student->user->name,
                'role' => 'student',
                'studentId' => $student->student_id,
                'courseId' => $student->course_id,
                'courseName' => $student->course->name ?? null,
                'courseCode' => $student->course->code ?? null,
                'year' => $student->year,
                'accuracy' => $student->accuracy,
            ],
        ]);
    }

    public function registerBiometric(Request $request, $id)
    {
        \Log::info('Biometric registration request', [
            'student_id' => $id,
            'biometric_type' => $request->biometric_type,
            'has_face_data' => !empty($request->face_data),
            'has_biometric_template' => !empty($request->biometric_template),
        ]);

        $request->validate([
            'biometric_type' => 'required|in:fingerprint,facial',
            'biometric_template' => 'required_if:biometric_type,fingerprint|string',
            'face_data' => 'required_if:biometric_type,facial|string',
        ]);

        $student = Student::findOrFail($id);

        if ($request->biometric_type === 'facial') {
            // Process face data and extract features
            $faceService = new FaceRecognitionService();
            try {
                $success = $faceService->storeFaceData($student->id, $request->face_data);

                \Log::info('Face data storage result', [
                    'student_id' => $student->id,
                    'success' => $success,
                ]);

                if (!$success) {
                    return response()->json([
                        'message' => 'Failed to process face data'
                    ], 500);
                }
            } catch (\InvalidArgumentException $e) {
                \Log::warning('Invalid face data in biometric registration: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Invalid face image data. Please ensure you are capturing a proper face photo.',
                ], 400);
            } catch (\Exception $e) {
                \Log::error('Face data storage error: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Face processing failed: ' . $e->getMessage(),
                ], 500);
            }
        } else {
            // Store fingerprint template directly
            $student->update([
                'biometric_type' => 'fingerprint',
                'biometric_template' => $request->biometric_template,
            ]);
        }

        return response()->json([
            'message' => ucfirst($request->biometric_type) . ' biometric registered successfully',
            'biometricRegistered' => true,
        ]);
    }

    public function destroy($id)
    {
        $student = Student::with(['user', 'attendanceRecords'])->findOrFail($id);
        $attendanceCount = $student->attendanceRecords->count();
        $user = $student->user;

        DB::transaction(function () use ($student, $user) {
            // Delete the student first (attendance records cascade or are removed by FK)
            $student->delete();

            // Delete the associated user so the email can be reused for a new student
            if ($user) {
                $user->tokens()->delete();
                $user->delete();
            }
        });

        return response()->json([
            'message' => 'Student deleted successfully' . ($attendanceCount > 0 ? " ($attendanceCount attendance records removed)" : ''),
        ]);
    }
}
