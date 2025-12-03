<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BackupOperation;
use App\Models\RestoreOperation;
use App\Services\LogService;
use Illuminate\Http\Request;

class BackupLogController extends Controller
{
    public function __construct(
        private LogService $logService
    ) {}

    public function index(Request $request, BackupOperation $backup)
    {
        $sinceId = $request->query('since_id');
        
        $logs = $this->logService->getLogsForOperation($backup, $sinceId);

        return response()->json([
            'logs' => $logs,
            'status' => $backup->status,
        ]);
    }

    public function restoreLogs(Request $request, RestoreOperation $restore)
    {
        $sinceId = $request->query('since_id');
        
        $logs = $this->logService->getLogsForOperation($restore, $sinceId);

        return response()->json([
            'logs' => $logs,
            'status' => $restore->status,
        ]);
    }
}
