<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Student;
use App\Models\Lecturer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        // Load role-specific data
        $userData = $this->loadUserData($user);

        return response()->json([
            'token' => $token,
            'user' => $userData,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function signup(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:student,lecturer',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password, // The 'hashed' cast in User model will handle hashing
            'role' => $request->role,
        ]);

        // Create role-specific profile
        if ($request->role === 'student') {
            $studentId = 'STU' . str_pad($user->id, 3, '0', STR_PAD_LEFT);
            Student::create([
                'user_id' => $user->id,
                'student_id' => $studentId,
                'course' => 'General',
                'year' => 1,
                'accuracy' => 0,
            ]);
        } elseif ($request->role === 'lecturer') {
            $lecturerId = 'LEC' . str_pad($user->id, 3, '0', STR_PAD_LEFT);
            Lecturer::create([
                'user_id' => $user->id,
                'lecturer_id' => $lecturerId,
                'department' => 'General',
                'courses' => [],
            ]);
        }

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $this->loadUserData($user),
        ], 201);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        // Generate reset token
        $token = Str::random(64);
        $email = $request->email;

        // Store token in password_reset_tokens table
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token' => Hash::make($token),
                'created_at' => Carbon::now(),
            ]
        );

        // In a real application, you would send an email here with the reset link
        // For now, we'll return the token (in production, remove this)
        return response()->json([
            'message' => 'Password reset link has been sent to your email address.',
            'token' => $token, // Remove this in production - only for testing
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$resetRecord || !Hash::check($request->token, $resetRecord->token)) {
            throw ValidationException::withMessages([
                'token' => ['Invalid or expired reset token.'],
            ]);
        }

        // Check if token is expired (60 minutes)
        if (Carbon::parse($resetRecord->created_at)->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            throw ValidationException::withMessages([
                'token' => ['Reset token has expired. Please request a new one.'],
            ]);
        }

        // Update password
        $user = User::where('email', $request->email)->first();
        $user->password = $request->password; // The 'hashed' cast in User model will handle hashing
        $user->save();

        // Delete reset token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json([
            'message' => 'Password has been reset successfully.',
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id . ',id',
        ]);

        $user->name = $request->name;
        $user->email = $request->email;
        $user->save();

        $userData = $this->loadUserData($user);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $userData,
        ]);
    }

    public function changePassword(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|string|min:8',
        ]);

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        // Update password
        $user->password = $request->new_password; // The 'hashed' cast in User model will handle hashing
        $user->save();

        return response()->json([
            'message' => 'Password changed successfully',
        ]);
    }

    public function user(Request $request)
    {
        $user = $request->user();
        $userData = $this->loadUserData($user);

        return response()->json($userData);
    }

    private function loadUserData(User $user)
    {
        $data = [
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'role' => $user->role,
            'avatar' => $user->avatar,
        ];

        if ($user->role === 'student') {
            $student = Student::where('user_id', $user->id)->first();
            if ($student) {
                $data['studentId'] = $student->student_id;
                $data['course'] = $student->course;
                $data['year'] = $student->year;
                $data['accuracy'] = $student->accuracy;
            }
        } elseif ($user->role === 'lecturer') {
            $lecturer = Lecturer::where('user_id', $user->id)->first();
            if ($lecturer) {
                $data['lecturerId'] = $lecturer->lecturer_id;
                $data['department'] = $lecturer->department;
                $data['courses'] = $lecturer->courses ?? [];
            }
        } elseif ($user->role === 'admin') {
            $data['adminId'] = 'ADM' . substr($user->id, 0, 8);
        }

        return $data;
    }
}
