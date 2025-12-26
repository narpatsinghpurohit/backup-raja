<?php

namespace App\Services\Adapters;

use App\Models\Connection;
use App\Models\RestoreOperation;
use App\Services\LogService;

class MongoRestoreAdapter implements RestoreAdapterInterface
{
    private bool $verified = false;

    private ?LogService $logService = null;

    private ?RestoreOperation $operation = null;

    public function restore(string $archivePath, Connection $destination, array $config, ?RestoreOperation $operation = null): void
    {
        $this->operation = $operation;
        $this->logService = app(LogService::class);

        $credentials = $destination->credentials;

        // Get target URI and database (can be overridden via config)
        $targetUri = $config['uri'] ?? $credentials['uri'];
        $targetDatabase = $config['database'] ?? $credentials['database'];

        // Get source database from backup metadata or config
        $sourceDatabase = $config['source_database'] ?? $targetDatabase;

        $this->log('info', 'STEP 1/3: Extracting backup archive...');

        // Extract archive
        $extractPath = dirname($archivePath).'/extract_'.time();
        mkdir($extractPath, 0755, true);

        $command = sprintf(
            'tar -xzf %s -C %s 2>&1',
            escapeshellarg($archivePath),
            escapeshellarg($extractPath)
        );
        exec($command, $extractOutput, $extractReturnCode);

        if ($extractReturnCode !== 0) {
            $this->log('error', 'Failed to extract archive: '.implode("\n", $extractOutput));
            throw new \Exception('Failed to extract archive: '.implode("\n", $extractOutput));
        }

        // Find the database directory inside the extracted archive
        $databasePath = $this->findDatabaseDirectory($extractPath, $sourceDatabase);
        if (! $databasePath) {
            $this->log('error', "Database directory not found in archive for: {$sourceDatabase}");
            throw new \Exception("Database directory not found in archive for: {$sourceDatabase}");
        }

        $this->log('info', 'Archive extracted successfully');
        $this->log('info', "Source database found: {$sourceDatabase}");

        // Count collections for logging
        $collections = glob($databasePath.'/*.bson.gz');
        $collectionCount = count($collections);
        $this->log('info', "Found {$collectionCount} collections to restore");

        $this->log('info', 'STEP 2/3: Restoring to MongoDB cluster...');

        // Log the database rename if applicable
        if ($sourceDatabase !== $targetDatabase) {
            $this->log('info', "🔄 Renaming database: {$sourceDatabase} → {$targetDatabase}");
        } else {
            $this->log('info', "Target database: {$targetDatabase}");
        }

        // Build mongorestore command with namespace renaming support
        if ($sourceDatabase !== $targetDatabase) {
            // Use --nsFrom and --nsTo for database rename
            $restoreCommand = sprintf(
                'mongorestore --uri=%s --nsFrom=%s --nsTo=%s --gzip %s 2>&1',
                escapeshellarg($targetUri),
                escapeshellarg("{$sourceDatabase}.*"),
                escapeshellarg("{$targetDatabase}.*"),
                escapeshellarg($databasePath)
            );
        } else {
            // Standard restore without rename
            $restoreCommand = sprintf(
                'mongorestore --uri=%s --db=%s --gzip %s 2>&1',
                escapeshellarg($targetUri),
                escapeshellarg($targetDatabase),
                escapeshellarg($databasePath)
            );
        }

        $this->log('info', 'Executing mongorestore...');

        // Execute mongorestore
        $startTime = microtime(true);
        exec($restoreCommand, $output, $returnCode);
        $duration = round(microtime(true) - $startTime, 2);

        // Parse and log mongorestore output
        foreach ($output as $line) {
            $trimmedLine = trim($line);
            if (empty($trimmedLine)) {
                continue;
            }

            // Log collection progress
            if (stripos($trimmedLine, 'restoring') !== false ||
                stripos($trimmedLine, 'finished restoring') !== false ||
                stripos($trimmedLine, 'documents') !== false) {
                $this->log('info', $trimmedLine);
            } elseif (stripos($trimmedLine, 'error') !== false ||
                      stripos($trimmedLine, 'failed') !== false) {
                $this->log('error', $trimmedLine);
            }
        }

        if ($returnCode !== 0) {
            $this->log('error', 'Mongorestore failed with exit code: '.$returnCode);
            throw new \Exception('Mongorestore failed: '.implode("\n", $output));
        }

        $this->log('info', "Restore completed in {$duration} seconds");

        $this->log('info', 'STEP 3/3: Cleaning up...');

        // Clean up
        $this->deleteDirectory($extractPath);

        $this->log('info', '✅ Migration completed successfully!');
        $this->log('info', "Database '{$targetDatabase}' is now available on the target cluster");

        $this->verified = true;
    }

    public function verify(): bool
    {
        return $this->verified;
    }

    private function log(string $level, string $message): void
    {
        if ($this->logService && $this->operation) {
            $this->logService->log($this->operation, $level, $message);
        }
    }

    private function findDatabaseDirectory(string $extractPath, string $databaseName): ?string
    {
        // Check if the database directory exists directly
        $directPath = $extractPath.'/'.$databaseName;
        if (is_dir($directPath)) {
            return $directPath;
        }

        // Search for the database directory recursively (in case of nested structure)
        $iterator = new \RecursiveDirectoryIterator($extractPath, \RecursiveDirectoryIterator::SKIP_DOTS);
        $recursive = new \RecursiveIteratorIterator($iterator, \RecursiveIteratorIterator::SELF_FIRST);

        foreach ($recursive as $file) {
            if ($file->isDir() && $file->getFilename() === $databaseName) {
                return $file->getPathname();
            }
        }

        // If no specific database directory found, check if BSON files exist directly
        $bsonFiles = glob($extractPath.'/*.bson.gz');
        if (! empty($bsonFiles)) {
            return $extractPath;
        }

        return null;
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
