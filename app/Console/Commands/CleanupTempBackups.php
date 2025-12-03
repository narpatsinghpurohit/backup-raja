<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CleanupTempBackups extends Command
{
    protected $signature = 'backups:cleanup-temp';
    protected $description = 'Clean up old temporary backup files';

    public function handle()
    {
        $tempPath = storage_path('app/temp/backups');
        
        if (!file_exists($tempPath)) {
            $this->info('No temporary backup directory found.');
            return 0;
        }

        $cutoffTime = now()->subDays(7)->timestamp;
        $deletedCount = 0;

        $files = glob($tempPath . '/*');
        foreach ($files as $file) {
            if (is_file($file) && filemtime($file) < $cutoffTime) {
                unlink($file);
                $deletedCount++;
            }
        }

        $this->info("Cleaned up {$deletedCount} temporary backup files.");
        return 0;
    }
}
