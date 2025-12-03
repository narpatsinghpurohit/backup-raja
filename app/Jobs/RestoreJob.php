<?php

namespace App\Jobs;

use App\Models\RestoreOperation;
use App\Services\RestoreExecutor;
use App\Services\LogService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RestoreJob implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    public function __construct(
        public RestoreOperation $operation
    ) {}

    public function handle(RestoreExecutor $executor, LogService $logService): void
    {
        try {
            // Update status to running
            $this->operation->update([
                'status' => 'running',
                'started_at' => now(),
            ]);

            $logService->log($this->operation, 'info', 'Restore started');

            // Log connection establishment
            $logService->log(
                $this->operation,
                'info',
                "Restoring to destination: {$this->operation->destinationConnection->name}"
            );

            // Execute restore
            $logService->log($this->operation, 'info', 'Extracting backup archive...');
            $executor->execute($this->operation);

            $logService->log($this->operation, 'info', 'Verifying restored data...');
            
            // Update status to completed
            $this->operation->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            $logService->log($this->operation, 'info', 'Restore completed successfully');
        } catch (\Exception $e) {
            // Update status to failed
            $this->operation->update([
                'status' => 'failed',
                'completed_at' => now(),
                'error_message' => $e->getMessage(),
            ]);

            $logService->log($this->operation, 'error', 'Restore failed: ' . $e->getMessage(), [
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

