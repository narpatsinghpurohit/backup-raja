<?php

namespace App\Services\Validators;

class ConnectionValidatorFactory
{
    public function make(string $type): ConnectionValidatorInterface
    {
        return match ($type) {
            's3', 's3_destination' => new S3ConnectionValidator(),
            'mongodb' => new MongoConnectionValidator(),
            'google_drive' => new GoogleDriveConnectionValidator(),
            'local_storage' => new LocalStorageConnectionValidator(),
            default => throw new \InvalidArgumentException("Unknown connection type: {$type}"),
        };
    }
}
