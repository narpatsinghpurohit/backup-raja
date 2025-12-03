<?php

namespace App\Services\Adapters;

use App\Models\Connection;

interface BackupAdapterInterface
{
    public function backup(Connection $source, string $tempPath): string;
    public function canPause(): bool;
    public function pause(): void;
    public function resume(): void;
}
