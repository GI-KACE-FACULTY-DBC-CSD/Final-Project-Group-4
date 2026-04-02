<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Course extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'code',
        'schedule_days',
    ];

    protected $casts = [
        'schedule_days' => 'array',
    ];

    public function modules(): HasMany
    {
        return $this->hasMany(CourseModule::class, 'course_id', 'id')->orderBy('sort_order');
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'course_id', 'id');
    }

    public function classSessions(): HasMany
    {
        return $this->hasMany(ClassSession::class, 'course_id', 'id');
    }
}
