<?php

namespace App\Console\Commands;

use App\Services\ScheduleService;
use Illuminate\Console\Command;

class RunScheduledBackups extends Command
{
    protected $signature = 'backups:run-scheduled';

    protected $description = 'Run all due scheduled backups';

    public function handle(ScheduleService $scheduleService): int
    {
        $count = $scheduleService->runDueSchedules();

        $this->info("Initiated {$count} scheduled backup(s)");

        return Command::SUCCESS;
    }
}
