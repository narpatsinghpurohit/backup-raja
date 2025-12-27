<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreConnectionRequest;
use App\Http\Requests\UpdateConnectionRequest;
use App\Models\Connection;
use App\Services\ConnectionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConnectionController extends Controller
{
    public function __construct(
        private ConnectionService $connectionService
    ) {}

    public function index(Request $request)
    {
        $connections = Connection::orderBy('created_at', 'desc')->get();

        return Inertia::render('Connections/Index', [
            'connections' => $connections,
            'filters' => [
                'tab' => $request->get('tab', 'source'),
                'search' => $request->get('search', ''),
                'tech' => $request->get('tech', 'all'),
                'view' => $request->get('view', 'grid'),
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Connections/Create', [
            'googleOAuthConfigured' => ! empty(config('services.google.client_id')),
        ]);
    }

    public function createGoogleDrive()
    {
        // Check if OAuth tokens are in session
        if (! session()->has('google_oauth_tokens')) {
            return redirect()->route('connections.create')
                ->withErrors(['error' => 'No OAuth tokens found. Please connect to Google Drive again.']);
        }

        $tokens = session('google_oauth_tokens');
        $email = session('google_oauth_email', 'Unknown');

        return Inertia::render('Connections/CreateGoogleDrive', [
            'suggestedName' => "Google Drive - {$email}",
            'email' => $email,
        ]);
    }

    public function store(StoreConnectionRequest $request)
    {
        try {
            $data = $request->validated();

            // Check if this is a Google Drive connection
            if ($data['type'] === 'google_drive') {
                $credentials = $data['credentials'] ?? [];

                // If credentials already have access_token (from duplicate), use them directly
                if (! empty($credentials['access_token'])) {
                    // Credentials are already complete (duplicate flow)
                    $data['credentials'] = $credentials;
                } else {
                    // New connection - get tokens from OAuth session
                    if (! session()->has('google_oauth_tokens')) {
                        return back()->withErrors(['error' => 'OAuth session expired. Please connect to Google Drive again.']);
                    }

                    $tokens = session('google_oauth_tokens');
                    $data['credentials'] = array_merge($credentials, [
                        'access_token' => $tokens['access_token'],
                        'refresh_token' => $tokens['refresh_token'] ?? '',
                    ]);

                    // Clear OAuth session data after successful use
                    session()->forget(['google_oauth_tokens', 'google_oauth_email', 'google_oauth_state']);
                }
            }

            $connection = $this->connectionService->createConnection($data);

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

    public function duplicate(Connection $connection)
    {
        // For duplication, we expose all credentials (including sensitive ones)
        // so the user can create a new connection with the same credentials
        $credentials = $connection->credentials;

        return Inertia::render('Connections/Duplicate', [
            'baseConnection' => [
                'id' => $connection->id,
                'name' => $connection->name,
                'type' => $connection->type,
                'credentials' => $credentials,
            ],
        ]);
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
