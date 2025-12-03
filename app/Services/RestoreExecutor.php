<?php

namespace App\Services;

use App\Models\Connection;
use App\Models\RestoreOperation;
use App\Services\Adapters\RestoreAdapterInterface;
use App\Services\Adapters\S3RestoreAdapter;
use App\Services\Adapters\MongoRestoreAdapter;

class RestoreExecutor
{
    public function execute(RestoreOperation $operation): void
    {
        $backupOperation = $operation->backupOperation;
        $destinationConnection = $operation->destinationConnection;
        $config = $operation->destination_config;

        // Download archive from backup location
        $archivePath = $this->downloadArchive($backupOperation->archive_path);

        // Get appropriate restore adapter
        $restoreAdapter = $this->getRestoreAdapter($destinationConnection);

        // Execute restore
        $restoreAdapter->restore($archivePath, $destinationConnection, $config);

        // Verify restoration
        if (!$restoreAdapter->verify()) {
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
        if (!file_exists($tempPath)) {
            mkdir($tempPath, 0755, true);
        }

        $localPath = $tempPath . '/' . basename($remotePath);
        
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
            's3', 's3_destination' => new S3RestoreAdapter(),
            'mongodb' => new MongoRestoreAdapter(),
            default => throw new \InvalidArgumentException("Unsupported restore type: {$connection->type}"),
        };
    }
}
