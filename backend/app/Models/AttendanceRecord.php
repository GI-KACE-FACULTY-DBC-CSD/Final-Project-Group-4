<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class AttendanceRecord extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'student_id',
        'session_id',
        'timestamp',
        'time_in',
        'time_out',
        'status',
        'accuracy',
        'biometric_type',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'time_in' => 'datetime',
        'time_out' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id', 'id');
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(ClassSession::class, 'session_id', 'id');
    }
}
