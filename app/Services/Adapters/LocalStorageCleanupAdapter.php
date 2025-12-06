<?php

namespace App\Services\Adapters;

use App\Models\Connection;
use Illuminate\Support\Facades\Storage;

class LocalStorageCleanupAdapter implements CleanupAdapterInterface
{
    public function deleteFile(string $path, Connection $connection): void
    {
        $disk = $connection->credentials['disk'] ?? 'local';

        // Extract relative path from full path
        $basePath = Storage::disk($disk)->path('');
        $relativePath = str_replace($basePath, '', $path);
        $relativePath = ltrim($relativePath, '/');

        if (Storage::disk($disk)->exists($relativePath)) {
            Storage::disk($disk)->delete($relativePath);
        }
    }
}
