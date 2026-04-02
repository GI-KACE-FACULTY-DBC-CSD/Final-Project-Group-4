<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class RedeemablePrivilege extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['name', 'description', 'points_cost', 'is_active'];
    protected $casts = ['points_cost' => 'integer', 'is_active' => 'boolean'];
}
