<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseModule;
use App\Services\StudentIdGenerator;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $courses = Course::withCount('students')
            ->with(['modules' => fn ($q) => $q->orderBy('sort_order')])
            ->get()
            ->map(function ($course) {
                $runSegment = StudentIdGenerator::getRunSegmentForCourse($course);
                return [
                    'id' => $course->id,
                    'name' => $course->name,
                    'code' => $course->code,
                    'runSegment' => $runSegment,
                    'schedule_days' => $course->schedule_days ?? [],
                    'modules' => $course->modules->map(fn ($m) => [
                        'id' => $m->id,
                        'name' => $m->name,
                        'sortOrder' => $m->sort_order,
                    ])->values()->all(),
                    'studentsCount' => $course->students_count,
                ];
            });

        return response()->json($courses);
    }

    public function show($id)
    {
        $course = Course::withCount('students')
            ->with(['modules' => fn ($q) => $q->orderBy('sort_order')])
            ->where('id', $id)
            ->firstOrFail();

        $runSegment = StudentIdGenerator::getRunSegmentForCourse($course);

        return response()->json([
            'id' => $course->id,
            'name' => $course->name,
            'code' => $course->code,
            'runSegment' => $runSegment,
            'schedule_days' => $course->schedule_days ?? [],
            'modules' => $course->modules->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'sortOrder' => $m->sort_order,
            ])->values()->all(),
            'studentsCount' => $course->students_count,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:100',
            'schedule_days' => 'nullable|array',
            'schedule_days.*' => 'string|in:mon,tue,wed,thu,fri,sat,sun',
            'modules' => 'nullable|array',
            'modules.*.name' => 'required|string|max:255',
            'modules.*.sort_order' => 'nullable|integer|min:0',
        ]);

        $course = Course::create([
            'name' => $validated['name'],
            'code' => $validated['code'] ?? null,
            'schedule_days' => $validated['schedule_days'] ?? null,
        ]);

        if (! empty($validated['modules'])) {
            foreach ($validated['modules'] as $i => $mod) {
                CourseModule::create([
                    'course_id' => $course->id,
                    'name' => $mod['name'],
                    'sort_order' => $mod['sort_order'] ?? $i,
                ]);
            }
        }

        $course->load(['modules' => fn ($q) => $q->orderBy('sort_order')]);
        $course->loadCount('students');

        return response()->json([
            'id' => $course->id,
            'name' => $course->name,
            'code' => $course->code,
            'schedule_days' => $course->schedule_days ?? [],
            'modules' => $course->modules->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'sortOrder' => $m->sort_order,
            ])->values()->all(),
            'studentsCount' => $course->students_count,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $course = Course::where('id', $id)->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'nullable|string|max:100',
            'schedule_days' => 'nullable|array',
            'schedule_days.*' => 'string|in:mon,tue,wed,thu,fri,sat,sun',
            'modules' => 'nullable|array',
            'modules.*.name' => 'required|string|max:255',
            'modules.*.sort_order' => 'nullable|integer|min:0',
        ]);

        $course->update([
            'name' => $validated['name'] ?? $course->name,
            'code' => array_key_exists('code', $validated) ? $validated['code'] : $course->code,
            'schedule_days' => array_key_exists('schedule_days', $validated) ? $validated['schedule_days'] : $course->schedule_days,
        ]);

        if (array_key_exists('modules', $validated)) {
            $course->modules()->delete();
            foreach ($validated['modules'] as $i => $mod) {
                CourseModule::create([
                    'course_id' => $course->id,
                    'name' => $mod['name'],
                    'sort_order' => $mod['sort_order'] ?? $i,
                ]);
            }
        }

        $course->load(['modules' => fn ($q) => $q->orderBy('sort_order')]);
        $course->loadCount('students');

        return response()->json([
            'id' => $course->id,
            'name' => $course->name,
            'code' => $course->code,
            'schedule_days' => $course->schedule_days ?? [],
            'modules' => $course->modules->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'sortOrder' => $m->sort_order,
            ])->values()->all(),
            'studentsCount' => $course->students_count,
        ]);
    }

    public function destroy($id)
    {
        $course = Course::where('id', $id)->firstOrFail();

        if ($course->students()->exists() || $course->classSessions()->exists()) {
            return response()->json([
                'message' => 'Cannot delete course that has students or sessions. Reassign or remove them first.',
            ], 422);
        }

        $course->modules()->delete();
        $course->delete();

        return response()->json(['message' => 'Course deleted successfully']);
    }

    public function studentCount($id)
    {
        $course = Course::where('id', $id)->firstOrFail();
        return response()->json(['count' => $course->students()->count()]);
    }

    // Return modules for a course
    public function modules($courseId)
    {
        $modules = CourseModule::where('course_id', $courseId)->orderBy('sort_order')->get();
        return response()->json($modules->map(fn($m) => [
            'id' => $m->id,
            'name' => $m->name,
            'sort_order' => $m->sort_order,
            'course_id' => $m->course_id,
        ])->values()->all());
    }

    public function storeModule(Request $request, $courseId)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $module = CourseModule::create([
            'course_id' => $courseId,
            'name' => $validated['name'],
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        return response()->json([
            'id' => $module->id,
            'name' => $module->name,
            'sort_order' => $module->sort_order,
            'course_id' => $module->course_id,
        ], 201);
    }

    public function updateModule(Request $request, $id)
    {
        $module = CourseModule::where('id', $id)->firstOrFail();
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        if (array_key_exists('name', $validated)) $module->name = $validated['name'];
        if (array_key_exists('sort_order', $validated)) $module->sort_order = $validated['sort_order'];
        $module->save();

        return response()->json([
            'id' => $module->id,
            'name' => $module->name,
            'sort_order' => $module->sort_order,
            'course_id' => $module->course_id,
        ]);
    }

    public function destroyModule($id)
    {
        $module = CourseModule::where('id', $id)->firstOrFail();
        $module->delete();
        return response()->json(['message' => 'Module deleted']);
    }
}
