<?php

namespace App\Services\Adapters;

use App\Models\Connection;

interface DestinationAdapterInterface
{
    public function upload(string $archivePath, Connection $destination): string;
}
