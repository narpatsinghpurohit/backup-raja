<?php

namespace App\Jobs;

use App\Models\RestoreOperation;
use App\Services\LogService;
use App\Services\RestoreExecutor;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RestoreJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

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

            $logService->log($this->operation, 'info', 'Restore job started');
            $logService->log(
                $this->operation,
                'info',
                "Destination: {$this->operation->destinationConnection->name} ({$this->operation->destinationConnection->type})"
            );

            // Execute restore - adapter handles detailed logging
            $executor->execute($this->operation);

            // Update status to completed
            $this->operation->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            $logService->log($this->operation, 'info', 'Restore job completed successfully');
        } catch (\Exception $e) {
            // Update status to failed
            $this->operation->update([
                'status' => 'failed',
                'completed_at' => now(),
                'error_message' => $e->getMessage(),
            ]);

            $logService->log($this->operation, 'error', 'Restore failed: '.$e->getMessage(), [
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
