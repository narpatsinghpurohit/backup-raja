<?php

namespace App\Console\Commands;

use App\Models\BackupOperation;
use App\Models\JobLog;
use Illuminate\Console\Command;

class CheckBackupStatus extends Command
{
    protected $signature = 'backup:status {id? : The backup operation ID}';
    protected $description = 'Check the status of backup operations and view logs';

    public function handle()
    {
        $id = $this->argument('id');

        if ($id) {
            $this->showBackupDetails($id);
        } else {
            $this->showAllBackups();
        }
    }

    private function showAllBackups()
    {
        $backups = BackupOperation::with(['sourceConnection', 'destinationConnection'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        if ($backups->isEmpty()) {
            $this->info('No backup operations found.');
            return;
        }

        $this->info('Recent Backup Operations:');
        $this->newLine();

        $rows = [];
        foreach ($backups as $backup) {
            $rows[] = [
                $backup->id,
                $backup->sourceConnection->name,
                $backup->destinationConnection->name,
                $backup->status,
                $backup->created_at->format('Y-m-d H:i:s'),
                $backup->archive_size ? $this->formatBytes($backup->archive_size) : 'N/A',
            ];
        }

        $this->table(
            ['ID', 'Source', 'Destination', 'Status', 'Created', 'Size'],
            $rows
        );

        $this->newLine();
        $this->info('Use "php artisan backup:status {id}" to view detailed logs');
    }

    private function showBackupDetails($id)
    {
        $backup = BackupOperation::with(['sourceConnection', 'destinationConnection'])->find($id);

        if (!$backup) {
            $this->error("Backup operation #{$id} not found.");
            return;
        }

        $this->info("Backup Operation #{$backup->id}");
        $this->newLine();

        $this->table(
            ['Field', 'Value'],
            [
                ['Status', $backup->status],
                ['Source', $backup->sourceConnection->name . ' (' . $backup->sourceConnection->type . ')'],
                ['Destination', $backup->destinationConnection->name . ' (' . $backup->destinationConnection->type . ')'],
                ['Created', $backup->created_at->format('Y-m-d H:i:s')],
                ['Started', $backup->started_at ? $backup->started_at->format('Y-m-d H:i:s') : 'N/A'],
                ['Completed', $backup->completed_at ? $backup->completed_at->format('Y-m-d H:i:s') : 'N/A'],
                ['Archive Size', $backup->archive_size ? $this->formatBytes($backup->archive_size) : 'N/A'],
                ['Archive Path', $backup->archive_path ?? 'N/A'],
            ]
        );

        if ($backup->error_message) {
            $this->newLine();
            $this->error('Error: ' . $backup->error_message);
        }

        $this->newLine();
        $this->info('Operation Logs:');
        $this->newLine();

        $logs = JobLog::forOperation($backup)
            ->orderBy('created_at', 'asc')
            ->get();

        if ($logs->isEmpty()) {
            $this->warn('No logs found for this operation.');
            return;
        }

        foreach ($logs as $log) {
            $color = match($log->level) {
                'error' => 'red',
                'warning' => 'yellow',
                default => 'white',
            };

            $timestamp = $log->created_at->format('H:i:s');
            $this->line("<fg={$color}>[{$timestamp}] [{$log->level}] {$log->message}</>");
        }
    }

    private function formatBytes($bytes)
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }
}
