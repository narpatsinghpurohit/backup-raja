<?php

namespace App\Http\Controllers;

use App\Services\GoogleDriveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoogleDriveFolderController extends Controller
{
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
            $parentId = $request->query('parent_id');
            $folders = $this->driveService->listFolders($parentId, $credentials);
            
            // Update session if token was refreshed
            $this->updateSessionTokens($credentials);

            return response()->json(['folders' => $folders]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
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
            $folder = $this->driveService->createFolder(
                $request->input('name'),
                $request->input('parent_id'),
                $credentials
            );
            
            $this->updateSessionTokens($credentials);

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
            $folder = $this->driveService->getFolderDetails($id, $credentials);
            $this->updateSessionTokens($credentials);

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
            $folders = $this->driveService->searchFolders(
                $request->query('q'),
                $credentials
            );
            
            $this->updateSessionTokens($credentials);

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
            return $tokens;
        }

        // If no session tokens, try to get from connection_id parameter
        $connectionId = request()->query('connection_id');
        if ($connectionId) {
            $connection = \App\Models\Connection::where('id', $connectionId)
                ->where('type', 'google_drive')
                ->first();
            
            if ($connection && isset($connection->credentials['access_token'])) {
                return $connection->credentials;
            }
        }

        return null;
    }

    /**
     * Update session with refreshed tokens
     */
    private function updateSessionTokens(array $credentials): void
    {
        $refreshed = $this->driveService->refreshTokenIfExpired($credentials);
        
        if ($refreshed['token_refreshed']) {
            session(['google_oauth_tokens' => [
                'access_token' => $refreshed['access_token'],
                'refresh_token' => $refreshed['refresh_token'],
                'expires_in' => $refreshed['expires_in'],
            ]]);
        }
    }
}
