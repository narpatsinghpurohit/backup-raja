<?php

namespace App\Services;

use App\Models\BackupOperation;
use App\Services\Adapters\CleanupAdapterInterface;
use App\Services\Adapters\GoogleDriveCleanupAdapter;
use App\Services\Adapters\LocalStorageCleanupAdapter;
use App\Services\Adapters\S3CleanupAdapter;
use Illuminate\Support\Facades\Log;

class CleanupService
{
    public function __construct(
        private RetentionService $retentionService
    ) {}

    /**
     * Run cleanup for all expired backups
     */
    public function runCleanup(): array
    {
        $expired = $this->retentionService->getExpiredBackups();

        $results = [
            'processed' => 0,
            'deleted' => 0,
            'failed' => 0,
            'errors' => [],
        ];

        foreach ($expired as $backup) {
            $results['processed']++;

            try {
                $this->deleteBackup($backup);
                $results['deleted']++;
            } catch (\Exception $e) {
                $results['failed']++;
                $results['errors'][] = [
                    'backup_id' => $backup->id,
                    'error' => $e->getMessage(),
                ];
                Log::error("Cleanup failed for backup {$backup->id}: {$e->getMessage()}");
            }
        }

        return $results;
    }

    /**
     * Delete a single backup and its files
     */
    public function deleteBackup(BackupOperation $backup): void
    {
        // Delete file from storage destination
        if ($backup->archive_path && $backup->destinationConnection) {
            $adapter = $this->getCleanupAdapter($backup->destinationConnection->type);
            $adapter->deleteFile($backup->archive_path, $backup->destinationConnection);
        }

        // Mark as deleted (soft delete - keep metadata)
        $backup->update([
            'is_deleted' => true,
            'deleted_at' => now(),
            'archive_path' => null,
            'archive_size' => null,
        ]);
    }

    /**
     * Get cleanup adapter for destination type
     */
    private function getCleanupAdapter(string $type): CleanupAdapterInterface
    {
        return match ($type) {
            'google_drive' => new GoogleDriveCleanupAdapter(),
            'local_storage' => new LocalStorageCleanupAdapter(),
            's3', 's3_destination' => new S3CleanupAdapter(),
            default => throw new \InvalidArgumentException("No cleanup adapter for type: {$type}"),
        };
    }
}
