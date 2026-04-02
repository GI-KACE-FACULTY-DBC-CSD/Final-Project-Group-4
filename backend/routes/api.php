<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\LecturerController;
use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\FaceIOController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DebugController;
use App\Http\Controllers\Api\GamificationController;

// Public routes
Route::get('/debug/database', [DebugController::class, 'database']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/signup', [AuthController::class, 'signup']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Public attendance routes (for entrance stations)
Route::post('/attendance/checkin-by-biometric', [AttendanceController::class, 'checkInByBiometric']);
Route::post('/attendance/checkin-by-student-id', [AttendanceController::class, 'checkInByStudentId']);
Route::post('/attendance/checkin-by-face', [AttendanceController::class, 'checkInByFace']);
Route::post('/attendance/identify-by-face', [AttendanceController::class, 'identifyByFace']);

// FACEIO public biometric routes (no auth required for public kiosk)
Route::get('/biometric/config', [FaceIOController::class, 'getConfig']); // Get FACEIO public ID
Route::post('/biometric/verify-attendance', [FaceIOController::class, 'verifyAttendance']); // Check-in by face
Route::post('/biometric/checkout', [FaceIOController::class, 'checkoutAttendance']); // Sign out by face
Route::get('/biometric/status/{studentId}', [FaceIOController::class, 'getEnrollmentStatus']); // Get enrollment status

// Public sessions list for check-in kiosk (no auth)
Route::get('/sessions/public', [SessionController::class, 'publicIndex']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user', [AuthController::class, 'updateProfile']);
    Route::put('/user/password', [AuthController::class, 'changePassword']);
    
    // Students
    Route::get('/students', [StudentController::class, 'index']);
    Route::get('/students/debug', [StudentController::class, 'debug']);
    Route::get('/students/{id}', [StudentController::class, 'show']);
    Route::put('/students/{id}/biometric', [StudentController::class, 'registerBiometric']);
    Route::put('/students/{id}', [StudentController::class, 'update']);
    Route::delete('/students/{id}', [StudentController::class, 'destroy']);
    
    // FACEIO protected biometric routes (requires authentication)
    Route::post('/biometric/enroll', [FaceIOController::class, 'enrollStudent']); // Enroll student face
    Route::delete('/biometric/enroll/{studentId}', [FaceIOController::class, 'revokeEnrollment']); // Revoke enrollment
    
    // Lecturers
    Route::get('/lecturers', [LecturerController::class, 'index']);
    Route::get('/lecturers/{id}', [LecturerController::class, 'show']);
    Route::put('/lecturers/{id}', [LecturerController::class, 'update']);
    Route::delete('/lecturers/{id}', [LecturerController::class, 'destroy']);
    
    // Courses
    Route::get('/courses', [CourseController::class, 'index']);
    Route::get('/courses/student-count/{id}', [CourseController::class, 'studentCount']);
    Route::get('/courses/{id}', [CourseController::class, 'show']);
    Route::get('/courses/{id}/modules', [CourseController::class, 'modules']);
    Route::post('/courses', [CourseController::class, 'store']);
    Route::put('/courses/{id}', [CourseController::class, 'update']);
    Route::delete('/courses/{id}', [CourseController::class, 'destroy']);

    Route::post('/courses/{id}/modules', [CourseController::class, 'storeModule']);
    Route::put('/modules/{id}', [CourseController::class, 'updateModule']);
    Route::delete('/modules/{id}', [CourseController::class, 'destroyModule']);

    // Sessions
    Route::get('/sessions', [SessionController::class, 'index']);
    Route::get('/sessions/active-for-student/{studentId}', [SessionController::class, 'activeForStudent']);
    Route::get('/sessions/{id}', [SessionController::class, 'show']);
    Route::post('/sessions', [SessionController::class, 'store']);
    Route::put('/sessions/{id}', [SessionController::class, 'update']);
    Route::delete('/sessions/{id}', [SessionController::class, 'destroy']);
    
    // Admin-only routes
    Route::post('/admin/students', [AdminController::class, 'createStudent']);
    Route::post('/admin/lecturers', [AdminController::class, 'createLecturer']);
    // Dev helper: generate a password reset link for an existing user (admin only)
    Route::post('/admin/generate-reset', [AdminController::class, 'generateReset']);
    Route::post('/admin/students/bulk-import', [AdminController::class, 'bulkImportStudents']);
    Route::post('/admin/lecturers/bulk-import', [AdminController::class, 'bulkImportLecturers']);
    
    // Reports
    Route::get('/reports/attendance', [ReportController::class, 'attendance']);
    Route::get('/reports/summary', [ReportController::class, 'summary']);
    Route::get('/reports/student/{id}', [ReportController::class, 'student']);

    // Dashboard (lightweight stats for admin UI)
    Route::get('/admin/dashboard-stats', [DashboardController::class, 'stats']);

    // Attendance
    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::post('/attendance/checkin', [AttendanceController::class, 'checkIn']);
    Route::post('/attendance/checkout', [AttendanceController::class, 'checkOut']);
    
    // Alerts
    Route::get('/alerts', [AlertController::class, 'index']);
    Route::put('/alerts/{id}/read', [AlertController::class, 'markAsRead']);

    // Gamification (student streaks, badges, leaderboard, points, redeem)
    Route::get('/gamification/me', [GamificationController::class, 'me']);
    Route::get('/gamification/leaderboard', [GamificationController::class, 'leaderboard']);
    Route::get('/gamification/privileges', [GamificationController::class, 'privileges']);
    Route::post('/gamification/redeem', [GamificationController::class, 'redeem']);
    
    // Documents
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::get('/documents/{id}', [DocumentController::class, 'show']);
});
