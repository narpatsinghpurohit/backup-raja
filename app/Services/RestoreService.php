<?php

namespace App\Services;

use App\Jobs\RestoreJob;
use App\Models\BackupOperation;
use App\Models\Connection;
use App\Models\RestoreOperation;
use Illuminate\Support\Collection;

class RestoreService
{
    public function initiateRestore(BackupOperation $backup, Connection $destination, array $config): RestoreOperation
    {
        // Create restore operation
        $operation = RestoreOperation::create([
            'backup_operation_id' => $backup->id,
            'destination_connection_id' => $destination->id,
            'destination_config' => $config,
            'status' => 'pending',
        ]);

        // Dispatch restore job
        RestoreJob::dispatch($operation);

        return $operation;
    }

    public function getRestoreHistory(): Collection
    {
        return RestoreOperation::with(['backupOperation', 'destinationConnection'])
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
