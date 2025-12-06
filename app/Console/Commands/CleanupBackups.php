<?php

namespace App\Console\Commands;

use App\Services\CleanupService;
use App\Services\RetentionService;
use Illuminate\Console\Command;

class CleanupBackups extends Command
{
    protected $signature = 'backups:cleanup {--dry-run : Show what would be deleted without actually deleting}';
    protected $description = 'Clean up expired backups based on retention policies';

    public function handle(CleanupService $cleanupService, RetentionService $retentionService): int
    {
        if ($this->option('dry-run')) {
            $expired = $retentionService->getExpiredBackups();
            $this->info("Would delete {$expired->count()} backup(s):");
            foreach ($expired as $backup) {
                $sourceName = $backup->sourceConnection?->name ?? 'Unknown';
                $this->line("  - #{$backup->id}: {$sourceName} ({$backup->created_at})");
            }
            return Command::SUCCESS;
        }

        $this->info('Running backup cleanup...');

        $results = $cleanupService->runCleanup();

        $this->info("Processed: {$results['processed']}");
        $this->info("Deleted: {$results['deleted']}");

        if ($results['failed'] > 0) {
            $this->warn("Failed: {$results['failed']}");
            foreach ($results['errors'] as $error) {
                $this->error("  Backup #{$error['backup_id']}: {$error['error']}");
            }
        }

        return $results['failed'] > 0 ? Command::FAILURE : Command::SUCCESS;
    }
}
