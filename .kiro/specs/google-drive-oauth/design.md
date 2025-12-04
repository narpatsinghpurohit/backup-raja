# Design Document: Google Drive OAuth Integration

## Overview

This design implements OAuth 2.0 authentication for Google Drive connections, replacing manual token entry with a seamless "Connect Google Drive" button flow. Users authenticate through Google's permission dialog, and the system automatically handles token exchange and storage.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Flow                                │
├─────────────────────────────────────────────────────────────┤
│  1. User clicks "Connect Google Drive"                      │
│  2. Redirect to Google OAuth (with state parameter)         │
│  3. User grants permission                                   │
│  4. Google redirects to callback with auth code              │
│  5. Backend exchanges code for tokens                        │
│  6. Redirect to form with tokens (in session)                │
│  7. User enters name & folder, submits                       │
│  8. Connection saved with encrypted tokens                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     Backend (Laravel)                        │
├─────────────────────────────────────────────────────────────┤
│  GoogleOAuthController                                       │
│  - redirect() - Initiates OAuth flow                         │
│  - callback() - Handles OAuth callback                       │
│                                                              │
│  GoogleOAuthService                                          │
│  - getAuthorizationUrl() - Generates OAuth URL               │
│  - exchangeCode() - Exchanges code for tokens                │
│  - validateState() - CSRF protection                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│  GoogleDriveOAuthButton - "Connect Google Drive" button     │
│  GoogleDriveManualForm - Fallback manual token entry        │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Environment Configuration

Add to `.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
GOOGLE_REDIRECT_URI="${APP_URL}/oauth/google/callback"
```

### Backend Routes

```php
// routes/web.php

Route::middleware(['auth'])->group(function () {
    // Initiate OAuth flow
    Route::get('/oauth/google/redirect', [GoogleOAuthController::class, 'redirect'])
        ->name('oauth.google.redirect');
    
    // OAuth callback
    Route::get('/oauth/google/callback', [GoogleOAuthController::class, 'callback'])
        ->name('oauth.google.callback');
});
```

### GoogleOAuthService

```php
// app/Services/GoogleOAuthService.php

class GoogleOAuthService
{
    private GoogleClient $client;

    public function __construct()
    {
        $this->client = new GoogleClient();
        $this->client->setClientId(config('services.google.client_id'));
        $this->client->setClientSecret(config('services.google.client_secret'));
        $this->client->setRedirectUri(config('services.google.redirect_uri'));
        $this->client->addScope(Drive::DRIVE_FILE);
        $this->client->setAccessType('offline');
        $this->client->setPrompt('consent');
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
            throw new \Exception('OAuth error: ' . $token['error']);
        }

        return [
            'access_token' => $token['access_token'],
            'refresh_token' => $token['refresh_token'] ?? null,
            'expires_in' => $token['expires_in'],
        ];
    }

    public function getUserEmail(string $accessToken): string
    {
        $this->client->setAccessToken($accessToken);
        $oauth2 = new \Google\Service\Oauth2($this->client);
        $userInfo = $oauth2->userinfo->get();
        return $userInfo->email;
    }
}
```

### Goog
leOAuthController

```php
// app/Http/Controllers/GoogleOAuthController.php

class GoogleOAuthController extends Controller
{
    public function __construct(
        private GoogleOAuthService $oauthService
    ) {}

    public function redirect(Request $request)
    {
        // Generate random state for CSRF protection
        $state = Str::random(40);
        session(['google_oauth_state' => $state]);

        // Get authorization URL
        $authUrl = $this->oauthService->getAuthorizationUrl($state);

        return redirect($authUrl);
    }

    public function callback(Request $request)
    {
        // Validate state parameter
        $state = $request->query('state');
        if ($state !== session('google_oauth_state')) {
            return redirect()->route('connections.create')
                ->withErrors(['error' => 'Invalid OAuth state. Please try again.']);
        }

        // Check for errors
        if ($request->has('error')) {
            return redirect()->route('connections.create')
                ->withErrors(['error' => 'OAuth authorization denied.']);
        }

        try {
            // Exchange code for tokens
            $code = $request->query('code');
            $tokens = $this->oauthService->exchangeCodeForTokens($code);

            // Get user email for connection name
            $email = $this->oauthService->getUserEmail($tokens['access_token']);

            // Store tokens in session temporarily
            session([
                'google_oauth_tokens' => $tokens,
                'google_oauth_email' => $email,
            ]);

            // Redirect to connection form
            return redirect()->route('connections.create.google-drive');
        } catch (\Exception $e) {
            return redirect()->route('connections.create')
                ->withErrors(['error' => 'Failed to connect: ' . $e->getMessage()]);
        }
    }
}
```

### Connection Creation Flow

New route for Google Drive connection form after OAuth:

```php
// routes/web.php
Route::get('/connections/create/google-drive', [ConnectionController::class, 'createGoogleDrive'])
    ->name('connections.create.google-drive');
```

```php
// app/Http/Controllers/ConnectionController.php

public function createGoogleDrive()
{
    // Check if OAuth tokens are in session
    if (!session()->has('google_oauth_tokens')) {
        return redirect()->route('connections.create')
            ->withErrors(['error' => 'No OAuth tokens found. Please connect again.']);
    }

    $tokens = session('google_oauth_tokens');
    $email = session('google_oauth_email');

    return Inertia::render('Connections/CreateGoogleDrive', [
        'suggestedName' => "Google Drive - {$email}",
        'hasTokens' => true,
    ]);
}
```

## UI Design

### Google Drive OAuth Button

When user selects Google Drive in the technology grid:

```
┌─────────────────────────────────────────────────────────┐
│  📁 Google Drive Connection                             │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  🔐 Connect with Google                           │ │
│  │                                                   │ │
│  │  Click below to authorize Backup Raja to access  │ │
│  │  your Google Drive. You'll be redirected to      │ │
│  │  Google to grant permission.                      │ │
│  │                                                   │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │  🔗 Connect Google Drive                    │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  │                                                   │ │
│  │  Or use manual setup if OAuth doesn't work       │ │
│  │  [Manual Setup]                                   │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### After OAuth Success

```
┌─────────────────────────────────────────────────────────┐
│  ✅ Google Drive Connected                              │
│                                                         │
│  Connection Name                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │ Google Drive - user@gmail.com                  │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  Folder ID (Optional)                                   │
│  ┌────────────────────────────────────────────────┐    │
│  │                                                │    │
│  └────────────────────────────────────────────────┘    │
│  💡 Leave empty to use root folder                     │
│                                                         │
│  [Create Connection]  [Cancel]                          │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

1. **User clicks "Connect Google Drive"**
   - Frontend: `<Link href="/oauth/google/redirect">`
   - Backend: Generates state, stores in session
   - Redirects to Google OAuth URL

2. **User grants permission on Google**
   - Google redirects to `/oauth/google/callback?code=...&state=...`

3. **Backend handles callback**
   - Validates state
   - Exchanges code for tokens
   - Gets user email
   - Stores tokens in session
   - Redirects to `/connections/create/google-drive`

4. **User fills connection form**
   - Name pre-filled with "Google Drive - email"
   - Optional folder ID
   - Submits form

5. **Backend creates connection**
   - Retrieves tokens from session
   - Creates connection with encrypted tokens
   - Clears session data
   - Redirects to connections index

## Security Considerations

- **State Parameter**: Prevents CSRF attacks
- **Session Storage**: Tokens temporarily in session, not URL
- **Encrypted Storage**: Tokens encrypted in database
- **HTTPS Required**: OAuth requires HTTPS in production
- **Scope Limitation**: Only request `drive.file` scope (not full drive access)

## Error Handling

| Scenario | Handling |
|----------|----------|
| OAuth credentials not configured | Show error with setup instructions |
| User denies permission | Redirect with "Authorization denied" message |
| Invalid state parameter | Redirect with "Invalid state" error |
| Token exchange fails | Show error, allow retry |
| Session expired | Redirect to start OAuth flow again |

## Testing Strategy

- Test OAuth flow end-to-end
- Test state validation (CSRF protection)
- Test error scenarios (denied permission, invalid code)
- Test session expiration handling
- Test manual fallback mode
