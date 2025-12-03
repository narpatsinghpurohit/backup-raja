<?php

namespace App\Services;

use App\Models\BackupOperation;
use App\Models\Connection;
use App\Services\Adapters\BackupAdapterInterface;
use App\Services\Adapters\DestinationAdapterInterface;
use App\Services\Adapters\S3BackupAdapter;
use App\Services\Adapters\MongoBackupAdapter;
use App\Services\Adapters\S3DestinationAdapter;
use App\Services\Adapters\GoogleDriveDestinationAdapter;
use App\Services\Adapters\LocalStorageDestinationAdapter;
use Illuminate\Support\Facades\Storage;

class BackupExecutor
{
    private string $tempPath;

    public function __construct()
    {
        $this->tempPath = storage_path('app/temp/backups');
        if (!file_exists($this->tempPath)) {
            mkdir($this->tempPath, 0755, true);
        }
    }

    public function execute(BackupOperation $operation, LogService $logService): void
    {
        $sourceConnection = $operation->sourceConnection;
        $destinationConnection = $operation->destinationConnection;

        // Get appropriate backup adapter
        $backupAdapter = $this->getBackupAdapter($sourceConnection);

        // Create backup archive
        $logService->log($operation, 'info', 'Starting backup process...');
        $archivePath = $backupAdapter->backup($sourceConnection, $this->tempPath, $operation, $logService);

        $archiveSize = filesize($archivePath);
        $logService->log($operation, 'info', "Archive created: " . basename($archivePath));
        $logService->log($operation, 'info', "Archive size: " . $this->formatBytes($archiveSize));

        // Generate metadata
        $metadata = [
            'timestamp' => now()->toIso8601String(),
            'source_type' => $sourceConnection->type,
            'source_name' => $sourceConnection->name,
            'archive_size' => $archiveSize,
        ];

        // Get appropriate destination adapter
        $destinationAdapter = $this->getDestinationAdapter($destinationConnection);

        // Upload to destination
        $logService->log($operation, 'info', 'Uploading to destination...');
        $uploadedPath = $destinationAdapter->upload($archivePath, $destinationConnection, $operation, $logService);
        
        $logService->log($operation, 'info', 'Upload completed');
        $logService->log($operation, 'info', "Final location: {$uploadedPath}");

        // Update operation with results
        $operation->update([
            'archive_path' => $uploadedPath,
            'archive_size' => $archiveSize,
            'metadata' => $metadata,
        ]);

        // Clean up local archive
        if (file_exists($archivePath)) {
            unlink($archivePath);
            $logService->log($operation, 'info', 'Temporary files cleaned up');
        }
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

    public function getBackupAdapter(Connection $connection): BackupAdapterInterface
    {
        return match ($connection->type) {
            's3' => new S3BackupAdapter(),
            'mongodb' => new MongoBackupAdapter(),
            default => throw new \InvalidArgumentException("Unsupported source type: {$connection->type}"),
        };
    }

    public function getDestinationAdapter(Connection $connection): DestinationAdapterInterface
    {
        return match ($connection->type) {
            's3', 's3_destination' => new S3DestinationAdapter(),
            'google_drive' => new GoogleDriveDestinationAdapter(),
            'local_storage' => new LocalStorageDestinationAdapter(),
            default => throw new \InvalidArgumentException("Unsupported destination type: {$connection->type}"),
        };
    }

    public function cleanup(string $archivePath): void
    {
        if (file_exists($archivePath)) {
            unlink($archivePath);
        }
    }
}
