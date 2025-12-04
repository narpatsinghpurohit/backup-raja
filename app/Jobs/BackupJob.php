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

    /**
     * The number of seconds the job can run before timing out.
     * Set to 1 hour for large database backups.
     */
    public $timeout = 3600;

    /**
     * The number of times the job may be attempted.
     */
    public $tries = 2;

    public function __construct(
        public BackupOperation $operation
    ) {}

    public function handle(BackupExecutor $executor, LogService $logService): void
    {
        $startTime = microtime(true);
        
        try {
            // Update status to running
            $this->operation->update([
                'status' => 'running',
                'started_at' => now(),
            ]);

            $logService->log($this->operation, 'info', 'Backup started');
            $logService->log($this->operation, 'info', '═══════════════════════════════════════════════════');
            
            // Log source details
            $source = $this->operation->sourceConnection;
            $logService->log($this->operation, 'info', "Source: {$source->name} ({$source->type})");
            
            if ($source->type === 'mongodb') {
                $logService->log($this->operation, 'info', "Database: {$source->credentials['database']}");
                $logService->log($this->operation, 'info', "Connection URI: " . $this->maskUri($source->credentials['uri']));
            } elseif ($source->type === 's3') {
                $logService->log($this->operation, 'info', "Bucket: {$source->credentials['bucket']}");
                $logService->log($this->operation, 'info', "Region: {$source->credentials['region']}");
            }
            
            // Log destination details
            $destination = $this->operation->destinationConnection;
            $logService->log($this->operation, 'info', "Destination: {$destination->name} ({$destination->type})");
            
            if ($destination->type === 'local_storage') {
                $logService->log($this->operation, 'info', "Storage Disk: {$destination->credentials['disk']}");
                $logService->log($this->operation, 'info', "Storage Path: {$destination->credentials['path']}");
            } elseif ($destination->type === 's3_destination') {
                $logService->log($this->operation, 'info', "Bucket: {$destination->credentials['bucket']}");
                $logService->log($this->operation, 'info', "Region: {$destination->credentials['region']}");
            } elseif ($destination->type === 'google_drive') {
                $logService->log($this->operation, 'info', "Folder ID: {$destination->credentials['folder_id']}");
            }
            
            $logService->log($this->operation, 'info', '═══════════════════════════════════════════════════');

            // Execute backup with logging
            $executor->execute($this->operation, $logService);
            
            // Calculate duration
            $duration = round(microtime(true) - $startTime, 2);
            $logService->log($this->operation, 'info', '═══════════════════════════════════════════════════');
            $logService->log($this->operation, 'info', 'Backup completed successfully');
            $logService->log($this->operation, 'info', "Total duration: {$duration} seconds");
            $logService->log($this->operation, 'info', "Backup ID: #{$this->operation->id}");
            
            if ($this->operation->archive_size) {
                $size = $this->formatBytes($this->operation->archive_size);
                $logService->log($this->operation, 'info', "Archive size: {$size}");
            }
            
            // Update status to completed
            $this->operation->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Update status to failed
            $this->operation->update([
                'status' => 'failed',
                'completed_at' => now(),
                'error_message' => $e->getMessage(),
            ]);

            $logService->log($this->operation, 'error', '═══════════════════════════════════════════════════');
            $logService->log($this->operation, 'error', 'Backup failed: ' . $e->getMessage());
            $logService->log($this->operation, 'error', 'Exception: ' . get_class($e));
            
            throw $e;
        }
    }
    
    private function maskUri(string $uri): string
    {
        // Mask password in MongoDB URI
        return preg_replace('/\/\/([^:]+):([^@]+)@/', '//$1:****@', $uri);
    }
    
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }

    public function failed(\Throwable $exception): void
    {
        // Refresh the operation to get latest state
        $this->operation->refresh();
        
        // Only update if not already in a final state
        if (!in_array($this->operation->status, ['completed', 'failed', 'cancelled'])) {
            $this->operation->update([
                'status' => 'failed',
                'completed_at' => now(),
                'error_message' => $exception->getMessage(),
            ]);
            
            // Log the failure
            try {
                $logService = app(LogService::class);
                $logService->log($this->operation, 'error', '═══════════════════════════════════════════════════');
                $logService->log($this->operation, 'error', 'Job failed: ' . $exception->getMessage());
                $logService->log($this->operation, 'error', 'Exception type: ' . get_class($exception));
                
                if ($exception instanceof \Symfony\Component\Process\Exception\ProcessTimedOutException) {
                    $logService->log($this->operation, 'error', 'The backup process exceeded the timeout limit.');
                    $logService->log($this->operation, 'error', 'Consider increasing the timeout for large backups.');
                }
            } catch (\Exception $e) {
                // Silently fail if logging fails
            }
        }
    }
}

