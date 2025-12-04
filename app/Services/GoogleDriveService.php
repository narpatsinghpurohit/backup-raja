<?php

namespace App\Services;

use Google\Client as GoogleClient;
use Google\Service\Drive;
use Google\Service\Drive\DriveFile;

class GoogleDriveService
{
    private GoogleClient $client;

    public function __construct()
    {
        $this->client = new GoogleClient();
        $this->client->setClientId(config('services.google.client_id'));
        $this->client->setClientSecret(config('services.google.client_secret'));
    }

    /**
     * List folders in Google Drive
     */
    public function listFolders(?string $parentId, array $credentials): array
    {
        $this->setAccessToken($credentials);
        $driveService = new Drive($this->client);

        $query = "mimeType='application/vnd.google-apps.folder' and trashed=false";
        
        if ($parentId) {
            $query .= " and '{$parentId}' in parents";
        } else {
            $query .= " and 'root' in parents";
        }

        try {
            $results = $driveService->files->listFiles([
                'q' => $query,
                'fields' => 'files(id, name, parents, mimeType, createdTime, modifiedTime)',
                'orderBy' => 'name',
                'pageSize' => 100,
            ]);

            $folders = [];
            foreach ($results->getFiles() as $file) {
                $folders[] = $this->formatFolder($file, $driveService);
            }

            return $folders;
        } catch (\Exception $e) {
            throw new \Exception('Failed to list folders: ' . $e->getMessage());
        }
    }

    /**
     * Create a new folder in Google Drive
     */
    public function createFolder(string $name, ?string $parentId, array $credentials): array
    {
        $this->setAccessToken($credentials);
        $driveService = new Drive($this->client);

        $fileMetadata = new DriveFile([
            'name' => $name,
            'mimeType' => 'application/vnd.google-apps.folder',
        ]);

        if ($parentId) {
            $fileMetadata->setParents([$parentId]);
        }

        try {
            $folder = $driveService->files->create($fileMetadata, [
                'fields' => 'id, name, parents, mimeType, createdTime, modifiedTime',
            ]);

            return $this->formatFolder($folder, $driveService);
        } catch (\Exception $e) {
            throw new \Exception('Failed to create folder: ' . $e->getMessage());
        }
    }


    /**
     * Get folder details with full path
     */
    public function getFolderDetails(string $folderId, array $credentials): array
    {
        $this->setAccessToken($credentials);
        $driveService = new Drive($this->client);

        try {
            $folder = $driveService->files->get($folderId, [
                'fields' => 'id, name, parents, mimeType, createdTime, modifiedTime',
            ]);

            $result = $this->formatFolder($folder, $driveService);
            $result['path'] = $this->buildFolderPath($folderId, $driveService);

            return $result;
        } catch (\Exception $e) {
            throw new \Exception('Failed to get folder details: ' . $e->getMessage());
        }
    }

    /**
     * Search folders by name
     */
    public function searchFolders(string $query, array $credentials): array
    {
        $this->setAccessToken($credentials);
        $driveService = new Drive($this->client);

        $searchQuery = "mimeType='application/vnd.google-apps.folder' and trashed=false and name contains '{$query}'";

        try {
            $results = $driveService->files->listFiles([
                'q' => $searchQuery,
                'fields' => 'files(id, name, parents, mimeType, createdTime, modifiedTime)',
                'orderBy' => 'name',
                'pageSize' => 50,
            ]);

            $folders = [];
            foreach ($results->getFiles() as $file) {
                $folder = $this->formatFolder($file, $driveService);
                $folder['path'] = $this->buildFolderPath($file->getId(), $driveService);
                $folders[] = $folder;
            }

            return $folders;
        } catch (\Exception $e) {
            throw new \Exception('Failed to search folders: ' . $e->getMessage());
        }
    }

    /**
     * Refresh access token if expired
     */
    public function refreshTokenIfExpired(array $credentials): array
    {
        $this->client->setAccessToken($credentials['access_token']);

        if ($this->client->isAccessTokenExpired() && isset($credentials['refresh_token'])) {
            $this->client->fetchAccessTokenWithRefreshToken($credentials['refresh_token']);
            $newToken = $this->client->getAccessToken();
            
            return [
                'access_token' => $newToken['access_token'],
                'refresh_token' => $credentials['refresh_token'],
                'expires_in' => $newToken['expires_in'] ?? 3600,
                'token_refreshed' => true,
            ];
        }

        return array_merge($credentials, ['token_refreshed' => false]);
    }

    /**
     * Set access token and refresh if needed
     */
    private function setAccessToken(array $credentials): void
    {
        $this->client->setAccessToken($credentials['access_token']);

        if ($this->client->isAccessTokenExpired() && isset($credentials['refresh_token'])) {
            $this->client->fetchAccessTokenWithRefreshToken($credentials['refresh_token']);
        }
    }

    /**
     * Format folder data for response
     */
    private function formatFolder($file, Drive $driveService): array
    {
        $hasChildren = $this->checkHasChildren($file->getId(), $driveService);
        $parents = $file->getParents();

        return [
            'id' => $file->getId(),
            'name' => $file->getName(),
            'parentId' => $parents ? $parents[0] : null,
            'hasChildren' => $hasChildren,
            'mimeType' => $file->getMimeType(),
            'createdTime' => $file->getCreatedTime(),
            'modifiedTime' => $file->getModifiedTime(),
        ];
    }

    /**
     * Check if folder has child folders
     */
    private function checkHasChildren(string $folderId, Drive $driveService): bool
    {
        try {
            $results = $driveService->files->listFiles([
                'q' => "mimeType='application/vnd.google-apps.folder' and trashed=false and '{$folderId}' in parents",
                'fields' => 'files(id)',
                'pageSize' => 1,
            ]);

            return count($results->getFiles()) > 0;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Build full path for a folder
     */
    private function buildFolderPath(string $folderId, Drive $driveService): string
    {
        $path = [];
        $currentId = $folderId;
        $maxDepth = 20; // Prevent infinite loops

        while ($currentId && $maxDepth > 0) {
            try {
                $file = $driveService->files->get($currentId, [
                    'fields' => 'id, name, parents',
                ]);

                $path[] = $file->getName();
                $parents = $file->getParents();
                $currentId = $parents ? $parents[0] : null;
                
                // Stop if we reach root
                if (!$parents) {
                    break;
                }
                
                $maxDepth--;
            } catch (\Exception $e) {
                break;
            }
        }

        return '/' . implode('/', array_reverse($path));
    }
}
