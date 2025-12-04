<?php

namespace App\Services\Validators;

use Illuminate\Support\Facades\Storage;

class LocalStorageConnectionValidator implements ConnectionValidatorInterface
{
    public function validate(array $credentials): bool
    {
        $disk = $credentials['disk'] ?? 'local';
        $path = $credentials['path'] ?? 'backups';
        
        // Check if the disk exists in config
        if (!config("filesystems.disks.{$disk}")) {
            throw new \InvalidArgumentException("Storage disk '{$disk}' is not configured");
        }
        
        try {
            // Try to access the disk
            $diskInstance = Storage::disk($disk);
            
            // Ensure the path doesn't start with a slash
            $path = ltrim($path, '/');
            
            // Try to create the directory if it doesn't exist
            if (!$diskInstance->exists($path)) {
                $diskInstance->makeDirectory($path);
            }
            
            // Test write permissions by creating a test file
            $testFile = $path . '/.test_' . uniqid();
            $diskInstance->put($testFile, 'test');
            
            // Verify we can read it
            $content = $diskInstance->get($testFile);
            
            // Clean up test file
            $diskInstance->delete($testFile);
            
            return $content === 'test';
        } catch (\Exception $e) {
            throw new \RuntimeException('Server storage validation failed: ' . $e->getMessage());
        }
    }
}
