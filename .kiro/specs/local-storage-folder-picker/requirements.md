# Requirements Document

## Introduction

This feature adds a folder picker UI for local storage connections, mirroring the existing Google Drive folder picker functionality. Users will be able to browse server directories, select folders, and create new folders directly from the connection form instead of manually typing paths.

## Glossary

- **Local_Storage_System**: The Laravel-based local storage connection type that stores backups on the server filesystem
- **Storage_Disk**: A Laravel filesystem disk configuration (local or public)
- **Folder_Picker_Modal**: The dialog component that displays the folder tree and allows selection
- **Base_Path**: The root directory for a storage disk (e.g., storage/app for local disk)

## Requirements

### Requirement 1: Folder Listing

**User Story:** As a user, I want to browse folders within the selected storage disk, so that I can visually select where to store backups.

#### Acceptance Criteria

1. WHEN the user opens the folder picker modal, THE Local_Storage_System SHALL display all directories within the selected storage disk's base path.
2. WHEN the user clicks on a folder with subdirectories, THE Local_Storage_System SHALL load and display the child directories.
3. WHILE loading folder contents, THE Local_Storage_System SHALL display a loading indicator.
4. THE Local_Storage_System SHALL display folders in alphabetical order.
5. THE Local_Storage_System SHALL indicate whether each folder has child directories.

### Requirement 2: Folder Selection

**User Story:** As a user, I want to select a folder from the picker, so that the path is automatically populated in the form.

#### Acceptance Criteria

1. WHEN the user clicks on a folder in the tree, THE Local_Storage_System SHALL highlight the selected folder.
2. WHEN the user confirms selection, THE Local_Storage_System SHALL populate the path field with the relative path from the disk root.
3. WHEN the user selects the root option, THE Local_Storage_System SHALL set the path to an empty string or default value.
4. THE Local_Storage_System SHALL display the full path of the currently selected folder.

### Requirement 3: Folder Creation

**User Story:** As a user, I want to create new folders from the picker, so that I can organize my backup storage without leaving the form.

#### Acceptance Criteria

1. WHEN the user clicks "New Folder", THE Local_Storage_System SHALL display a dialog to enter the folder name.
2. WHEN the user submits a valid folder name, THE Local_Storage_System SHALL create the folder within the currently selected directory.
3. IF the folder name contains invalid characters, THEN THE Local_Storage_System SHALL display a validation error.
4. IF the folder already exists, THEN THE Local_Storage_System SHALL display an error message.
5. WHEN folder creation succeeds, THE Local_Storage_System SHALL add the new folder to the tree and select it.

### Requirement 4: Disk Selection Integration

**User Story:** As a user, I want the folder picker to respect my disk selection, so that I browse the correct storage location.

#### Acceptance Criteria

1. WHEN the user changes the storage disk dropdown, THE Local_Storage_System SHALL reset the folder picker state.
2. WHEN the folder picker opens, THE Local_Storage_System SHALL use the currently selected disk for browsing.
3. THE Local_Storage_System SHALL display the disk's base path in the modal header for clarity.

### Requirement 5: Security Constraints

**User Story:** As an administrator, I want folder browsing restricted to safe directories, so that users cannot access sensitive system files.

#### Acceptance Criteria

1. THE Local_Storage_System SHALL restrict browsing to within the configured storage disk's root directory.
2. IF a path traversal attempt is detected, THEN THE Local_Storage_System SHALL reject the request with an error.
3. THE Local_Storage_System SHALL validate all folder names against a whitelist of allowed characters.
4. THE Local_Storage_System SHALL not expose absolute server paths to the frontend.

### Requirement 6: Error Handling

**User Story:** As a user, I want clear error messages when folder operations fail, so that I can understand and resolve issues.

#### Acceptance Criteria

1. IF the storage disk is not accessible, THEN THE Local_Storage_System SHALL display an appropriate error message.
2. IF folder creation fails due to permissions, THEN THE Local_Storage_System SHALL inform the user of the permission issue.
3. WHEN an error occurs, THE Local_Storage_System SHALL provide a retry option where applicable.
