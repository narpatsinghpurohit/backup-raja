<?php

namespace App\Services\Adapters;

use App\Models\Connection;

interface RestoreAdapterInterface
{
    public function restore(string $archivePath, Connection $destination, array $config): void;
    public function verify(): bool;
}
