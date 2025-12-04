<?php

namespace App\Http\Controllers;

use App\Services\GoogleOAuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GoogleOAuthController extends Controller
{
    public function __construct(
        private GoogleOAuthService $oauthService
    ) {}

    public function redirect()
    {
        // Check if OAuth is configured
        if (!$this->oauthService->isConfigured()) {
            return redirect()->route('connections.create')
                ->withErrors(['error' => 'Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.']);
        }

        // Generate random state for CSRF protection
        $state = Str::random(40);
        session(['google_oauth_state' => $state]);

        // Get authorization URL and redirect
        $authUrl = $this->oauthService->getAuthorizationUrl($state);

        return redirect($authUrl);
    }

    public function callback(Request $request)
    {
        // Check for errors from Google
        if ($request->has('error')) {
            $error = $request->query('error');
            $message = $error === 'access_denied'
                ? 'You denied access to Google Drive. Please try again if you want to connect.'
                : 'OAuth authorization failed: ' . $error;

            return redirect()->route('connections.create')
                ->withErrors(['error' => $message]);
        }

        // Validate state parameter (CSRF protection)
        $state = $request->query('state');
        if ($state !== session('google_oauth_state')) {
            return redirect()->route('connections.create')
                ->withErrors(['error' => 'Invalid OAuth state. Please try again.']);
        }

        // Clear the state from session
        session()->forget('google_oauth_state');

        try {
            // Exchange authorization code for tokens
            $code = $request->query('code');
            $tokens = $this->oauthService->exchangeCodeForTokens($code);

            // Get user email for connection name suggestion
            $email = $this->oauthService->getUserEmail($tokens['access_token']);

            // Store tokens in session temporarily
            session([
                'google_oauth_tokens' => $tokens,
                'google_oauth_email' => $email,
            ]);
            
            // Force session save
            session()->save();

            // Redirect to Google Drive connection form
            return redirect()->route('connections.create.google-drive');
        } catch (\Exception $e) {
            return redirect()->route('connections.create')
                ->withErrors(['error' => 'Failed to connect to Google Drive: ' . $e->getMessage()]);
        }
    }
}
