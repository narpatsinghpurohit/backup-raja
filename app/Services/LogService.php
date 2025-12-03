<?php

namespace App\Services;

use App\Models\JobLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class LogService
{
    public function log(Model $loggable, string $level, string $message, array $context = []): void
    {
        JobLog::create([
            'loggable_type' => get_class($loggable),
            'loggable_id' => $loggable->id,
            'level' => $level,
            'message' => $message,
            'context' => $context,
        ]);
    }

    public function getLogsForOperation(Model $operation, ?int $sinceId = null): Collection
    {
        $query = JobLog::forOperation($operation)
            ->orderBy('created_at', 'asc');

        if ($sinceId !== null) {
            $query->where('id', '>', $sinceId);
        }

        return $query->get();
    }

    public function clearOldLogs(int $daysToKeep): void
    {
        $cutoffDate = now()->subDays($daysToKeep);
        
        JobLog::where('created_at', '<', $cutoffDate)->delete();
    }
}
