<?php

namespace App\Services;

use App\Models\BackupOperation;
use App\Models\BackupSchedule;
use App\Models\RetentionSetting;
use Illuminate\Support\Collection;

class RetentionService
{
    /**
     * Get backups eligible for deletion based on retention policy
     */
    public function getExpiredBackups(): Collection
    {
        $expired = collect();

        // Get backups from schedules with retention policies
        $schedules = BackupSchedule::whereNotNull('retention_count')
            ->orWhereNotNull('retention_days')
            ->get();

        foreach ($schedules as $schedule) {
            $expired = $expired->merge($this->getExpiredForSchedule($schedule));
        }

        // Get orphan backups (no schedule) using global policy
        $expired = $expired->merge($this->getExpiredOrphanBackups());

        return $expired->unique('id');
    }

    /**
     * Get expired backups for a specific schedule
     */
    public function getExpiredForSchedule(BackupSchedule $schedule): Collection
    {
        $query = BackupOperation::where('backup_schedule_id', $schedule->id)
            ->where('status', 'completed')
            ->where('is_protected', false)
            ->where('is_deleted', false)
            ->orderBy('created_at', 'desc');

        $expired = collect();

        // Count-based retention
        if ($schedule->retention_count) {
            $toKeep = $query->clone()->limit($schedule->retention_count)->pluck('id');
            $countExpired = $query->clone()
                ->whereNotIn('id', $toKeep)
                ->get();
            $expired = $expired->merge($countExpired);
        }

        // Time-based retention
        if ($schedule->retention_days) {
            $cutoffDate = now()->subDays($schedule->retention_days);
            $timeExpired = $query->clone()
                ->where('created_at', '<', $cutoffDate)
                ->get();
            $expired = $expired->merge($timeExpired);
        }

        return $expired->unique('id');
    }

    /**
     * Get expired orphan backups using global retention settings
     * Applied per source-destination pair to keep N backups for each pair
     */
    public function getExpiredOrphanBackups(): Collection
    {
        $globalCount = $this->getGlobalSetting('retention_count');
        $globalDays = $this->getGlobalSetting('retention_days');

        if (!$globalCount && !$globalDays) {
            return collect();
        }

        $expired = collect();

        // Get all unique source-destination pairs that have orphan backups
        $pairs = BackupOperation::whereNull('backup_schedule_id')
            ->where('status', 'completed')
            ->where('is_protected', false)
            ->where('is_deleted', false)
            ->select('source_connection_id', 'destination_connection_id')
            ->distinct()
            ->get();

        // Apply retention per source-destination pair
        foreach ($pairs as $pair) {
            $query = BackupOperation::whereNull('backup_schedule_id')
                ->where('source_connection_id', $pair->source_connection_id)
                ->where('destination_connection_id', $pair->destination_connection_id)
                ->where('status', 'completed')
                ->where('is_protected', false)
                ->where('is_deleted', false)
                ->orderBy('created_at', 'desc');

            if ($globalCount) {
                $toKeep = $query->clone()->limit((int) $globalCount)->pluck('id');
                $countExpired = $query->clone()
                    ->whereNotIn('id', $toKeep)
                    ->get();
                $expired = $expired->merge($countExpired);
            }

            if ($globalDays) {
                $cutoffDate = now()->subDays((int) $globalDays);
                $timeExpired = $query->clone()
                    ->where('created_at', '<', $cutoffDate)
                    ->get();
                $expired = $expired->merge($timeExpired);
            }
        }

        return $expired->unique('id');
    }

    public function getGlobalSetting(string $key): ?string
    {
        return RetentionSetting::where('key', $key)->value('value');
    }

    public function setGlobalSetting(string $key, ?string $value): void
    {
        RetentionSetting::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }
}
