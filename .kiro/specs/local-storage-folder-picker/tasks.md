# Implementation Plan

- [x] 1. Create backend service and controller
  - [x] 1.1 Create LocalStorageService with folder operations
    - Create `app/Services/LocalStorageService.php`
    - Implement `listFolders(string $disk, string $path)` method
    - Implement `createFolder(string $disk, string $parentPath, string $name)` method
    - Add path sanitization to prevent traversal attacks
    - Add folder name validation (alphanumeric, spaces, underscores, hyphens, dots)
    - _Requirements: 1.1, 1.4, 1.5, 3.2, 5.1, 5.2, 5.3_

  - [x] 1.2 Create LocalStorageFolderController
    - Create `app/Http/Controllers/LocalStorageFolderController.php`
    - Implement `index()` method for listing folders with disk/path query params
    - Implement `store()` method for creating folders with validation
    - Add request validation for disk (in:local,public), path, and name
    - _Requirements: 1.1, 3.1, 3.3, 3.4, 4.2, 6.1, 6.2_

  - [x] 1.3 Add API routes
    - Add routes to `routes/web.php` under auth middleware
    - GET `/api/local-storage/folders` for listing
    - POST `/api/local-storage/folders` for creating
    - _Requirements: 1.1, 3.1_

- [x] 2. Create frontend types and API service
  - [x] 2.1 Create LocalStorageFolder type definitions
    - Create `resources/js/types/local-storage.ts`
    - Define LocalStorageFolder interface with id, name, path, parentPath, hasChildren
    - Define FolderListResponse and FolderResponse interfaces
    - _Requirements: 1.1, 2.2_

  - [x] 2.2 Create local storage API service
    - Create `resources/js/services/local-storage-api.ts`
    - Implement `listFolders(disk, path?)` function
    - Implement `createFolder(disk, name, parentPath?)` function
    - Add CSRF token handling for POST requests
    - _Requirements: 1.1, 3.1, 3.2_

- [x] 3. Create folder picker components
  - [x] 3.1 Create LocalStorageFolderPickerButton component
    - Create `resources/js/components/connections/LocalStorageFolderPickerButton.tsx`
    - Accept disk, onFolderSelect, currentPath, disabled props
    - Render Browse button that opens modal
    - _Requirements: 2.1, 4.2_

  - [x] 3.2 Create LocalStorageFolderPickerModal component
    - Create `resources/js/components/connections/LocalStorageFolderPickerModal.tsx`
    - Display disk base path in header (storage/app or storage/app/public)
    - Implement folder loading with FolderTreeSkeleton
    - Implement folder expansion with lazy loading of children
    - Add Root button to select disk root
    - Add New Folder button that opens CreateFolderDialog
    - Add Refresh button to reload folders
    - Show selected folder path
    - Reuse FolderTree component with adapter functions
    - Reuse CreateFolderDialog component
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.5, 6.3_

- [x] 4. Integrate folder picker into connection forms
  - [x] 4.1 Update CredentialForm for local_storage type
    - Modify `resources/js/components/connections/CredentialForm.tsx`
    - Add LocalStorageFolderPickerButton next to path input
    - Pass current disk value to folder picker
    - Handle folder selection to update path field
    - Show selected folder path confirmation
    - _Requirements: 2.2, 2.3, 4.1, 4.2_

  - [x] 4.2 Update Edit.tsx for local_storage connections
    - Modify `resources/js/pages/Connections/Edit.tsx`
    - Add LocalStorageFolderPickerButton to local_storage section
    - Handle folder selection to update path credential
    - Track path changes for form submission
    - _Requirements: 2.2, 4.1, 4.2_

- [ ]* 5. Add tests
  - [ ]* 5.1 Write unit tests for LocalStorageService
    - Test path sanitization rejects traversal attempts
    - Test folder name validation
    - Test listFolders returns correct structure
    - Test createFolder creates directory
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 5.2 Write feature tests for LocalStorageFolderController
    - Test index endpoint returns folders
    - Test store endpoint creates folder
    - Test validation rejects invalid disk
    - Test validation rejects path traversal
    - _Requirements: 1.1, 3.1, 5.1, 5.2, 6.1, 6.2_
