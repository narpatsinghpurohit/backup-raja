<?php

namespace App\Services\Validators;

use Google\Client as GoogleClient;
use Google\Service\Drive;

class GoogleDriveConnectionValidator implements ConnectionValidatorInterface
{
    private array $refreshedCredentials = [];

    public function validate(array $credentials): bool
    {
        // Check required fields exist
        if (empty($credentials['access_token'])) {
            throw new \InvalidArgumentException('Google Drive access token is required');
        }

        try {
            $client = new GoogleClient();
            // Configure client with OAuth credentials for token refresh
            $client->setClientId(config('services.google.client_id'));
            $client->setClientSecret(config('services.google.client_secret'));
            $client->setAccessToken($credentials['access_token']);

            // Check if token is expired and refresh if needed
            if ($client->isAccessTokenExpired()) {
                if (!empty($credentials['refresh_token'])) {
                    $client->fetchAccessTokenWithRefreshToken($credentials['refresh_token']);
                    // Store refreshed credentials to be retrieved later
                    $newToken = $client->getAccessToken();
                    $this->refreshedCredentials = [
                        'access_token' => $newToken['access_token'],
                        'refresh_token' => $credentials['refresh_token'],
                    ];
                } else {
                    throw new \RuntimeException('Access token expired and no refresh token provided. Please re-authenticate with Google Drive.');
                }
            }

            // Test connection by accessing Drive API
            $driveService = new Drive($client);
            
            // Verify folder exists if folder_id is provided
            if (!empty($credentials['folder_id'])) {
                $driveService->files->get($credentials['folder_id']);
            } else {
                // Just list files to verify access
                $driveService->files->listFiles(['pageSize' => 1]);
            }

            return true;
        } catch (\Google\Service\Exception $e) {
            throw new \RuntimeException('Google Drive API error: ' . $e->getMessage());
        } catch (\Exception $e) {
            throw new \RuntimeException('Google Drive connection failed: ' . $e->getMessage());
        }
    }

    /**
     * Get refreshed credentials if token was refreshed during validation
     */
    public function getRefreshedCredentials(): array
    {
        return $this->refreshedCredentials;
    }
}
