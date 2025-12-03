<?php

namespace App\Services\Adapters;

use App\Models\BackupOperation;
use App\Models\Connection;
use App\Services\LogService;

interface DestinationAdapterInterface
{
    public function upload(string $archivePath, Connection $destination, BackupOperation $operation, LogService $logService): string;
}
