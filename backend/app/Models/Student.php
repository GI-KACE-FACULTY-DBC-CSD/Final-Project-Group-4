<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Student extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'student_id',
        'course_id',
        
        'accuracy',
        'biometric_type',
        'biometric_template',
        'face_image',
        'faceio_enrollment_id',
        'faceio_biometric_hash',
        'faceio_enrollment_date',
        'faceio_liveness_verified',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'course_id', 'id');
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class, 'student_id', 'id');
    }

    public function points(): HasOne
    {
        return $this->hasOne(StudentPoints::class, 'student_id', 'id');
    }

    public function achievements(): HasMany
    {
        return $this->hasMany(StudentAchievement::class, 'student_id', 'id');
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(Redemption::class, 'student_id', 'id');
    }
}
