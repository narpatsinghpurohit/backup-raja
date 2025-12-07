<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class JobLog extends Model
{
    use HasFactory;

    const UPDATED_AT = null; // Only use created_at, not updated_at

    protected $fillable = [
        'loggable_type',
        'loggable_id',
        'level',
        'message',
        'context',
    ];

    protected $casts = [
        'context' => 'array',
        'created_at' => 'datetime',
    ];

    public function loggable(): MorphTo
    {
        return $this->morphTo();
    }

    public function scopeForOperation($query, Model $operation)
    {
        return $query->where('loggable_type', get_class($operation))
            ->where('loggable_id', $operation->id);
    }

    public function scopeSince($query, $timestamp)
    {
        return $query->where('created_at', '>', $timestamp);
    }

    public function scopeByLevel($query, string $level)
    {
        return $query->where('level', $level);
    }
}
