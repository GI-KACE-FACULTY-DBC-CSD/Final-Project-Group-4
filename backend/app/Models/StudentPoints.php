<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StudentPoints extends Model
{
    use HasUuids;

    protected $table = 'student_points';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['student_id', 'points_balance'];
    protected $casts = ['points_balance' => 'integer'];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id', 'id');
    }
}
