<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Student;
use InvalidArgumentException;

class StudentIdGenerator
{
    /** Base number for run segment: first run = 10.1, second = 11.2, third = 12.3, etc. */
    private const RUN_BASE = 10;

    /**
     * Get the run segment (e.g. "10.1", "11.2") for a given course.
     * Returns null if the course has no code configured.
     */
    public static function getRunSegmentForCourse(Course $course): ?string
    {
        $service = new self();

        $code = $course->code;
        if ($code === null || trim((string) $code) === '') {
            return null;
        }

        $courseCode = $service->normalizeCourseCode($code);
        $runIndex = $service->getCourseRunIndex($course, $courseCode);

        return (self::RUN_BASE + $runIndex - 1) . '.' . $runIndex;
    }

    /**
     * Generate a unique student_id for a new student in the given course.
     * Format: {Centre}{Year}{CourseCode}{RunSegment}M{Mnumber}
     * Run segment starts at 10.1 and increases by 1.1 per course run: 10.1, 11.2, 12.3 ...
     * (Same course code run again = new run; first run 10.1, second run 11.2, etc.)
     *
     * @param string $courseId UUID of the course
     * @return string e.g. A2026DBC10.1M001 or A2026DBC11.2M001
     * @throws InvalidArgumentException if course not found or has no code
     */
    public function generateForCourse(string $courseId): string
    {
        $course = Course::find($courseId);

        if (!$course) {
            throw new InvalidArgumentException('Course not found.');
        }

        $code = $course->code;
        if ($code === null || trim((string) $code) === '') {
            throw new InvalidArgumentException('Course must have a code set to create students. Please set the course code in the course settings.');
        }

        $centre = config('app.centre_code', 'A');
        $year = (int) date('Y');
        $courseCode = $this->normalizeCourseCode($code);

        $runIndex = $this->getCourseRunIndex($course, $courseCode);
        $yearBatchSegment = (self::RUN_BASE + $runIndex - 1) . '.' . $runIndex;

        $prefix = $centre . $year . $courseCode . $yearBatchSegment;

        // Ensure global uniqueness: find the next free M number for this prefix (e.g. A2026DBC10.1)
        $existingIds = Student::where('student_id', 'like', $prefix . '%')->pluck('student_id');
        $maxM = 0;
        foreach ($existingIds as $sid) {
            if (preg_match('/M(\d+)$/', $sid, $m)) {
                $num = (int) $m[1];
                if ($num > $maxM) {
                    $maxM = $num;
                }
            }
        }
        $nextM = $maxM + 1;
        if ($nextM > 300) {
            throw new InvalidArgumentException(
                'This course run has reached the maximum of 300 students. Create a new course (same code) for the next run.'
            );
        }
        $mNumber = 'M' . str_pad((string) $nextM, 3, '0', STR_PAD_LEFT);

        return $prefix . $mNumber;
    }

    /**
     * Get 1-based run index for this course: position among all courses with the same normalized code, ordered by created_at.
     * First course with code DBC = 1, second = 2, etc. So first run = 10.1, second = 11.2, third = 12.3.
     */
    private function getCourseRunIndex(Course $course, string $normalizedCode): int
    {
        $coursesWithSameCode = Course::whereNotNull('code')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get()
            ->filter(function (Course $c) use ($normalizedCode) {
                return $this->normalizeCourseCode((string) ($c->code ?? '')) === $normalizedCode;
            })
            ->values();

        $pos = $coursesWithSameCode->pluck('id')->search($course->id);
        return $pos !== false ? $pos + 1 : 1;
    }

    /**
     * Normalize course code: uppercase, alphanumeric only, max 10 chars.
     */
    private function normalizeCourseCode(string $code): string
    {
        $normalized = preg_replace('/[^A-Za-z0-9]/', '', $code);
        $normalized = strtoupper(substr($normalized, 0, 10));

        return $normalized;
    }
}
