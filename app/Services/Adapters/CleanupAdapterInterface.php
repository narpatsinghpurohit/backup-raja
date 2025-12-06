<?php

namespace App\Services\Adapters;

use App\Models\Connection;

interface CleanupAdapterInterface
{
    public function deleteFile(string $path, Connection $connection): void;
}
