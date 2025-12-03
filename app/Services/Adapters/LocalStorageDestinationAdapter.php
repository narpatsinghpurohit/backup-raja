<?php

namespace App\Services\Adapters;

use App\Models\Connection;
use Illuminate\Support\Facades\Storage;

class LocalStorageDestinationAdapter implements DestinationAdapterInterface
{
    public function upload(string $archivePath, Connection $destination): string
    {
        $credentials = $destination->credentials;
        $disk = $credentials['disk'] ?? 'local';
        $path = $credentials['path'] ?? 'backups';
        
        // Ensure the path doesn't start with a slash for Laravel Storage
        $path = ltrim($path, '/');
        
        $fileName = basename($archivePath);
        $fullPath = $path . '/' . $fileName;
        
        // Upload the file to Laravel storage
        $fileContents = file_get_contents($archivePath);
        Storage::disk($disk)->put($fullPath, $fileContents);
        
        // Return the storage path
        return Storage::disk($disk)->path($fullPath);
    }
}
