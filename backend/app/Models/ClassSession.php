<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ClassSession extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'lecturer_id',
        'start_time',
        'end_time',
        'location',
        'course_id',
        'status',
        'attendance_count',
        'total_students',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'course_id', 'id');
    }

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function lecturer(): BelongsTo
    {
        return $this->belongsTo(Lecturer::class, 'lecturer_id', 'id');
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class, 'session_id', 'id');
    }

    /**
     * Calculate the session status based on current time relative to start_time and end_time
     */
    public function getCalculatedStatus(): string
    {
        $now = now();
        
        if ($now->lt($this->start_time)) {
            return 'upcoming';
        } elseif ($now->gte($this->start_time) && $now->lt($this->end_time)) {
            return 'ongoing';
        } else {
            return 'completed';
        }
    }

    /**
     * Override the status accessor to always return calculated status
     */
    public function getStatusAttribute($value): string
    {
        return $this->getCalculatedStatus();
    }
}
