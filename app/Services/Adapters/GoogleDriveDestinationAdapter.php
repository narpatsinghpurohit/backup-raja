<?php

namespace App\Services\Adapters;

use App\Models\Connection;
use Google\Client as GoogleClient;
use Google\Service\Drive;
use Google\Service\Drive\DriveFile;

class GoogleDriveDestinationAdapter implements DestinationAdapterInterface
{
    public function upload(string $archivePath, Connection $destination): string
    {
        $credentials = $destination->credentials;
        
        $client = new GoogleClient();
        $client->setAccessToken($credentials['access_token']);

        // Refresh token if expired
        if ($client->isAccessTokenExpired() && isset($credentials['refresh_token'])) {
            $client->fetchAccessTokenWithRefreshToken($credentials['refresh_token']);
        }

        $driveService = new Drive($client);

        $fileMetadata = new DriveFile([
            'name' => basename($archivePath),
            'parents' => isset($credentials['folder_id']) ? [$credentials['folder_id']] : [],
        ]);

        $content = file_get_contents($archivePath);
        
        $file = $driveService->files->create($fileMetadata, [
            'data' => $content,
            'mimeType' => 'application/gzip',
            'uploadType' => 'multipart',
            'fields' => 'id,webViewLink',
        ]);

        return $file->webViewLink ?? $file->id;
    }
}
