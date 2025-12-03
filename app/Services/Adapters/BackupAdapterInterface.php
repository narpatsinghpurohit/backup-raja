<?php

namespace App\Services\Adapters;

use App\Models\BackupOperation;
use App\Models\Connection;
use App\Services\LogService;

interface BackupAdapterInterface
{
    public function backup(Connection $source, string $tempPath, BackupOperation $operation, LogService $logService): string;
    public function canPause(): bool;
    public function pause(): void;
    public function resume(): void;
}
