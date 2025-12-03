<?php

namespace App\Services\Adapters;

use App\Models\Connection;

class MongoRestoreAdapter implements RestoreAdapterInterface
{
    private bool $verified = false;

    public function restore(string $archivePath, Connection $destination, array $config): void
    {
        $credentials = $destination->credentials;
        
        // Extract archive
        $extractPath = dirname($archivePath) . '/extract_' . time();
        mkdir($extractPath, 0755, true);
        
        $command = sprintf(
            'tar -xzf %s -C %s',
            escapeshellarg($archivePath),
            escapeshellarg($extractPath)
        );
        exec($command);

        // Build mongorestore command
        $uri = $config['uri'] ?? $credentials['uri'];
        $database = $config['database'] ?? $credentials['database'];
        
        $restoreCommand = sprintf(
            'mongorestore --uri=%s --db=%s --gzip %s',
            escapeshellarg($uri),
            escapeshellarg($database),
            escapeshellarg($extractPath)
        );

        // Execute mongorestore
        exec($restoreCommand, $output, $returnCode);

        if ($returnCode !== 0) {
            throw new \Exception('Mongorestore failed: ' . implode("\n", $output));
        }

        // Clean up
        $this->deleteDirectory($extractPath);
        
        $this->verified = true;
    }

    public function verify(): bool
    {
        return $this->verified;
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
