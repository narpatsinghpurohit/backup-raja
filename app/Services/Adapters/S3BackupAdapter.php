<?php

namespace App\Services\Adapters;

use App\Models\Connection;
use Aws\S3\S3Client;
use Illuminate\Support\Facades\Storage;

class S3BackupAdapter implements BackupAdapterInterface
{
    private bool $isPaused = false;

    public function backup(Connection $source, string $tempPath, \App\Models\BackupOperation $operation, \App\Services\LogService $logService): string
    {
        $credentials = $source->credentials;
        
        $logService->log($operation, 'info', 'Starting S3 backup...');
        $logService->log($operation, 'info', "Bucket: {$credentials['bucket']}");
        $logService->log($operation, 'info', "Region: {$credentials['region']}");
        
        $logService->log($operation, 'info', 'Connecting to S3...');
        $s3Client = new S3Client([
            'version' => 'latest',
            'region' => $credentials['region'],
            'credentials' => [
                'key' => $credentials['access_key'],
                'secret' => $credentials['secret_key'],
            ],
        ]);

        $logService->log($operation, 'info', 'S3 connection established');
        $logService->log($operation, 'info', 'Listing bucket contents...');

        // List all objects in the bucket
        $objects = $s3Client->listObjectsV2([
            'Bucket' => $credentials['bucket'],
        ]);

        $totalObjects = isset($objects['Contents']) ? count($objects['Contents']) : 0;
        $totalSize = 0;
        
        if (isset($objects['Contents'])) {
            foreach ($objects['Contents'] as $object) {
                $totalSize += $object['Size'];
            }
        }
        
        $logService->log($operation, 'info', "Found {$totalObjects} objects in bucket");
        $logService->log($operation, 'info', "Total size: " . $this->formatBytes($totalSize));

        // Download all objects to temp directory
        $downloadPath = $tempPath . '/s3_backup_' . time();
        if (!file_exists($downloadPath)) {
            mkdir($downloadPath, 0755, true);
        }

        $logService->log($operation, 'info', 'Downloading objects...');
        $downloaded = 0;
        $downloadedSize = 0;

        if (isset($objects['Contents'])) {
            foreach ($objects['Contents'] as $object) {
                if ($this->isPaused) {
                    throw new \Exception('Backup paused');
                }

                $key = $object['Key'];
                $size = $object['Size'];
                $localPath = $downloadPath . '/' . $key;
                
                // Create directory structure
                $dir = dirname($localPath);
                if (!file_exists($dir)) {
                    mkdir($dir, 0755, true);
                }

                // Download file
                $result = $s3Client->getObject([
                    'Bucket' => $credentials['bucket'],
                    'Key' => $key,
                ]);

                file_put_contents($localPath, $result['Body']);
                
                $downloaded++;
                $downloadedSize += $size;
                
                // Log progress every 10 files or for large files
                if ($downloaded % 10 === 0 || $size > 10 * 1024 * 1024) {
                    $progress = round(($downloaded / $totalObjects) * 100, 1);
                    $logService->log($operation, 'info', "Progress: {$downloaded}/{$totalObjects} objects ({$progress}%)");
                }
            }
        }

        $logService->log($operation, 'info', "All objects downloaded");
        $logService->log($operation, 'info', "Downloaded: " . $this->formatBytes($downloadedSize));

        // Create tar.gz archive
        $logService->log($operation, 'info', 'Creating compressed archive...');
        $archivePath = $tempPath . '/backup_' . time() . '.tar.gz';
        $command = sprintf(
            'tar -czf %s -C %s . 2>&1',
            escapeshellarg($archivePath),
            escapeshellarg($downloadPath)
        );
        exec($command, $output, $returnCode);
        
        if ($returnCode !== 0) {
            $logService->log($operation, 'error', 'Archive creation failed');
            throw new \Exception('Failed to create archive');
        }

        $archiveSize = filesize($archivePath);
        $compressionRatio = round(($downloadedSize - $archiveSize) / $downloadedSize * 100, 1);
        $logService->log($operation, 'info', "Archive created successfully");
        $logService->log($operation, 'info', "Compressed size: " . $this->formatBytes($archiveSize));
        $logService->log($operation, 'info', "Compression ratio: {$compressionRatio}%");

        // Clean up temp directory
        $this->deleteDirectory($downloadPath);

        return $archivePath;
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

    public function canPause(): bool
    {
        return true;
    }

    public function pause(): void
    {
        $this->isPaused = true;
    }

    public function resume(): void
    {
        $this->isPaused = false;
    }

    private function deleteDirectory(string $dir): void
    {
        if (!file_exists($dir)) {
            return;
        }

        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            is_dir($path) ? $this->deleteDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }
}
