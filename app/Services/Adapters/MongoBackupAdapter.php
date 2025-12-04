<?php

namespace App\Services\Adapters;

use App\Models\BackupOperation;
use App\Models\Connection;
use App\Services\LogService;

class MongoBackupAdapter implements BackupAdapterInterface
{
    private bool $isPaused = false;

    public function backup(Connection $source, string $tempPath, BackupOperation $operation, LogService $logService): string
    {
        $credentials = $source->credentials;
        
        $logService->log($operation, 'info', 'Starting MongoDB backup...');
        $logService->log($operation, 'info', "Database: {$credentials['database']}");
        
        // Create output directory
        $outputPath = $tempPath . '/mongo_backup_' . time();
        if (!file_exists($outputPath)) {
            mkdir($outputPath, 0755, true);
        }

        // Build mongodump command
        $uri = $credentials['uri'];
        $database = $credentials['database'];
        
        $command = sprintf(
            'mongodump --uri=%s --db=%s --out=%s --gzip 2>&1',
            escapeshellarg($uri),
            escapeshellarg($database),
            escapeshellarg($outputPath)
        );

        $logService->log($operation, 'info', 'Executing mongodump...');
        $logService->log($operation, 'info', 'Command: mongodump --uri=*** --db=' . $database . ' --gzip');

        // Execute mongodump and capture output
        $startTime = microtime(true);
        exec($command, $output, $returnCode);
        $duration = round(microtime(true) - $startTime, 2);

        if ($returnCode !== 0) {
            $logService->log($operation, 'error', 'Mongodump failed with exit code: ' . $returnCode);
            $logService->log($operation, 'error', 'Output: ' . implode("\n", $output));
            throw new \Exception('Mongodump failed: ' . implode("\n", $output));
        }

        // Parse mongodump output for details
        foreach ($output as $line) {
            if (stripos($line, 'done dumping') !== false || 
                stripos($line, 'writing') !== false ||
                stripos($line, 'collection') !== false) {
                $logService->log($operation, 'info', trim($line));
            }
        }

        $logService->log($operation, 'info', "MongoDB dump completed in {$duration} seconds");

        // Count collections and get size
        $collections = $this->countCollections($outputPath . '/' . $database);
        if ($collections > 0) {
            $logService->log($operation, 'info', "Total collections backed up: {$collections}");
        }

        $dumpSize = $this->getDirectorySize($outputPath);
        $logService->log($operation, 'info', "Dump size: " . $this->formatBytes($dumpSize));

        // Create tar.gz archive
        $logService->log($operation, 'info', 'Creating compressed archive...');
        $archivePath = $tempPath . '/backup_' . time() . '.tar.gz';
        $tarCommand = sprintf(
            'tar -czf %s -C %s . 2>&1',
            escapeshellarg($archivePath),
            escapeshellarg($outputPath)
        );
        
        exec($tarCommand, $tarOutput, $tarReturnCode);
        
        if ($tarReturnCode !== 0) {
            $logService->log($operation, 'error', 'Archive creation failed');
            throw new \Exception('Failed to create archive');
        }

        $archiveSize = filesize($archivePath);
        $logService->log($operation, 'info', "Archive created successfully");
        $logService->log($operation, 'info', "Compressed size: " . $this->formatBytes($archiveSize));
        
        if ($dumpSize > 0) {
            $compressionRatio = round(($dumpSize - $archiveSize) / $dumpSize * 100, 1);
            $logService->log($operation, 'info', "Compression ratio: {$compressionRatio}%");
        }

        // Clean up temp directory
        $this->deleteDirectory($outputPath);

        return $archivePath;
    }
    
    private function countCollections(string $path): int
    {
        if (!is_dir($path)) {
            return 0;
        }
        
        $files = glob($path . '/*.bson.gz');
        return count($files);
    }
    
    private function getDirectorySize(string $path): int
    {
        $size = 0;
        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS)
        );
        
        foreach ($files as $file) {
            $size += $file->getSize();
        }
        
        return $size;
    }
    
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));
        
        return round($bytes, 2) . ' ' . $units[$pow];
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
