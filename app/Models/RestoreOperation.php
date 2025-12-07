<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class RestoreOperation extends Model
{
    use HasFactory;

    protected $fillable = [
        'backup_operation_id',
        'destination_connection_id',
        'destination_config',
        'status',
        'started_at',
        'completed_at',
        'error_message',
    ];

    protected $casts = [
        'destination_config' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function backupOperation(): BelongsTo
    {
        return $this->belongsTo(BackupOperation::class);
    }

    public function destinationConnection(): BelongsTo
    {
        return $this->belongsTo(Connection::class, 'destination_connection_id');
    }

    public function logs(): MorphMany
    {
        return $this->morphMany(JobLog::class, 'loggable');
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeRunning($query)
    {
        return $query->where('status', 'running');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }
}
