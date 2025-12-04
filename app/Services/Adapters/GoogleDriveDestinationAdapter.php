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
        
        // Use resumable upload for large files (streams in chunks, no memory issues)
        $client->setDefer(true);
        
        // Create the request for resumable upload
        $request = $driveService->files->create($fileMetadata, [
            'uploadType' => 'resumable',
            'fields' => 'id,webViewLink',
        ]);
        
        // Create media upload with 5MB chunk size
        $chunkSizeBytes = 5 * 1024 * 1024; // 5MB chunks
        $media = new \Google\Http\MediaFileUpload(
            $client,
            $request,
            'application/gzip',
            null,
            true,
            $chunkSizeBytes
        );
        $media->setFileSize($fileSize);

        // Open file handle (doesn't load into memory)
        $handle = fopen($archivePath, 'rb');
        $uploadedBytes = 0;
        $lastLoggedPercent = 0;

        // Upload in chunks
        while (!feof($handle)) {
            $chunk = fread($handle, $chunkSizeBytes);
            $status = $media->nextChunk($chunk);
            
            $uploadedBytes += strlen($chunk);
            $percent = round(($uploadedBytes / $fileSize) * 100);
            
            // Log progress every 10%
            if ($percent >= $lastLoggedPercent + 10) {
                $logService->log($operation, 'info', "Upload progress: {$percent}% ({$this->formatBytes($uploadedBytes)} / {$this->formatBytes($fileSize)})");
                $lastLoggedPercent = $percent;
            }
        }

        fclose($handle);
        $client->setDefer(false);

        $duration = round(microtime(true) - $startTime, 2);
        $logService->log($operation, 'info', "Google Drive upload completed in {$duration} seconds");
        $logService->log($operation, 'info', "File ID: {$status->id}");
        
        if ($status->webViewLink) {
            $logService->log($operation, 'info', "View link: {$status->webViewLink}");
        }

        return $status->webViewLink ?? $status->id;
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
