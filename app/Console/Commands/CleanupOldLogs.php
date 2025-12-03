<?php

namespace App\Console\Commands;

use App\Services\LogService;
use Illuminate\Console\Command;

class CleanupOldLogs extends Command
{
    protected $signature = 'backups:cleanup-logs {--days=30 : Number of days to keep logs}';
    protected $description = 'Clean up old job logs';

    public function handle(LogService $logService)
    {
        $days = (int) $this->option('days');
        
        $logService->clearOldLogs($days);

        $this->info("Cleaned up logs older than {$days} days.");
        return 0;
    }
}
