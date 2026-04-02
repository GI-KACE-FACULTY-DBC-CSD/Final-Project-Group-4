<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Redemption extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['student_id', 'privilege_id', 'points_spent'];
    protected $casts = ['points_spent' => 'integer'];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id', 'id');
    }

    public function privilege(): BelongsTo
    {
        return $this->belongsTo(RedeemablePrivilege::class, 'privilege_id', 'id');
    }
}
