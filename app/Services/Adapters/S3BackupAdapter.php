<?php

namespace App\Services\Adapters;

use App\Models\Connection;
use Aws\S3\S3Client;
use Illuminate\Support\Facades\Storage;

class S3BackupAdapter implements BackupAdapterInterface
{
    private bool $isPaused = false;

    public function backup(Connection $source, string $tempPath): string
    {
        $credentials = $source->credentials;
        
        $s3Client = new S3Client([
            'version' => 'latest',
            'region' => $credentials['region'],
            'credentials' => [
                'key' => $credentials['access_key'],
                'secret' => $credentials['secret_key'],
            ],
        ]);

        // List all objects in the bucket
        $objects = $s3Client->listObjectsV2([
            'Bucket' => $credentials['bucket'],
        ]);

        // Download all objects to temp directory
        $downloadPath = $tempPath . '/s3_backup';
        if (!file_exists($downloadPath)) {
            mkdir($downloadPath, 0755, true);
        }

        if (isset($objects['Contents'])) {
            foreach ($objects['Contents'] as $object) {
                if ($this->isPaused) {
                    throw new \Exception('Backup paused');
                }

                $key = $object['Key'];
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
            }
        }

        // Create tar.gz archive
        $archivePath = $tempPath . '/backup_' . time() . '.tar.gz';
        $command = sprintf(
            'tar -czf %s -C %s .',
            escapeshellarg($archivePath),
            escapeshellarg($downloadPath)
        );
        exec($command);

        // Clean up temp directory
        $this->deleteDirectory($downloadPath);

        return $archivePath;
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
