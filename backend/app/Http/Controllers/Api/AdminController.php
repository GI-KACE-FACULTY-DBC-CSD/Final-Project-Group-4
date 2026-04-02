<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Student;
use App\Models\Lecturer;
use App\Models\Course;
use App\Services\FaceRecognitionService;
use App\Services\StudentIdGenerator;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Password;
use App\Mail\StudentWelcome;

class AdminController extends Controller
{
    /**
     * Ensure the current authenticated user is an admin.
     */
    private function ensureAdmin(Request $request): void
    {
        $user = $request->user();

        if (! $user || $user->role !== 'admin') {
            abort(403, 'Forbidden');
        }
    }

    public function createStudent(Request $request)
    {
        $this->ensureAdmin($request);

        \Log::info('Student registration request', [
            'data' => $request->all(),
            'has_biometric' => $request->has('biometric_type'),
            'biometric_type' => $request->biometric_type,
        ]);

        // Remove any orphan user with this email (e.g. from a previous student delete that left the user behind)
        // so the same email can be used to create a new student
        User::where('email', $request->email)
            ->where('role', 'student')
            ->whereDoesntHave('student')
            ->each(function ($user) {
                $user->tokens()->delete();
                $user->delete();
            });

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'sometimes|nullable|string|max:255',
            'course_id' => 'required|string|exists:courses,id',
            'year' => 'nullable|integer|min:1|max:5',
            'biometric_type' => 'nullable|in:fingerprint,facial',
            'biometric_template' => 'required_if:biometric_type,fingerprint|nullable|string|max:65535',
            'face_data' => 'required_if:biometric_type,facial|nullable|string',
        ]);

        // Generate student ID (format: A2026CSD49.1M001); fails if course has no code
        try {
            $studentId = app(StudentIdGenerator::class)->generateForCourse($request->course_id);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        // Generate password if not provided
        $password = $request->password ?? Str::random(10);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => $password, // The 'hashed' cast in User model will handle hashing
            'role' => 'student',
        ]);

        $studentData = [
            'user_id' => $user->id,
            'student_id' => $studentId,
            'course_id' => $request->course_id,
            'accuracy' => 0,
        ];
        if (\Schema::hasColumn('students', 'year') && $request->has('year')) {
            $studentData['year'] = $request->year;
        }
        $student = Student::create($studentData);

        \Log::info('Student registration attempt', [
            'user_id' => $user->id,
            'student_id' => $studentId,
            'student_created' => $student ? 'yes' : 'no',
            'course_id' => $request->course_id,
        ]);

        // Verify student was created
        if (!$student) {
            // Clean up the user if student creation failed
            $user->delete();
            \Log::error('Student creation failed', ['user_id' => $user->id]);
            return response()->json(['message' => 'Failed to create student record'], 500);
        }

        // Handle biometric registration (now required)
        if ($request->biometric_type) {
            try {
                if ($request->biometric_type === 'facial' && $request->face_data) {
                    $faceService = new FaceRecognitionService();
                    $success = $faceService->storeFaceData($student->id, $request->face_data);

                    if (!$success) {
                        // Clean up and fail registration since biometrics are required
                        $student->delete();
                        $user->delete();
                        \Log::error('Face data storage failed - registration cancelled', ['student_id' => $student->id]);
                        return response()->json(['message' => 'Failed to store facial data. Please try again.'], 500);
                    }
                } elseif ($request->biometric_type === 'fingerprint' && $request->biometric_template) {
                    $student->update([
                        'biometric_type' => $request->biometric_type,
                        'biometric_template' => $request->biometric_template,
                    ]);
                }
            } catch (\Exception $e) {
                // Clean up and fail registration since biometrics are required
                $student->delete();
                $user->delete();
                \Log::error('Biometric registration failed - registration cancelled', [
                    'student_id' => $student->id,
                    'biometric_type' => $request->biometric_type,
                    'error' => $e->getMessage()
                ]);
                return response()->json(['message' => 'Failed to register biometric data. Please try again.'], 500);
            }
        }

        $student->load('course');

        // Send welcome email with password reset link (best-effort)
        try {
            $token = Password::createToken($user);
            $resetUrl = url('/reset-password?token=' . $token . '&email=' . urlencode($user->email));
            Mail::to($user->email)->send(new StudentWelcome($user, $resetUrl));
        } catch (\Exception $e) {
            \Log::warning('Failed to send student welcome email: ' . $e->getMessage(), ['email' => $user->email]);
        }

        return response()->json([
            'message' => 'Student created successfully',
            'student' => [
                'id' => $student->id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => 'student',
                'studentId' => $student->student_id,
                'courseId' => $student->course_id,
                'courseName' => $student->course->name ?? null,
                'courseCode' => $student->course->code ?? null,
                'year' => $student->year,
                'accuracy' => $student->accuracy,
                'biometricRegistered' => ! empty($student->biometric_template),
            ],
        ], 201);
    }

    public function createLecturer(Request $request)
    {
        $this->ensureAdmin($request);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'sometimes|nullable|string|max:255',
            'department' => 'required|string|max:255',
            'courses' => 'nullable|array',
            'courses.*' => 'string|max:255',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => $request->password, // The 'hashed' cast in User model will handle hashing
            'role' => 'lecturer',
        ]);

        $lecturerId = 'LEC' . str_pad(Lecturer::count() + 1, 3, '0', STR_PAD_LEFT);
        $lecturer = Lecturer::create([
            'user_id' => $user->id,
            'lecturer_id' => $lecturerId,
            'department' => $request->department,
            'courses' => $request->courses ?? [],
        ]);

        return response()->json([
            'message' => 'Lecturer created successfully',
            'lecturer' => [
                'id' => $lecturer->id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => 'lecturer',
                'lecturerId' => $lecturer->lecturer_id,
                'department' => $lecturer->department,
                'courses' => $lecturer->courses ?? [],
            ],
        ], 201);
    }

    public function bulkImportStudents(Request $request)
    {
        $this->ensureAdmin($request);

        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);

        $file = $request->file('file');
        $csvData = array_map('str_getcsv', file($file->getRealPath()));
        $header = array_shift($csvData);
        
        $imported = 0;
        $errors = [];

        foreach ($csvData as $index => $row) {
            try {
                if (count($row) < 4) {
                    $errors[] = "Row " . ($index + 2) . ": Insufficient columns";
                    continue;
                }

                $name = trim($row[0]);
                $email = trim($row[1]);
                $password = trim($row[2]) ?: 'password123'; // Default password
                $courseNameOrCode = trim($row[3]);
                $year = isset($row[4]) ? (int)trim($row[4]) : 1;

                if (empty($name) || empty($email) || empty($courseNameOrCode)) {
                    $errors[] = "Row " . ($index + 2) . ": Missing required fields";
                    continue;
                }

                $course = Course::where('name', $courseNameOrCode)->orWhere('code', $courseNameOrCode)->first();
                if (! $course) {
                    $errors[] = "Row " . ($index + 2) . ": Course not found (name or code: " . $courseNameOrCode . ")";
                    continue;
                }

                // Check if user already exists
                if (User::where('email', $email)->exists()) {
                    $errors[] = "Row " . ($index + 2) . ": Email already exists";
                    continue;
                }

                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => $password,
                    'role' => 'student',
                ]);

                $studentId = 'STU' . str_pad($user->id, 3, '0', STR_PAD_LEFT);
                Student::create([
                    'user_id' => $user->id,
                    'student_id' => $studentId,
                    'course_id' => $course->id,
                    'year' => $year,
                    'accuracy' => 0,
                ]);

                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Row " . ($index + 2) . ": " . $e->getMessage();
            }
        }

        return response()->json([
            'message' => 'Bulk import completed',
            'imported' => $imported,
            'errors' => $errors,
        ]);
    }

    public function bulkImportLecturers(Request $request)
    {
        $this->ensureAdmin($request);

        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);

        $file = $request->file('file');
        $csvData = array_map('str_getcsv', file($file->getRealPath()));
        $header = array_shift($csvData);
        
        $imported = 0;
        $errors = [];

        foreach ($csvData as $index => $row) {
            try {
                if (count($row) < 3) {
                    $errors[] = "Row " . ($index + 2) . ": Insufficient columns";
                    continue;
                }

                $name = trim($row[0]);
                $email = trim($row[1]);
                $password = trim($row[2]) ?: 'password123'; // Default password
                $department = trim($row[3] ?? 'General');
                $courses = isset($row[4]) ? array_map('trim', explode(',', $row[4])) : [];

                if (empty($name) || empty($email)) {
                    $errors[] = "Row " . ($index + 2) . ": Missing required fields";
                    continue;
                }

                // Check if user already exists
                if (User::where('email', $email)->exists()) {
                    $errors[] = "Row " . ($index + 2) . ": Email already exists";
                    continue;
                }

                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => $password,
                    'role' => 'lecturer',
                ]);

                $lecturerId = 'LEC' . str_pad(Lecturer::count() + 1, 3, '0', STR_PAD_LEFT);
                Lecturer::create([
                    'user_id' => $user->id,
                    'lecturer_id' => $lecturerId,
                    'department' => $department,
                    'courses' => $courses,
                ]);

                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Row " . ($index + 2) . ": " . $e->getMessage();
            }
        }

        return response()->json([
            'message' => 'Bulk import completed',
            'imported' => $imported,
            'errors' => $errors,
        ]);
    }

    /**
     * Dev helper: generate a password reset URL for a given email.
     * Accessible to authenticated admins only (use with caution).
     */
    public function generateReset(Request $request)
    {
        $this->ensureAdmin($request);

        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        try {
            $token = Password::createToken($user);
            $frontend = env('FRONTEND_URL', url('/'));
            $resetUrl = rtrim($frontend, '/') . '/reset-password?token=' . $token . '&email=' . urlencode($user->email);

            return response()->json([
                'message' => 'Reset URL generated',
                'reset_url' => $resetUrl,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to generate reset token: ' . $e->getMessage(), ['email' => $user->email]);
            return response()->json(['message' => 'Failed to generate reset URL'], 500);
        }
    }
}
