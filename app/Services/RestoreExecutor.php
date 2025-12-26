<?php

namespace App\Services;

use App\Models\Connection;
use App\Models\RestoreOperation;
use App\Services\Adapters\LocalStorageRestoreAdapter;
use App\Services\Adapters\MongoRestoreAdapter;
use App\Services\Adapters\RestoreAdapterInterface;
use App\Services\Adapters\S3RestoreAdapter;

class RestoreExecutor
{
    public function execute(RestoreOperation $operation): void
    {
        $backupOperation = $operation->backupOperation;
        $destinationConnection = $operation->destinationConnection;
        $config = $operation->destination_config ?? [];

        // Add source database from backup metadata for MongoDB restores
        if ($destinationConnection->type === 'mongodb') {
            $backupMetadata = $backupOperation->metadata ?? [];
            $sourceConnection = $backupOperation->sourceConnection;

            // Get source database from backup metadata or source connection
            if (! isset($config['source_database'])) {
                $config['source_database'] = $backupMetadata['source_database']
                    ?? $sourceConnection->credentials['database']
                    ?? null;
            }
        }

        // Download archive from backup location
        $archivePath = $this->downloadArchive($backupOperation->archive_path);

        // Get appropriate restore adapter
        $restoreAdapter = $this->getRestoreAdapter($destinationConnection);

        // Execute restore with operation for logging
        $restoreAdapter->restore($archivePath, $destinationConnection, $config, $operation);

        // Verify restoration
        if (! $restoreAdapter->verify()) {
            throw new \Exception('Restore verification failed');
        }

        // Clean up downloaded archive
        if (file_exists($archivePath)) {
            unlink($archivePath);
        }
    }

    private function downloadArchive(string $remotePath): string
    {
        // For now, assume the archive is accessible locally or via URL
        // In production, this would download from S3/Google Drive
        $tempPath = storage_path('app/temp/restores');
        if (! file_exists($tempPath)) {
            mkdir($tempPath, 0755, true);
        }

        $localPath = $tempPath.'/'.basename($remotePath);

        // If it's a URL, download it
        if (filter_var($remotePath, FILTER_VALIDATE_URL)) {
            file_put_contents($localPath, file_get_contents($remotePath));
        } else {
            // Assume it's a local path
            copy($remotePath, $localPath);
        }

        return $localPath;
    }

    private function getRestoreAdapter(Connection $connection): RestoreAdapterInterface
    {
        return match ($connection->type) {
            's3', 's3_destination' => new S3RestoreAdapter,
            'mongodb' => new MongoRestoreAdapter,
            'local_storage' => new LocalStorageRestoreAdapter,
            default => throw new \InvalidArgumentException("Unsupported restore type: {$connection->type}"),
        };
    }
}
