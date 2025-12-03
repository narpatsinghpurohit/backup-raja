<?php

namespace App\Services\Validators;

use Aws\S3\S3Client;
use Aws\Exception\AwsException;

class S3ConnectionValidator implements ConnectionValidatorInterface
{
    public function validate(array $credentials): bool
    {
        // Check required fields exist
        if (empty($credentials['access_key']) || empty($credentials['secret_key'])) {
            throw new \InvalidArgumentException('AWS access key and secret key are required');
        }
        if (empty($credentials['region'])) {
            throw new \InvalidArgumentException('AWS region is required');
        }
        if (empty($credentials['bucket'])) {
            throw new \InvalidArgumentException('S3 bucket name is required');
        }

        try {
            $s3Client = new S3Client([
                'version' => 'latest',
                'region' => $credentials['region'],
                'credentials' => [
                    'key' => $credentials['access_key'],
                    'secret' => $credentials['secret_key'],
                ],
            ]);

            // Test connection by checking if bucket exists
            $s3Client->headBucket([
                'Bucket' => $credentials['bucket'],
            ]);

            return true;
        } catch (AwsException $e) {
            $errorCode = $e->getAwsErrorCode();
            $message = match ($errorCode) {
                'NoSuchBucket' => "Bucket '{$credentials['bucket']}' does not exist",
                'InvalidAccessKeyId' => 'Invalid AWS access key',
                'SignatureDoesNotMatch' => 'Invalid AWS secret key',
                'AccessDenied' => 'Access denied - check IAM permissions',
                default => 'S3 connection failed: ' . $e->getMessage(),
            };
            throw new \RuntimeException($message);
        }
    }
}
