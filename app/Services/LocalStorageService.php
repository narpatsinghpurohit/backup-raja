<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;

class LocalStorageService
{
    /**
     * List folders in a directory
     */
    public function listFolders(string $disk, string $path = ''): array
    {
        $this->validateDisk($disk);
        $path = $this->sanitizePath($path);
        
        $diskInstance = Storage::disk($disk);
        $directories = $diskInstance->directories($path);
        
        $folders = [];
        foreach ($directories as $dir) {
            $name = basename($dir);
            
            // Skip hidden directories
            if (str_starts_with($name, '.')) {
                continue;
            }
            
            $hasChildren = count($diskInstance->directories($dir)) > 0;
            
            $folders[] = [
                'id' => $dir,
                'name' => $name,
                'path' => '/' . $dir,
                'parentPath' => $path ?: null,
                'hasChildren' => $hasChildren,
            ];
        }
        
        // Sort alphabetically
        usort($folders, fn($a, $b) => strcasecmp($a['name'], $b['name']));
        
        return $folders;
    }

    /**
     * Create a new folder
     */
    public function createFolder(string $disk, ?string $parentPath, string $name): array
    {
        $this->validateDisk($disk);
        $parentPath = $this->sanitizePath($parentPath ?? '');
        $name = $this->sanitizeFolderName($name);
        
        $fullPath = $parentPath ? "{$parentPath}/{$name}" : $name;
        
        $diskInstance = Storage::disk($disk);
        
        if ($diskInstance->exists($fullPath)) {
            throw new \RuntimeException("Folder '{$name}' already exists");
        }
        
        $diskInstance->makeDirectory($fullPath);
        
        return [
            'id' => $fullPath,
            'name' => $name,
            'path' => '/' . $fullPath,
            'parentPath' => $parentPath ?: null,
            'hasChildren' => false,
        ];
    }

    /**
     * Validate disk is allowed
     */
    private function validateDisk(string $disk): void
    {
        $allowedDisks = ['local', 'public'];
        if (!in_array($disk, $allowedDisks)) {
            throw new \InvalidArgumentException("Invalid storage disk: {$disk}");
        }
        
        if (!config("filesystems.disks.{$disk}")) {
            throw new \InvalidArgumentException("Storage disk '{$disk}' is not configured");
        }
    }

    /**
     * Sanitize path to prevent traversal attacks
     */
    private function sanitizePath(string $path): string
    {
        // Remove leading/trailing slashes
        $path = trim($path, '/');
        
        // Reject path traversal attempts
        if (str_contains($path, '..') || str_contains($path, './')) {
            throw new \InvalidArgumentException('Invalid path');
        }
        
        // Remove any null bytes
        $path = str_replace("\0", '', $path);
        
        return $path;
    }

    /**
     * Sanitize folder name
     */
    private function sanitizeFolderName(string $name): string
    {
        $name = trim($name);
        
        // Only allow alphanumeric, spaces, underscores, hyphens, dots
        if (!preg_match('/^[a-zA-Z0-9_\-\s\.]+$/', $name)) {
            throw new \InvalidArgumentException('Folder name contains invalid characters');
        }
        
        // Prevent hidden folders
        if (str_starts_with($name, '.')) {
            throw new \InvalidArgumentException('Folder name cannot start with a dot');
        }
        
        return $name;
    }
}
