<?php

namespace App\Services\Adapters;

use App\Models\Connection;
use Aws\S3\S3Client;

class S3DestinationAdapter implements DestinationAdapterInterface
{
    public function upload(string $archivePath, Connection $destination): string
    {
        $credentials = $destination->credentials;
        
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

        // Upload with multipart for large files
        $result = $s3Client->putObject([
            'Bucket' => $credentials['bucket'],
            'Key' => $key,
            'SourceFile' => $archivePath,
        ]);

        return $result['ObjectURL'];
    }
}
