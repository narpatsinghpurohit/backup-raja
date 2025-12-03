<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreConnectionRequest;
use App\Http\Requests\UpdateConnectionRequest;
use App\Models\Connection;
use App\Services\ConnectionService;
use Inertia\Inertia;

class ConnectionController extends Controller
{
    public function __construct(
        private ConnectionService $connectionService
    ) {}

    public function index()
    {
        $connections = Connection::orderBy('created_at', 'desc')->get();

        return Inertia::render('Connections/Index', [
            'connections' => $connections,
        ]);
    }

    public function create()
    {
        return Inertia::render('Connections/Create');
    }

    public function store(StoreConnectionRequest $request)
    {
        try {
            $connection = $this->connectionService->createConnection($request->validated());

            return redirect()->route('connections.index')
                ->with('success', 'Connection created successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function edit(Connection $connection)
    {
        // Prepare credentials for display (mask sensitive fields)
        $credentials = $connection->credentials;
        $safeCredentials = [];
        
        if ($connection->type === 's3' || $connection->type === 's3_destination') {
            $safeCredentials = [
                'access_key' => $credentials['access_key'] ?? '',
                'region' => $credentials['region'] ?? '',
                'bucket' => $credentials['bucket'] ?? '',
                // Don't expose secret_key
            ];
        } elseif ($connection->type === 'mongodb') {
            $safeCredentials = [
                'uri' => $credentials['uri'] ?? '',
                'database' => $credentials['database'] ?? '',
            ];
        } elseif ($connection->type === 'google_drive') {
            $safeCredentials = [
                'folder_id' => $credentials['folder_id'] ?? '',
                // Don't expose tokens
            ];
        } elseif ($connection->type === 'local_storage') {
            $safeCredentials = [
                'disk' => $credentials['disk'] ?? 'local',
                'path' => $credentials['path'] ?? 'backups',
            ];
        }

        return Inertia::render('Connections/Edit', [
            'connection' => [
                'id' => $connection->id,
                'name' => $connection->name,
                'type' => $connection->type,
                'credentials' => $safeCredentials,
            ],
        ]);
    }

    public function update(UpdateConnectionRequest $request, Connection $connection)
    {
        try {
            $this->connectionService->updateConnection($connection, $request->validated());

            return redirect()->route('connections.index')
                ->with('success', 'Connection updated successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function destroy(Connection $connection)
    {
        try {
            $this->connectionService->deleteConnection($connection);

            return redirect()->route('connections.index')
                ->with('success', 'Connection deleted successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
