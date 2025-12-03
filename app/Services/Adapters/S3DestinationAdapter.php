<?php

namespace App\Services\Adapters;

use App\Models\Connection;
use Aws\S3\S3Client;

class S3DestinationAdapter implements DestinationAdapterInterface
{
    public function upload(string $archivePath, Connection $destination, \App\Models\BackupOperation $operation, \App\Services\LogService $logService): string
    {
        $credentials = $destination->credentials;
        
        $logService->log($operation, 'info', "Destination type: S3");
        $logService->log($operation, 'info', "Bucket: {$credentials['bucket']}");
        $logService->log($operation, 'info', "Region: {$credentials['region']}");
        
        $s3Client = new S3Client([
            'version' => 'latest',
            'region' => $credentials['region'],
            'credentials' => [
                'key' => $credentials['access_key'],
                'secret' => $credentials['secret_key'],
            ],
        ]);

        $fileName = basename($archivePath);
        $key = 'backups/' . $fileName;
        $fileSize = filesize($archivePath);
        
        $logService->log($operation, 'info', "Uploading to S3: {$key}");
        $logService->log($operation, 'info', "File size: " . $this->formatBytes($fileSize));
        
        $startTime = microtime(true);

        // Upload with multipart for large files
        $result = $s3Client->putObject([
            'Bucket' => $credentials['bucket'],
            'Key' => $key,
            'SourceFile' => $archivePath,
        ]);

        $duration = round(microtime(true) - $startTime, 2);
        $logService->log($operation, 'info', "S3 upload completed in {$duration} seconds");
        $logService->log($operation, 'info', "S3 Object URL: {$result['ObjectURL']}");

        return $result['ObjectURL'];
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
