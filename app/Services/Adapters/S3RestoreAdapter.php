<?php

namespace App\Services\Adapters;

use App\Models\Connection;
use App\Models\RestoreOperation;
use Aws\S3\S3Client;

class S3RestoreAdapter implements RestoreAdapterInterface
{
    private bool $verified = false;

    public function restore(string $archivePath, Connection $destination, array $config, ?RestoreOperation $operation = null): void
    {
        $credentials = $destination->credentials;

        // Extract archive
        $extractPath = dirname($archivePath).'/extract_'.time();
        mkdir($extractPath, 0755, true);

        $command = sprintf(
            'tar -xzf %s -C %s',
            escapeshellarg($archivePath),
            escapeshellarg($extractPath)
        );
        exec($command);

        // Upload files to S3
        $s3Client = new S3Client([
            'version' => 'latest',
            'region' => $credentials['region'],
            'credentials' => [
                'key' => $credentials['access_key'],
                'secret' => $credentials['secret_key'],
            ],
        ]);

        $bucket = $config['bucket'] ?? $credentials['bucket'];
        $prefix = $config['prefix'] ?? '';

        // Upload all files
        $this->uploadDirectory($s3Client, $extractPath, $bucket, $prefix);

        // Clean up
        $this->deleteDirectory($extractPath);

        $this->verified = true;
    }

    public function verify(): bool
    {
        return $this->verified;
    }

    private function uploadDirectory(S3Client $client, string $dir, string $bucket, string $prefix): void
    {
        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir),
            \RecursiveIteratorIterator::LEAVES_ONLY
        );

        foreach ($files as $file) {
            if ($file->isFile()) {
                $localPath = $file->getRealPath();
                $relativePath = substr($localPath, strlen($dir) + 1);
                $key = $prefix ? $prefix.'/'.$relativePath : $relativePath;

                $client->putObject([
                    'Bucket' => $bucket,
                    'Key' => $key,
                    'SourceFile' => $localPath,
                ]);
            }
        }
    }

    private function deleteDirectory(string $dir): void
    {
        if (! file_exists($dir)) {
            return;
        }

        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = $dir.'/'.$file;
            is_dir($path) ? $this->deleteDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }
}
