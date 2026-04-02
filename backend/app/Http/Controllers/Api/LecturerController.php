<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lecturer;
use Illuminate\Http\Request;

class LecturerController extends Controller
{
    public function index(Request $request)
    {
        $lecturers = Lecturer::with('user')->get()->map(function ($lecturer) {
            return [
                'id' => $lecturer->id,
                'email' => $lecturer->user->email,
                'phone' => $lecturer->user->phone ?? null,
                'name' => $lecturer->user->name,
                'role' => 'lecturer',
                'lecturerId' => $lecturer->lecturer_id,
                'department' => $lecturer->department,
                'courses' => $lecturer->courses ?? [],
                'avatar' => $lecturer->user->avatar,
            ];
        });

        return response()->json($lecturers);
    }

    public function show($id)
    {
        $lecturer = Lecturer::with('user')->where('id', $id)->firstOrFail();

        return response()->json([
            'id' => $lecturer->id,
            'email' => $lecturer->user->email,
            'phone' => $lecturer->user->phone ?? null,
            'name' => $lecturer->user->name,
            'role' => 'lecturer',
            'lecturerId' => $lecturer->lecturer_id,
            'department' => $lecturer->department,
            'courses' => $lecturer->courses ?? [],
            'avatar' => $lecturer->user->avatar,
        ]);
    }

    public function update(Request $request, $id)
    {
        $lecturer = Lecturer::with('user')->where('id', $id)->firstOrFail();

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $lecturer->user->id . ',id',
            'phone' => 'sometimes|nullable|string|max:255',
            'department' => 'sometimes|required|string|max:255',
            'courses' => 'sometimes|nullable|array',
            'courses.*' => 'string|max:255',
        ]);

        if ($request->has('name')) {
            $lecturer->user->name = $request->name;
        }
        if ($request->has('email')) {
            $lecturer->user->email = $request->email;
        }
        if ($request->has('phone')) {
            $lecturer->user->phone = $request->phone;
        }
        if ($request->has('department')) {
            $lecturer->department = $request->department;
        }
        if ($request->has('courses')) {
            $lecturer->courses = $request->courses;
        }

        $lecturer->user->save();
        $lecturer->save();

        return response()->json([
            'message' => 'Lecturer updated successfully',
            'lecturer' => [
                'id' => $lecturer->id,
                'email' => $lecturer->user->email,
                'phone' => $lecturer->user->phone ?? null,
                'name' => $lecturer->user->name,
                'role' => 'lecturer',
                'lecturerId' => $lecturer->lecturer_id,
                'department' => $lecturer->department,
                'courses' => $lecturer->courses ?? [],
            ],
        ]);
    }

    public function destroy($id)
    {
        $lecturer = Lecturer::with('user')->where('id', $id)->firstOrFail();
        $user = $lecturer->user;

        $lecturer->delete();
        if ($user) {
            $user->tokens()->delete();
            $user->delete();
        }

        return response()->json(['message' => 'Lecturer deleted successfully']);
    }
}
