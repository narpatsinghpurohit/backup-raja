<?php

namespace App\Models;

use Cron\CronExpression;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BackupSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'source_connection_id',
        'destination_connection_id',
        'cron_expression',
        'frequency_preset',
        'is_active',
        'retention_count',
        'retention_days',
        'last_run_at',
        'next_run_at',
        'last_run_status',
        'success_count',
        'failure_count',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_run_at' => 'datetime',
        'next_run_at' => 'datetime',
        'success_count' => 'integer',
        'failure_count' => 'integer',
        'retention_count' => 'integer',
        'retention_days' => 'integer',
    ];

    public function sourceConnection(): BelongsTo
    {
        return $this->belongsTo(Connection::class, 'source_connection_id');
    }

    public function destinationConnection(): BelongsTo
    {
        return $this->belongsTo(Connection::class, 'destination_connection_id');
    }

    public function backupOperations(): HasMany
    {
        return $this->hasMany(BackupOperation::class);
    }

    public function isDue(): bool
    {
        $cron = new CronExpression($this->cron_expression);

        return $cron->isDue();
    }

    public function getNextRunDate(): \DateTime
    {
        $cron = new CronExpression($this->cron_expression);

        return $cron->getNextRunDate();
    }

    public function getHumanReadableSchedule(): string
    {
        $presets = [
            'hourly' => 'Every hour',
            'daily' => 'Daily at midnight',
            'weekly' => 'Weekly on Sunday at midnight',
            'monthly' => 'Monthly on the 1st at midnight',
        ];

        return $presets[$this->frequency_preset] ?? $this->cron_expression;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDue($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('next_run_at')
                    ->orWhere('next_run_at', '<=', now());
            });
    }

    public function getRetentionDescription(): string
    {
        if (! $this->retention_count && ! $this->retention_days) {
            return 'Keep forever';
        }

        $parts = [];

        if ($this->retention_count) {
            $parts[] = "Keep last {$this->retention_count} backups";
        }

        if ($this->retention_days) {
            $parts[] = "Keep for {$this->retention_days} days";
        }

        return implode(' or ', $parts);
    }
}
