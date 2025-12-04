<?php

namespace App\Http\Controllers;

use App\Models\BackupOperation;
use App\Models\Connection;
use App\Services\BackupService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BackupController extends Controller
{
    public function __construct(
        private BackupService $backupService
    ) {}

    public function index(Request $request)
    {
        $filters = $request->only(['status', 'source_connection_id', 'destination_connection_id', 'date_from', 'date_to']);
        $backups = $this->backupService->getBackupHistory($filters, 15);

        $stats = [
            'total' => BackupOperation::count(),
            'successful' => BackupOperation::where('status', 'completed')->count(),
            'failed' => BackupOperation::where('status', 'failed')->count(),
            'running' => BackupOperation::where('status', 'running')->count(),
        ];

        // Get connections for filter dropdowns
        $sources = Connection::whereIn('type', ['s3', 'mongodb'])->get(['id', 'name', 'type']);
        $destinations = Connection::whereIn('type', ['s3_destination', 'google_drive', 'local_storage'])->get(['id', 'name', 'type']);

        return Inertia::render('Backups/Index', [
            'backups' => $backups,
            'stats' => $stats,
            'filters' => $filters,
            'sources' => $sources,
            'destinations' => $destinations,
        ]);
    }

    public function create()
    {
        $sources = Connection::whereIn('type', ['s3', 'mongodb'])->get();
        $destinations = Connection::whereIn('type', ['s3_destination', 'google_drive', 'local_storage'])->get();

        return Inertia::render('Backups/Create', [
            'sources' => $sources,
            'destinations' => $destinations,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'source_connection_id' => 'required|exists:connections,id',
            'destination_connection_id' => 'required|exists:connections,id',
        ]);

        try {
            $source = Connection::findOrFail($validated['source_connection_id']);
            $destination = Connection::findOrFail($validated['destination_connection_id']);

            $operation = $this->backupService->initiateBackup($source, $destination);

            return redirect()->route('backups.show', $operation)
                ->with('success', 'Backup initiated successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function show(BackupOperation $backup)
    {
        $backup->load(['sourceConnection', 'destinationConnection', 'logs']);

        return Inertia::render('Backups/Show', [
            'backup' => $backup,
        ]);
    }

    public function pause(BackupOperation $backup)
    {
        try {
            $this->backupService->pauseBackup($backup);
            return back()->with('success', 'Backup paused');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function cancel(BackupOperation $backup)
    {
        try {
            $this->backupService->cancelBackup($backup);
            return back()->with('success', 'Backup cancelled');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function resume(BackupOperation $backup)
    {
        try {
            $this->backupService->resumeBackup($backup);
            return back()->with('success', 'Backup resumed');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
