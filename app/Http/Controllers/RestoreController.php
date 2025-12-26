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
        $backup->load('sourceConnection');
        $sourceType = $backup->sourceConnection->type;
        $sourceDatabase = $backup->metadata['source_database'] ?? $backup->sourceConnection->credentials['database'] ?? null;

        // Filter destinations based on source type - only show compatible restore targets
        $destinations = match ($sourceType) {
            'mongodb' => Connection::where('type', 'mongodb')->get(),
            's3', 's3_source' => Connection::where('type', 's3_destination')->get(),
            default => Connection::whereIn('type', ['s3_destination', 'mongodb', 'local_storage'])->get(),
        };

        // Transform destinations to include database info for frontend matching
        $destinationsWithMeta = $destinations->map(function ($dest) use ($sourceDatabase) {
            return [
                'id' => $dest->id,
                'name' => $dest->name,
                'type' => $dest->type,
                'database' => $dest->credentials['database'] ?? null,
                'is_match' => ($dest->credentials['database'] ?? null) === $sourceDatabase,
            ];
        });

        return Inertia::render('Restores/Create', [
            'backup' => $backup,
            'destinations' => $destinationsWithMeta,
            'sourceDatabase' => $sourceDatabase,
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
        $restore->load(['backupOperation.sourceConnection', 'destinationConnection', 'logs']);

        return Inertia::render('Restores/Show', [
            'restore' => $restore,
        ]);
    }
}
