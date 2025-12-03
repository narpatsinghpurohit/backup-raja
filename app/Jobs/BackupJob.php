<?php

namespace App\Jobs;

use App\Models\BackupOperation;
use App\Services\BackupExecutor;
use App\Services\LogService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class BackupJob implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    public function __construct(
        public BackupOperation $operation
    ) {}

    public function handle(BackupExecutor $executor, LogService $logService): void
    {
        try {
            // Update status to running
            $this->operation->update([
                'status' => 'running',
                'started_at' => now(),
            ]);

            $logService->log($this->operation, 'info', 'Backup started');

            // Log connection establishment
            $logService->log(
                $this->operation,
                'info',
                "Connecting to source: {$this->operation->sourceConnection->name}"
            );

            // Execute backup
            $logService->log($this->operation, 'info', 'Creating backup archive...');
            $executor->execute($this->operation);

            $logService->log($this->operation, 'info', 'Uploading to destination...');
            
            // Update status to completed
            $this->operation->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            $logService->log($this->operation, 'info', 'Backup completed successfully');
        } catch (\Exception $e) {
            // Update status to failed
            $this->operation->update([
                'status' => 'failed',
                'completed_at' => now(),
                'error_message' => $e->getMessage(),
            ]);

            $logService->log($this->operation, 'error', 'Backup failed: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        $this->operation->update([
            'status' => 'failed',
            'completed_at' => now(),
            'error_message' => $exception->getMessage(),
        ]);
    }
}

