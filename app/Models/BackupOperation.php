<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class BackupOperation extends Model
{
    protected $fillable = [
        'source_connection_id',
        'destination_connection_id',
        'backup_schedule_id',
        'status',
        'archive_path',
        'archive_size',
        'metadata',
        'started_at',
        'completed_at',
        'error_message',
        'is_protected',
        'is_deleted',
        'deleted_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'is_protected' => 'boolean',
        'is_deleted' => 'boolean',
        'deleted_at' => 'datetime',
    ];

    public function sourceConnection(): BelongsTo
    {
        return $this->belongsTo(Connection::class, 'source_connection_id');
    }

    public function destinationConnection(): BelongsTo
    {
        return $this->belongsTo(Connection::class, 'destination_connection_id');
    }

    public function backupSchedule(): BelongsTo
    {
        return $this->belongsTo(BackupSchedule::class);
    }

    public function restoreOperations(): HasMany
    {
        return $this->hasMany(RestoreOperation::class);
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

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeNotDeleted($query)
    {
        return $query->where('is_deleted', false);
    }

    public function scopeProtected($query)
    {
        return $query->where('is_protected', true);
    }
}
