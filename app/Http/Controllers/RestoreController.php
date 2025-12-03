<?php

namespace App\Http\Controllers;

use App\Models\BackupOperation;
use App\Models\Connection;
use App\Models\RestoreOperation;
use App\Services\RestoreService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RestoreController extends Controller
{
    public function __construct(
        private RestoreService $restoreService
    ) {}

    public function create(BackupOperation $backup)
    {
        $destinations = Connection::whereIn('type', ['s3_destination', 'mongodb', 'local_storage'])->get();

        return Inertia::render('Restores/Create', [
            'backup' => $backup->load('sourceConnection'),
            'destinations' => $destinations,
        ]);
    }

    public function store(Request $request, BackupOperation $backup)
    {
        $validated = $request->validate([
            'destination_connection_id' => 'required|exists:connections,id',
            'config' => 'required|array',
        ]);

        try {
            $destination = Connection::findOrFail($validated['destination_connection_id']);
            $operation = $this->restoreService->initiateRestore(
                $backup,
                $destination,
                $validated['config']
            );

            return redirect()->route('restores.show', $operation)
                ->with('success', 'Restore initiated successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function show(RestoreOperation $restore)
    {
        $restore->load(['backupOperation', 'destinationConnection', 'logs']);

        return Inertia::render('Restores/Show', [
            'restore' => $restore,
        ]);
    }
}
