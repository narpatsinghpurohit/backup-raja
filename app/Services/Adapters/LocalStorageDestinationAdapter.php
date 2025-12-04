<?php

namespace App\Services\Adapters;

use App\Models\Connection;
use Illuminate\Support\Facades\Storage;

class LocalStorageDestinationAdapter implements DestinationAdapterInterface
{
    public function upload(string $archivePath, Connection $destination, \App\Models\BackupOperation $operation, \App\Services\LogService $logService): string
    {
        $credentials = $destination->credentials;
        $disk = $credentials['disk'] ?? 'local';
        $path = $credentials['path'] ?? 'backups';
        
        $logService->log($operation, 'info', "Destination type: Server Storage");
        $logService->log($operation, 'info', "Storage disk: {$disk}");
        $logService->log($operation, 'info', "Storage path: {$path}");
        
        // Ensure the path doesn't start with a slash for Laravel Storage
        $path = ltrim($path, '/');
        
        $fileName = basename($archivePath);
        $fullPath = $path . '/' . $fileName;
        
        $fileSize = filesize($archivePath);
        $logService->log($operation, 'info', "Uploading file: {$fileName}");
        $logService->log($operation, 'info', "File size: " . $this->formatBytes($fileSize));
        
        $startTime = microtime(true);
        
        // Upload the file using streams to avoid memory issues with large files
        $stream = fopen($archivePath, 'r');
        if ($stream === false) {
            throw new \RuntimeException("Failed to open archive file: {$archivePath}");
        }
        
        try {
            Storage::disk($disk)->writeStream($fullPath, $stream);
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }
        
        $duration = round(microtime(true) - $startTime, 2);
        $logService->log($operation, 'info', "Upload completed in {$duration} seconds");
        
        // Return the storage path
        $storagePath = Storage::disk($disk)->path($fullPath);
        $logService->log($operation, 'info', "File stored at: {$storagePath}");
        
        return $storagePath;
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
