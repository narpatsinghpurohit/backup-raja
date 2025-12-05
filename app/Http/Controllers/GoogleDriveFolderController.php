<?php

namespace App\Http\Controllers;

use App\Models\Connection;
use App\Services\GoogleDriveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoogleDriveFolderController extends Controller
{
    private ?Connection $currentConnection = null;
    private string $credentialSource = 'none';

    public function __construct(
        private GoogleDriveService $driveService
    ) {}

    /**
     * List folders (root or by parent_id)
     */
    public function index(Request $request): JsonResponse
    {
        $credentials = $this->getCredentials();
        
        if (!$credentials) {
            return response()->json([
                'error' => 'Not authenticated with Google Drive',
                'requiresAuth' => true,
            ], 401);
        }

        try {
            // Refresh token if needed before making API call
            $credentials = $this->ensureFreshToken($credentials);
            
            $parentId = $request->query('parent_id');
            $folders = $this->driveService->listFolders($parentId, $credentials);

            return response()->json(['folders' => $folders]);
        } catch (\Google\Service\Exception $e) {
            // Check for auth-related errors
            if ($e->getCode() === 401 || str_contains($e->getMessage(), 'invalid_grant') || str_contains($e->getMessage(), 'Token has been expired or revoked')) {
                return response()->json([
                    'error' => 'Google authentication expired. Please re-authenticate.',
                    'requiresAuth' => true,
                ], 401);
            }
            return response()->json(['error' => $e->getMessage()], 500);
        } catch (\Exception $e) {
            // Check for auth-related error messages
            if (str_contains($e->getMessage(), 'invalid_grant') || str_contains($e->getMessage(), 'Token has been expired or revoked')) {
                return response()->json([
                    'error' => 'Google authentication expired. Please re-authenticate.',
                    'requiresAuth' => true,
                ], 401);
            }
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Create a new folder
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|string',
        ]);

        $credentials = $this->getCredentials();
        
        if (!$credentials) {
            return response()->json([
                'error' => 'Not authenticated with Google Drive',
                'requiresAuth' => true,
            ], 401);
        }

        try {
            // Refresh token if needed before making API call
            $credentials = $this->ensureFreshToken($credentials);
            
            $folder = $this->driveService->createFolder(
                $request->input('name'),
                $request->input('parent_id'),
                $credentials
            );

            return response()->json(['folder' => $folder], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get folder details with path
     */
    public function show(string $id): JsonResponse
    {
        $credentials = $this->getCredentials();
        
        if (!$credentials) {
            return response()->json([
                'error' => 'Not authenticated with Google Drive',
                'requiresAuth' => true,
            ], 401);
        }

        try {
            // Refresh token if needed before making API call
            $credentials = $this->ensureFreshToken($credentials);
            
            $folder = $this->driveService->getFolderDetails($id, $credentials);

            return response()->json(['folder' => $folder]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Search folders by name
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'q' => 'required|string|min:1|max:100',
        ]);

        $credentials = $this->getCredentials();
        
        if (!$credentials) {
            return response()->json([
                'error' => 'Not authenticated with Google Drive',
                'requiresAuth' => true,
            ], 401);
        }

        try {
            // Refresh token if needed before making API call
            $credentials = $this->ensureFreshToken($credentials);
            
            $folders = $this->driveService->searchFolders(
                $request->query('q'),
                $credentials
            );

            return response()->json(['folders' => $folders]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get OAuth credentials from session or connection
     */
    private function getCredentials(): ?array
    {
        // First try session tokens (for new connections during OAuth flow)
        $tokens = session('google_oauth_tokens');
        
        if ($tokens && isset($tokens['access_token'])) {
            $this->credentialSource = 'session';
            return $tokens;
        }

        // If no session tokens, try to get from connection_id parameter (query or body)
        $connectionId = request()->query('connection_id') ?? request()->input('connection_id');
        if ($connectionId) {
            $connection = Connection::where('id', $connectionId)
                ->where('type', 'google_drive')
                ->first();
            
            if ($connection && isset($connection->credentials['access_token'])) {
                $this->currentConnection = $connection;
                $this->credentialSource = 'connection';
                return $connection->credentials;
            }
        }

        return null;
    }

    /**
     * Ensure we have a fresh (non-expired) token
     */
    private function ensureFreshToken(array $credentials): array
    {
        $refreshed = $this->driveService->refreshTokenIfExpired($credentials);
        
        if ($refreshed['token_refreshed']) {
            $newCredentials = [
                'access_token' => $refreshed['access_token'],
                'refresh_token' => $refreshed['refresh_token'],
                'expires_in' => $refreshed['expires_in'],
            ];
            
            // Update the appropriate storage based on where credentials came from
            if ($this->credentialSource === 'session') {
                session(['google_oauth_tokens' => $newCredentials]);
            } elseif ($this->credentialSource === 'connection' && $this->currentConnection) {
                // Update the connection in database with new tokens
                $existingCredentials = $this->currentConnection->credentials;
                $this->currentConnection->update([
                    'credentials' => array_merge($existingCredentials, [
                        'access_token' => $refreshed['access_token'],
                        // Keep existing refresh_token if new one not provided
                        'refresh_token' => $refreshed['refresh_token'] ?: ($existingCredentials['refresh_token'] ?? ''),
                    ]),
                ]);
            }
            
            return array_merge($credentials, $newCredentials);
        }
        
        return $credentials;
    }
}
