<?php

namespace App\Services;

use App\Models\Connection;
use App\Models\RestoreOperation;
use App\Services\Adapters\LocalStorageRestoreAdapter;
use App\Services\Adapters\MongoRestoreAdapter;
use App\Services\Adapters\RestoreAdapterInterface;
use App\Services\Adapters\S3RestoreAdapter;
use Google\Client as GoogleClient;
use Google\Service\Drive;

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
        $archivePath = $this->downloadArchive($backupOperation);

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

    private function downloadArchive($backupOperation): string
    {
        $remotePath = $backupOperation->archive_path;
        // The archive is stored on the backup's DESTINATION connection (e.g., Google Drive)
        $storageConnection = $backupOperation->destinationConnection;

        $tempPath = storage_path('app/temp/restores');
        if (! file_exists($tempPath)) {
            mkdir($tempPath, 0755, true);
        }

        // Check if this is a Google Drive URL
        if ($this->isGoogleDriveUrl($remotePath)) {
            return $this->downloadFromGoogleDrive($remotePath, $storageConnection, $tempPath);
        }

        $localPath = $tempPath.'/'.basename($remotePath);

        // If it's a regular URL, download it
        if (filter_var($remotePath, FILTER_VALIDATE_URL)) {
            file_put_contents($localPath, file_get_contents($remotePath));
        } else {
            // Assume it's a local path
            copy($remotePath, $localPath);
        }

        return $localPath;
    }

    private function isGoogleDriveUrl(string $url): bool
    {
        return str_contains($url, 'drive.google.com') || str_contains($url, 'docs.google.com');
    }

    private function extractGoogleDriveFileId(string $url): ?string
    {
        // Extract file ID from various Google Drive URL formats
        // Format 1: https://drive.google.com/file/d/FILE_ID/view?usp=drivesdk
        // Format 2: https://drive.google.com/open?id=FILE_ID
        // Format 3: Just the file ID itself

        if (preg_match('/\/d\/([a-zA-Z0-9_-]+)/', $url, $matches)) {
            return $matches[1];
        }

        if (preg_match('/[?&]id=([a-zA-Z0-9_-]+)/', $url, $matches)) {
            return $matches[1];
        }

        // If it doesn't look like a URL, assume it's already a file ID
        if (! str_contains($url, '/') && ! str_contains($url, '?')) {
            return $url;
        }

        return null;
    }

    private function downloadFromGoogleDrive(string $url, Connection $destinationConnection, string $tempPath): string
    {
        $fileId = $this->extractGoogleDriveFileId($url);

        if (! $fileId) {
            throw new \Exception("Could not extract file ID from Google Drive URL: {$url}");
        }

        $credentials = $destinationConnection->credentials;

        $client = new GoogleClient;
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setAccessToken($credentials['access_token']);

        // Refresh token if expired
        if ($client->isAccessTokenExpired() && isset($credentials['refresh_token']) && ! empty($credentials['refresh_token'])) {
            $client->fetchAccessTokenWithRefreshToken($credentials['refresh_token']);
            $newToken = $client->getAccessToken();

            if (isset($newToken['access_token'])) {
                $client->setAccessToken($newToken['access_token']);

                // Save the refreshed token back to the database
                $updatedCredentials = array_merge($credentials, [
                    'access_token' => $newToken['access_token'],
                ]);
                $destinationConnection->update(['credentials' => $updatedCredentials]);
            } else {
                throw new \Exception('Failed to refresh Google Drive access token');
            }
        }

        $driveService = new Drive($client);

        // Get file metadata to get the name
        $file = $driveService->files->get($fileId, ['fields' => 'name,size']);
        $fileName = $file->getName() ?? "backup_{$fileId}.tar.gz";

        $localPath = $tempPath.'/'.$fileName;

        // Download the file content
        $response = $driveService->files->get($fileId, ['alt' => 'media']);
        $content = $response->getBody()->getContents();

        file_put_contents($localPath, $content);

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
