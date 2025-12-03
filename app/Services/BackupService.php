<?php

namespace App\Services;

use App\Jobs\BackupJob;
use App\Models\BackupOperation;
use App\Models\Connection;
use Illuminate\Support\Collection;

class BackupService
{
    public function initiateBackup(Connection $source, Connection $destination): BackupOperation
    {
        // Create backup operation
        $operation = BackupOperation::create([
            'source_connection_id' => $source->id,
            'destination_connection_id' => $destination->id,
            'status' => 'pending',
        ]);

        // Dispatch backup job
        BackupJob::dispatch($operation);

        return $operation;
    }

    public function pauseBackup(BackupOperation $operation): void
    {
        if ($operation->status !== 'running') {
            throw new \Exception('Can only pause running backups');
        }

        $operation->update(['status' => 'paused']);
        
        // Log the pause action
        app(LogService::class)->log($operation, 'info', 'Backup paused by user');
    }

    public function cancelBackup(BackupOperation $operation): void
    {
        if (!in_array($operation->status, ['running', 'paused', 'pending'])) {
            throw new \Exception('Can only cancel running, paused, or pending backups');
        }

        $operation->update([
            'status' => 'cancelled',
            'completed_at' => now(),
        ]);

        // Log the cancellation
        app(LogService::class)->log($operation, 'info', 'Backup cancelled by user');

        // Clean up any temporary files if needed
        if ($operation->archive_path && file_exists($operation->archive_path)) {
            unlink($operation->archive_path);
        }
    }

    public function resumeBackup(BackupOperation $operation): void
    {
        if ($operation->status !== 'paused') {
            throw new \Exception('Can only resume paused backups');
        }

        $operation->update(['status' => 'pending']);
        
        // Re-dispatch the job
        BackupJob::dispatch($operation);

        // Log the resume action
        app(LogService::class)->log($operation, 'info', 'Backup resumed by user');
    }

    public function getBackupHistory(array $filters = []): Collection
    {
        $query = BackupOperation::with(['sourceConnection', 'destinationConnection'])
            ->orderBy('created_at', 'desc');

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['source_connection_id'])) {
            $query->where('source_connection_id', $filters['source_connection_id']);
        }

        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        return $query->get();
    }
}
