<?php

namespace App\Services\Adapters;

use App\Models\Connection;
use App\Models\RestoreOperation;
use Illuminate\Support\Facades\Storage;

class LocalStorageRestoreAdapter implements RestoreAdapterInterface
{
    public function restore(string $archivePath, Connection $destination, array $config, ?RestoreOperation $operation = null): void
    {
        $credentials = $destination->credentials;
        $disk = $credentials['disk'] ?? 'local';
        $targetPath = $config['path'] ?? 'restored';

        // Ensure the path doesn't start with a slash
        $targetPath = ltrim($targetPath, '/');

        // Extract archive to temporary location
        $tempExtractPath = storage_path('app/temp/restore_'.uniqid());
        mkdir($tempExtractPath, 0755, true);

        // Extract the archive
        $archive = new \ZipArchive;
        if ($archive->open($archivePath) === true) {
            $archive->extractTo($tempExtractPath);
            $archive->close();
        } else {
            // Try tar.gz
            exec("tar -xzf {$archivePath} -C {$tempExtractPath}");
        }

        // Upload extracted files to Laravel storage
        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($tempExtractPath),
            \RecursiveIteratorIterator::LEAVES_ONLY
        );

        foreach ($files as $file) {
            if (! $file->isDir()) {
                $filePath = $file->getRealPath();
                $relativePath = substr($filePath, strlen($tempExtractPath) + 1);
                $storagePath = $targetPath.'/'.$relativePath;

                Storage::disk($disk)->put($storagePath, file_get_contents($filePath));
            }
        }

        // Clean up temporary extraction directory
        $this->deleteDirectory($tempExtractPath);
    }

    private function deleteDirectory(string $dir): void
    {
        if (! file_exists($dir)) {
            return;
        }

        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = $dir.'/'.$file;
            is_dir($path) ? $this->deleteDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }
}
