<?php

namespace App\Services\Adapters;

use App\Models\Connection;
use Google\Client as GoogleClient;
use Google\Service\Drive;
use Google\Service\Drive\DriveFile;

class GoogleDriveDestinationAdapter implements DestinationAdapterInterface
{
    public function upload(string $archivePath, Connection $destination, \App\Models\BackupOperation $operation, \App\Services\LogService $logService): string
    {
        $credentials = $destination->credentials;
        
        $logService->log($operation, 'info', "Destination type: Google Drive");
        if (isset($credentials['folder_id'])) {
            $logService->log($operation, 'info', "Folder ID: {$credentials['folder_id']}");
        }
        
        $client = new GoogleClient();
        $client->setAccessToken($credentials['access_token']);

        // Refresh token if expired
        if ($client->isAccessTokenExpired() && isset($credentials['refresh_token'])) {
            $logService->log($operation, 'info', "Access token expired, refreshing...");
            $client->fetchAccessTokenWithRefreshToken($credentials['refresh_token']);
            $logService->log($operation, 'info', "Token refreshed successfully");
        }

        $driveService = new Drive($client);

        $fileName = basename($archivePath);
        $fileSize = filesize($archivePath);
        
        $logService->log($operation, 'info', "Uploading to Google Drive: {$fileName}");
        $logService->log($operation, 'info', "File size: " . $this->formatBytes($fileSize));

        $fileMetadata = new DriveFile([
            'name' => $fileName,
            'parents' => isset($credentials['folder_id']) ? [$credentials['folder_id']] : [],
        ]);

        $startTime = microtime(true);
        $content = file_get_contents($archivePath);
        
        $file = $driveService->files->create($fileMetadata, [
            'data' => $content,
            'mimeType' => 'application/gzip',
            'uploadType' => 'multipart',
            'fields' => 'id,webViewLink',
        ]);

        $duration = round(microtime(true) - $startTime, 2);
        $logService->log($operation, 'info', "Google Drive upload completed in {$duration} seconds");
        $logService->log($operation, 'info', "File ID: {$file->id}");
        
        if ($file->webViewLink) {
            $logService->log($operation, 'info', "View link: {$file->webViewLink}");
        }

        return $file->webViewLink ?? $file->id;
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
}
