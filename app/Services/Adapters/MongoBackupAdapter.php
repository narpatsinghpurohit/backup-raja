<?php

namespace App\Services\Adapters;

use App\Models\Connection;

class MongoBackupAdapter implements BackupAdapterInterface
{
    private bool $isPaused = false;

    public function backup(Connection $source, string $tempPath): string
    {
        $credentials = $source->credentials;
        
        // Create output directory
        $outputPath = $tempPath . '/mongo_backup';
        if (!file_exists($outputPath)) {
            mkdir($outputPath, 0755, true);
        }

        // Build mongodump command
        $uri = $credentials['uri'];
        $database = $credentials['database'];
        
        $command = sprintf(
            'mongodump --uri=%s --db=%s --out=%s --gzip',
            escapeshellarg($uri),
            escapeshellarg($database),
            escapeshellarg($outputPath)
        );

        // Execute mongodump
        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            throw new \Exception('Mongodump failed: ' . implode("\n", $output));
        }

        // Create tar.gz archive
        $archivePath = $tempPath . '/backup_' . time() . '.tar.gz';
        $tarCommand = sprintf(
            'tar -czf %s -C %s .',
            escapeshellarg($archivePath),
            escapeshellarg($outputPath)
        );
        exec($tarCommand);

        // Clean up temp directory
        $this->deleteDirectory($outputPath);

        return $archivePath;
    }

    public function canPause(): bool
    {
        return false; // mongodump doesn't support pausing
    }

    public function pause(): void
    {
        // Not supported
    }

    public function resume(): void
    {
        // Not supported
    }

    private function deleteDirectory(string $dir): void
    {
        if (!file_exists($dir)) {
            return;
        }

        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            is_dir($path) ? $this->deleteDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }
}
