# Requirements Document

## Introduction

This document defines the requirements for implementing OAuth 2.0 authentication for Google Drive connections in Backup Raja. Instead of manually entering access tokens and refresh tokens, users will authenticate through Google's OAuth flow with a "Connect Google Drive" button, providing a seamless and secure connection experience.

## Glossary

- **OAuth 2.0**: Industry-standard protocol for authorization
- **OAuth Flow**: The process of redirecting users to Google for permission, then receiving tokens
- **Authorization Code**: Temporary code returned by Google after user grants permission
- **Access Token**: Short-lived token (1 hour) used to access Google Drive API
- **Refresh Token**: Long-lived token used to obtain new access tokens
- **OAuth Callback**: The URL where Google redirects users after authorization
- **OAuth State**: Random string to prevent CSRF attacks during OAuth flow

## Requirements

### Requirement 1: OAuth Initiation

**User Story:** As a user, I want to click a "Connect Google Drive" button instead of manually entering tokens, so that I can easily authorize access to my Google Drive.

#### Acceptance Criteria

1. WHEN the user selects Google Drive as a destination, THE System SHALL display a "Connect Google Drive" button instead of token input fields.
2. WHEN the user clicks the button, THE System SHALL redirect to Google's OAuth authorization page.
3. THE System SHALL request offline access to ensure a refresh token is provided.
4. THE System SHALL request only the minimum required scope (drive.file).
5. THE System SHALL include a state parameter to prevent CSRF attacks.

### Requirement 2: OAuth Callback Handling

**User Story:** As a user, I want the system to automatically save my Google Drive credentials after I grant permission, so that I don't have to manually copy tokens.

#### Acceptance Criteria

1. WHEN Google redirects back after authorization, THE System SHALL validate the state parameter.
2. THE System SHALL exchange the authorization code for access and refresh tokens.
3. THE System SHALL store both tokens securely in encrypted format.
4. WHEN token exchange fails, THE System SHALL display an error message and allow retry.
5. WHEN token exchange succeeds, THE System SHALL redirect to the connection form with tokens pre-filled.

### Requirement 3: Connection Name and Folder Selection

**User Story:** As a user, I want to name my connection and optionally select a specific Google Drive folder after OAuth, so that I can organize my backups.

#### Acceptance Criteria

1. AFTER successful OAuth, THE System SHALL display a form with connection name and optional folder ID fields.
2. THE System SHALL pre-fill the connection name with "Google Drive - [user's email]".
3. THE System SHALL allow the user to modify the connection name.
4. THE System SHALL allow the user to optionally specify a folder ID.
5. WHEN the user submits, THE System SHALL create the connection with the OAuth tokens.

### Requirement 4: OAuth Configuration

**User Story:** As an administrator, I want to configure Google OAuth credentials in environment variables, so that the OAuth flow works without hardcoding credentials.

#### Acceptance Criteria

1. THE System SHALL read Google OAuth Client ID from environment variable GOOGLE_CLIENT_ID.
2. THE System SHALL read Google OAuth Client Secret from environment variable GOOGLE_CLIENT_SECRET.
3. WHEN OAuth credentials are not configured, THE System SHALL display a helpful error message.
4. THE System SHALL use the application URL to construct the OAuth redirect URI.

### Requirement 5: Manual Token Entry Fallback

**User Story:** As a user, I want the option to manually enter tokens if OAuth doesn't work, so that I have a backup method to connect.

#### Acceptance Criteria

1. THE System SHALL provide a "Manual Setup" link on the Google Drive connection page.
2. WHEN the user clicks manual setup, THE System SHALL show the original token input fields.
3. THE System SHALL allow switching between OAuth and manual modes.
4. THE System SHALL validate manually entered tokens before saving.
