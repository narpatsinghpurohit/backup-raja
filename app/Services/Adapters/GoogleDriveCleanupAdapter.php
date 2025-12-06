<?php

namespace App\Services\Adapters;

use App\Models\Connection;
use App\Services\GoogleDriveService;

class GoogleDriveCleanupAdapter implements CleanupAdapterInterface
{
    public function deleteFile(string $path, Connection $connection): void
    {
        $fileId = $this->extractFileId($path);
        
        $driveService = app(GoogleDriveService::class);
        $driveService->deleteFile($fileId, $connection->credentials);
    }

    /**
     * Extract Google Drive file ID from URL or return as-is if already an ID
     */
    private function extractFileId(string $path): string
    {
        // If it's a full Google Drive URL, extract the file ID
        if (str_contains($path, 'drive.google.com')) {
            // URL format: https://drive.google.com/file/d/{fileId}/view?usp=drivesdk
            if (preg_match('/\/d\/([a-zA-Z0-9_-]+)/', $path, $matches)) {
                return $matches[1];
            }
        }

        // Already a file ID
        return $path;
    }
}
