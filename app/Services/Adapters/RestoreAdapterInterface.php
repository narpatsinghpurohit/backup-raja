<?php

namespace App\Services\Adapters;

use App\Models\Connection;
use App\Models\RestoreOperation;

interface RestoreAdapterInterface
{
    public function restore(string $archivePath, Connection $destination, array $config, ?RestoreOperation $operation = null): void;

    public function verify(): bool;
}
