<?php

namespace App\Services;

use App\Models\BackupSchedule;
use Cron\CronExpression;

class ScheduleService
{
    public function __construct(
        private BackupService $backupService
    ) {}

    public function createSchedule(array $data): BackupSchedule
    {
        $cronExpression = $this->getCronExpression($data['frequency_preset'], $data['cron_expression'] ?? null);

        $schedule = BackupSchedule::create([
            'name' => $data['name'],
            'source_connection_id' => $data['source_connection_id'],
            'destination_connection_id' => $data['destination_connection_id'],
            'cron_expression' => $cronExpression,
            'frequency_preset' => $data['frequency_preset'],
            'is_active' => $data['is_active'] ?? true,
            'retention_count' => $data['retention_count'] ?? null,
            'retention_days' => $data['retention_days'] ?? null,
            'next_run_at' => $this->calculateNextRun($cronExpression),
        ]);

        return $schedule;
    }

    public function updateSchedule(BackupSchedule $schedule, array $data): BackupSchedule
    {
        $cronExpression = $this->getCronExpression(
            $data['frequency_preset'] ?? $schedule->frequency_preset,
            $data['cron_expression'] ?? null
        );

        $schedule->update([
            'name' => $data['name'] ?? $schedule->name,
            'source_connection_id' => $data['source_connection_id'] ?? $schedule->source_connection_id,
            'destination_connection_id' => $data['destination_connection_id'] ?? $schedule->destination_connection_id,
            'cron_expression' => $cronExpression,
            'frequency_preset' => $data['frequency_preset'] ?? $schedule->frequency_preset,
            'is_active' => $data['is_active'] ?? $schedule->is_active,
            'retention_count' => array_key_exists('retention_count', $data) ? $data['retention_count'] : $schedule->retention_count,
            'retention_days' => array_key_exists('retention_days', $data) ? $data['retention_days'] : $schedule->retention_days,
            'next_run_at' => $this->calculateNextRun($cronExpression),
        ]);

        return $schedule->fresh();
    }


    public function runSchedule(BackupSchedule $schedule): void
    {
        $source = $schedule->sourceConnection;
        $destination = $schedule->destinationConnection;

        $operation = $this->backupService->initiateBackup($source, $destination);

        // Link operation to schedule
        $operation->update(['backup_schedule_id' => $schedule->id]);

        // Update schedule metadata
        $schedule->update([
            'last_run_at' => now(),
            'next_run_at' => $this->calculateNextRun($schedule->cron_expression),
        ]);
    }

    public function runDueSchedules(): int
    {
        $dueSchedules = BackupSchedule::where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('next_run_at')
                    ->orWhere('next_run_at', '<=', now());
            })
            ->get();

        $count = 0;
        foreach ($dueSchedules as $schedule) {
            // Skip if there's already a running backup for this schedule
            $hasRunning = $schedule->backupOperations()
                ->whereIn('status', ['pending', 'running'])
                ->exists();

            if (!$hasRunning) {
                $this->runSchedule($schedule);
                $count++;
            }
        }

        return $count;
    }

    public function updateScheduleStatus(BackupSchedule $schedule, string $status): void
    {
        $updates = ['last_run_status' => $status];

        if ($status === 'completed') {
            $updates['success_count'] = $schedule->success_count + 1;
        } elseif ($status === 'failed') {
            $updates['failure_count'] = $schedule->failure_count + 1;
        }

        $schedule->update($updates);
    }

    public function getCronExpression(string $preset, ?string $customCron): string
    {
        $presets = [
            'hourly' => '0 * * * *',
            'daily' => '0 0 * * *',
            'weekly' => '0 0 * * 0',
            'monthly' => '0 0 1 * *',
        ];

        if ($preset === 'custom' && $customCron) {
            return $customCron;
        }

        return $presets[$preset] ?? '0 0 * * *';
    }

    public function calculateNextRun(string $cronExpression): \DateTime
    {
        $cron = new CronExpression($cronExpression);
        return $cron->getNextRunDate();
    }
}
