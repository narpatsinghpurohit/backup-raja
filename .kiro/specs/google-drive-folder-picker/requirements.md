# Requirements Document

## Introduction

This feature enables users to browse and select Google Drive folders through an interactive UI picker when creating or editing Google Drive connections. Instead of manually typing folder paths, users can authenticate with Google Drive and visually navigate their folder structure to select the destination folder for backups.

## Glossary

- **Folder Picker**: A UI component that displays the user's Google Drive folder hierarchy and allows folder selection
- **Google Drive API**: Google's REST API for accessing Drive files and folders
- **OAuth Token**: The authentication token obtained during Google Drive OAuth flow
- **Folder Path**: The hierarchical path to a folder in Google Drive (e.g., "/Backups/Database")
- **Folder ID**: Google Drive's unique identifier for a folder
- **Connection Form**: The UI form for creating or editing Google Drive destination connections
- **Drive Service**: Backend service that interacts with Google Drive API

## Requirements

### Requirement 1

**User Story:** As a user creating a Google Drive connection, I want to browse my Google Drive folders in a visual picker, so that I can easily select the correct destination folder without typing paths manually.

#### Acceptance Criteria

1. WHEN the user clicks a "Browse Folders" button on the Google Drive connection form, THE Folder Picker SHALL display the user's root Google Drive folders
2. WHILE the Folder Picker is open, THE Folder Picker SHALL allow the user to expand and navigate through nested folders
3. WHEN the user selects a folder in the Folder Picker, THE Connection Form SHALL populate the folder path field with the selected folder's path
4. IF the user has not completed OAuth authentication, THEN THE Folder Picker SHALL prompt the user to authenticate before displaying folders
5. WHEN the Folder Picker loads folders, THE Folder Picker SHALL display a loading indicator during the API request

### Requirement 2

**User Story:** As a user, I want to see folder names and hierarchy clearly in the picker, so that I can confidently identify the correct backup destination.

#### Acceptance Criteria

1. THE Folder Picker SHALL display folder names with appropriate indentation to show hierarchy levels
2. THE Folder Picker SHALL display folder icons to distinguish folders from other content
3. WHEN a folder contains subfolders, THE Folder Picker SHALL display an expand/collapse indicator next to the folder name
4. THE Folder Picker SHALL display the full path of the currently selected folder
5. WHILE browsing folders, THE Folder Picker SHALL maintain the expanded/collapsed state of folders during navigation

### Requirement 3

**User Story:** As a user, I want the folder picker to handle errors gracefully, so that I understand what went wrong and can take corrective action.

#### Acceptance Criteria

1. IF the Google Drive API request fails, THEN THE Folder Picker SHALL display an error message explaining the failure
2. IF the OAuth token is expired or invalid, THEN THE Folder Picker SHALL prompt the user to re-authenticate
3. IF the user has no folders in their Google Drive, THEN THE Folder Picker SHALL display a message indicating no folders are available
4. WHEN an error occurs, THE Folder Picker SHALL provide a retry option to attempt loading folders again
5. THE Folder Picker SHALL log API errors for debugging purposes

### Requirement 4

**User Story:** As a user, I want to search for folders by name in the picker, so that I can quickly find specific folders in large Drive accounts.

#### Acceptance Criteria

1. THE Folder Picker SHALL provide a search input field at the top of the picker interface
2. WHEN the user types in the search field, THE Folder Picker SHALL filter displayed folders to match the search query
3. THE Folder Picker SHALL perform case-insensitive search matching on folder names
4. WHEN search results are displayed, THE Folder Picker SHALL show the full path context for each matching folder
5. WHEN the user clears the search field, THE Folder Picker SHALL restore the full folder hierarchy view

### Requirement 5

**User Story:** As a user editing an existing Google Drive connection, I want the folder picker to highlight my currently selected folder, so that I can see my current selection and easily change it if needed.

#### Acceptance Criteria

1. WHEN the Folder Picker opens on an edit form with an existing folder path, THE Folder Picker SHALL expand the folder tree to show the current folder
2. THE Folder Picker SHALL visually highlight the currently selected folder with a distinct background color or border
3. WHEN the user selects a different folder, THE Folder Picker SHALL update the highlight to the newly selected folder
4. IF the current folder path no longer exists in Google Drive, THEN THE Folder Picker SHALL display a warning message
5. THE Folder Picker SHALL allow the user to select a different folder even if the current folder is invalid

### Requirement 6

**User Story:** As a user, I want to create new folders directly from the picker, so that I can organize my backups without leaving the connection setup flow.

#### Acceptance Criteria

1. THE Folder Picker SHALL provide a "Create New Folder" button within the picker interface
2. WHEN the user clicks "Create New Folder", THE Folder Picker SHALL display a dialog prompting for the new folder name
3. WHEN the user confirms folder creation, THE Drive Service SHALL create the folder in Google Drive at the current navigation location
4. WHEN folder creation succeeds, THE Folder Picker SHALL refresh the folder list and automatically select the newly created folder
5. IF folder creation fails, THEN THE Folder Picker SHALL display an error message and allow the user to retry with a different name
