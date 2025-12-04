# Implementation Plan

- [ ] 1. Add Google OAuth configuration
  - [ ] 1.1 Add Google OAuth config to services.php
    - Add google configuration array in `config/services.php`
    - Include client_id, client_secret, and redirect_uri from env variables
    - _Requirements: 4.1, 4.2, 4.4_

  - [ ] 1.2 Update .env.example with Google OAuth variables
    - Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET placeholders
    - Add documentation comments explaining how to get credentials
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 2. Create OAuth service and controller
  - [ ] 2.1 Create GoogleOAuthService
    - Create `app/Services/GoogleOAuthService.php`
    - Implement getAuthorizationUrl() method with state parameter
    - Implement exchangeCodeForTokens() method
    - Implement getUserEmail() method to fetch user's email
    - Configure Google Client with offline access and consent prompt
    - _Requirements: 1.2, 1.3, 1.4, 2.1, 2.2_

  - [ ] 2.2 Create GoogleOAuthController
    - Create `app/Http/Controllers/GoogleOAuthController.php`
    - Implement redirect() method to initiate OAuth flow
    - Implement callback() method to handle OAuth response
    - Add state validation for CSRF protection
    - Store tokens temporarily in session after successful exchange
    - _Requirements: 1.1, 2.1, 2.3, 2.4_

  - [ ] 2.3 Add OAuth routes
    - Add GET /oauth/google/redirect route
    - Add GET /oauth/google/callback route
    - Protect routes with auth middleware
    - _Requirements: 1.1, 2.1_

- [ ] 3. Update connection creation flow
  - [ ] 3.1 Add Google Drive specific creation route and method
    - Add GET /connections/create/google-drive route
    - Add createGoogleDrive() method to ConnectionController
    - Check for OAuth tokens in session
    - Pass suggested name and token status to frontend
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 3.2 Update connection store method to handle OAuth tokens
    - Modify store() method to check for tokens in session
    - Retrieve and use session tokens if available
    - Clear session tokens after successful creation
    - _Requirements: 2.3, 3.5_

- [ ] 4. Create frontend OAuth components
  - [ ] 4.1 Create GoogleDriveOAuthButton component
    - Create `resources/js/components/connections/GoogleDriveOAuthButton.tsx`
    - Display "Connect Google Drive" button with icon
    - Show explanation text about OAuth flow
    - Link to /oauth/google/redirect
    - Include "Manual Setup" fallback link
    - _Requirements: 1.1, 5.1, 5.2_

  - [ ] 4.2 Create CreateGoogleDrive page
    - Create `resources/js/pages/Connections/CreateGoogleDrive.tsx`
    - Show success message "Google Drive Connected"
    - Display connection name input (pre-filled with "Google Drive - email")
    - Display optional folder ID input
    - Handle form submission to existing store endpoint
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 4.3 Update CredentialForm to show OAuth button for Google Drive
    - Modify CredentialForm to detect Google Drive type
    - Show GoogleDriveOAuthButton instead of manual fields by default
    - Add toggle to switch to manual mode
    - _Requirements: 1.1, 5.1, 5.2, 5.3_

- [ ] 5. Add error handling and validation
  - [ ] 5.1 Add OAuth error handling
    - Handle user denial (error parameter in callback)
    - Handle invalid state (CSRF protection)
    - Handle token exchange failures
    - Display user-friendly error messages
    - _Requirements: 2.4, 4.3_

  - [ ] 5.2 Add session expiration handling
    - Check for expired session tokens
    - Redirect to OAuth flow if tokens missing
    - Clear stale session data
    - _Requirements: 2.3_

- [ ] 6. Testing and documentation
  - [ ] 6.1 Test OAuth flow end-to-end
    - Test successful OAuth authorization
    - Test connection creation after OAuth
    - Test manual fallback mode
    - Verify tokens are encrypted in database
    - _Requirements: 1.1, 2.1, 2.2, 3.5_

  - [ ] 6.2 Test error scenarios
    - Test user denying permission
    - Test invalid state parameter
    - Test session expiration
    - Test missing OAuth configuration
    - _Requirements: 2.4, 4.3, 5.4_
