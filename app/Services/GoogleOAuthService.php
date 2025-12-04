<?php

namespace App\Services;

use Google\Client as GoogleClient;
use Google\Service\Drive;
use Google\Service\Oauth2;

class GoogleOAuthService
{
    private GoogleClient $client;

    public function __construct()
    {
        $this->client = new GoogleClient();
        $this->client->setClientId(config('services.google.client_id'));
        $this->client->setClientSecret(config('services.google.client_secret'));
        $this->client->setRedirectUri(config('services.google.redirect_uri'));
        // DRIVE scope allows full access to browse and manage files/folders
        // DRIVE_FILE only allows access to files created by the app
        $this->client->addScope(Drive::DRIVE);
        $this->client->addScope('email');
        $this->client->setAccessType('offline');
        $this->client->setPrompt('consent');
    }

    public function isConfigured(): bool
    {
        return !empty(config('services.google.client_id'))
            && !empty(config('services.google.client_secret'));
    }

    public function getAuthorizationUrl(string $state): string
    {
        $this->client->setState($state);

        return $this->client->createAuthUrl();
    }

    public function exchangeCodeForTokens(string $code): array
    {
        $token = $this->client->fetchAccessTokenWithAuthCode($code);

        if (isset($token['error'])) {
            throw new \Exception('OAuth error: ' . ($token['error_description'] ?? $token['error']));
        }

        return [
            'access_token' => $token['access_token'],
            'refresh_token' => $token['refresh_token'] ?? null,
            'expires_in' => $token['expires_in'] ?? 3600,
        ];
    }

    public function getUserEmail(string $accessToken): string
    {
        $this->client->setAccessToken($accessToken);
        $oauth2 = new Oauth2($this->client);
        $userInfo = $oauth2->userinfo->get();

        return $userInfo->email;
    }
}
