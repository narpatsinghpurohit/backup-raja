# Implementation Plan

- [x] 1. Create backend Google Drive service for folder operations
  - Create `app/Services/GoogleDriveService.php` with methods for listing folders, creating folders, getting folder paths, and searching folders
  - Implement token refresh logic to handle expired access tokens
  - Add error handling for Google Drive API failures
  - _Requirements: 1.1, 1.5, 3.1, 3.2, 3.4_

- [x] 2. Create API controller for Google Drive folder operations
  - Create `app/Http/Controllers/GoogleDriveFolderController.php` with index, store, show, and search methods
  - Implement session-based OAuth token retrieval
  - Add request validation for folder names and IDs
  - Return properly formatted JSON responses with folder data
  - _Requirements: 1.1, 3.1, 3.2, 6.3_

- [x] 3. Add API routes for folder operations
  - Add routes in `routes/web.php` for listing, creating, searching, and getting folder details
  - Apply auth middleware to protect endpoints
  - Group routes under `/api/google-drive/folders` prefix
  - _Requirements: 1.1, 6.1_

- [x] 4. Create folder data type and API service in frontend
  - Create TypeScript interface for `GoogleDriveFolder` in `resources/js/types/google-drive.ts`
  - Create API service file `resources/js/services/google-drive-api.ts` with methods for all folder operations
  - Implement error handling and response parsing
  - _Requirements: 1.1, 1.5, 3.1_

- [x] 5. Build FolderTree component for hierarchical folder display
  - Create `resources/js/components/connections/FolderTree.tsx` component
  - Implement expand/collapse functionality with lazy loading of subfolders
  - Add visual indentation for folder hierarchy
  - Implement folder selection with highlighting
  - Show current folder with distinct styling
  - Display folder icons and expand/collapse indicators
  - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 2.5, 5.1, 5.2, 5.3_

- [x] 6. Build FolderSearchBar component
  - Create `resources/js/components/connections/FolderSearchBar.tsx` component
  - Implement search input with debouncing (300ms delay)
  - Add loading indicator during search
  - Handle search query submission to API
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Build CreateFolderDialog component
  - Create `resources/js/components/connections/CreateFolderDialog.tsx` component
  - Implement folder name input with validation
  - Add create button that calls API
  - Handle success and error states
  - Display parent folder context
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8. Build FolderPickerModal component
  - Create `resources/js/components/connections/FolderPickerModal.tsx` component
  - Implement modal open/close state management
  - Integrate FolderTree, FolderSearchBar, and CreateFolderDialog components
  - Fetch root folders on modal open
  - Handle folder selection confirmation
  - Display selected folder path
  - Add loading and error states
  - _Requirements: 1.1, 1.2, 1.5, 3.1, 3.3, 4.4, 5.4_

- [x] 9. Build FolderPickerButton component
  - Create `resources/js/components/connections/FolderPickerButton.tsx` component
  - Implement button that opens FolderPickerModal
  - Check for OAuth tokens before opening picker
  - Handle OAuth redirect if tokens missing
  - Pass folder selection callback to modal
  - _Requirements: 1.1, 1.4_

- [x] 10. Integrate folder picker into CreateGoogleDrive page
  - Update `resources/js/pages/Connections/CreateGoogleDrive.tsx` to include FolderPickerButton
  - Add state for selected folder path display
  - Update form to populate folder_id from picker selection
  - Display selected folder path below input field
  - Keep manual input option available
  - _Requirements: 1.3, 5.1, 5.2_

- [x] 11. Integrate folder picker into Edit page for Google Drive connections
  - Update `resources/js/pages/Connections/Edit.tsx` to show folder picker for Google Drive type
  - Pass current folder_id to picker for highlighting
  - Handle folder selection to update form
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 12. Add error handling and edge cases
  - Implement handling for expired OAuth tokens with re-authentication prompt
  - Add handling for empty folder lists with helpful message
  - Implement retry logic for failed API requests
  - Add handling for invalid folder IDs
  - Display user-friendly error messages for all error scenarios
  - _Requirements: 1.4, 3.1, 3.2, 3.3, 3.4, 5.4_

- [ ] 13. Add loading states and user feedback
  - Add skeleton loaders for folder tree during initial load
  - Show loading spinners during folder expansion
  - Display progress indicators during folder creation
  - Add success notifications for folder creation
  - _Requirements: 1.5_
