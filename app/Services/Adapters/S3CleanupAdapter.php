<?php

namespace App\Services\Adapters;

use App\Models\Connection;
use Aws\S3\S3Client;
use Aws\S3\Exception\S3Exception;

class S3CleanupAdapter implements CleanupAdapterInterface
{
    public function deleteFile(string $path, Connection $connection): void
    {
        $credentials = $connection->credentials;

        $s3Client = new S3Client([
            'version' => 'latest',
            'region' => $credentials['region'],
            'credentials' => [
                'key' => $credentials['access_key'],
                'secret' => $credentials['secret_key'],
            ],
        ]);

        // Extract key from URL or use path directly
        $key = $this->extractKeyFromPath($path, $credentials['bucket']);

        try {
            $s3Client->deleteObject([
                'Bucket' => $credentials['bucket'],
                'Key' => $key,
            ]);
        } catch (S3Exception $e) {
            // NoSuchKey is acceptable - file already deleted
            if ($e->getAwsErrorCode() !== 'NoSuchKey') {
                throw new \Exception('Failed to delete S3 object: ' . $e->getMessage());
            }
        }
    }

    private function extractKeyFromPath(string $path, string $bucket): string
    {
        // If path is a full S3 URL, extract the key
        if (str_contains($path, 's3.amazonaws.com')) {
            $parsed = parse_url($path);
            return ltrim($parsed['path'] ?? $path, '/');
        }

        // If path contains bucket name, remove it
        if (str_starts_with($path, $bucket . '/')) {
            return substr($path, strlen($bucket) + 1);
        }

        return $path;
    }
}
