# Design Document: Google Drive Folder Picker

## Overview

This feature adds an interactive folder picker UI component that allows users to browse, search, and select Google Drive folders when creating or editing Google Drive connections. The picker integrates with the existing Google OAuth flow and uses the Google Drive API to fetch and display the user's folder hierarchy.

## Architecture

### High-Level Flow

```
User clicks "Browse Folders" 
  → Frontend checks for OAuth tokens in session
  → If no tokens: Redirect to OAuth flow
  → If tokens exist: Fetch folders from backend API
  → Display folder tree in modal/dialog
  → User navigates/searches folders
  → User selects folder
  → Folder ID and path populate form fields
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│  FolderPickerButton                                          │
│  - Triggers folder picker modal                              │
│  - Handles OAuth check                                       │
│                                                               │
│  FolderPickerModal                                           │
│  - Modal/dialog container                                    │
│  - Manages picker state (open/closed)                        │
│                                                               │
│  FolderTree                                                  │
│  - Displays hierarchical folder structure                    │
│  - Handles expand/collapse                                   │
│  - Manages selection state                                   │
│                                                               │
│  FolderSearchBar                                             │
│  - Search input with debouncing                              │
│  - Filters folder tree                                       │
│                                                               │
│  CreateFolderDialog                                          │
│  - Dialog for creating new folders                           │
│  - Validates folder name                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     Backend (Laravel)                        │
├─────────────────────────────────────────────────────────────┤
│  GoogleDriveFolderController                                 │
│  - index() - List folders (with optional parent)             │
│  - store() - Create new folder                               │
│  - show() - Get folder details                               │
│                                                               │
│  GoogleDriveService                                          │
│  - listFolders($parentId = null, $accessToken)               │
│  - createFolder($name, $parentId, $accessToken)              │
│  - getFolderPath($folderId, $accessToken)                    │
│  - searchFolders($query, $accessToken)                       │
│  - refreshTokenIfExpired($credentials)                       │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Frontend Components

#### 1. FolderPickerButton Component

**Location:** `resources/js/components/connections/FolderPickerButton.tsx`

**Props:**
```typescript
interface FolderPickerButtonProps {
  onFolderSelect: (folder: GoogleDriveFolder) => void;
  currentFolderId?: string;
  disabled?: boolean;
}
```

**Responsibilities:**
- Render "Browse Folders" button
- Check if OAuth tokens exist in session
- Open folder picker modal
- Handle OAuth redirect if needed

#### 2. FolderPickerModal Component

**Location:** `resources/js/components/connections/FolderPickerModal.tsx`

**Props:**
```typescript
interface FolderPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (folder: GoogleDriveFolder) => void;
  currentFolderId?: string;
}
```

**State:**
```typescript
interface FolderPickerState {
  folders: GoogleDriveFolder[];
  loading: boolean;
  error: string | null;
  expandedFolders: Set<string>;
  selectedFolder: GoogleDriveFolder | null;
  searchQuery: string;
}
```

**Responsibilities:**
- Manage modal open/close state
- Fetch root folders on mount
- Coordinate between child components
- Handle folder selection confirmation

#### 3. FolderTree Component

**Location:** `resources/js/components/connections/FolderTree.tsx`

**Props:**
```typescript
interface FolderTreeProps {
  folders: GoogleDriveFolder[];
  expandedFolders: Set<string>;
  selectedFolder: GoogleDriveFolder | null;
  currentFolderId?: string;
  onExpand: (folderId: string) => void;
  onCollapse: (folderId: string) => void;
  onSelect: (folder: GoogleDriveFolder) => void;
  onLoadChildren: (folderId: string) => Promise<GoogleDriveFolder[]>;
}
```

**Responsibilities:**
- Render folder hierarchy with indentation
- Handle expand/collapse of folders
- Lazy load subfolders on expand
- Highlight selected and current folders
- Display folder icons and names

#### 4. FolderSearchBar Component

**Location:** `resources/js/components/connections/FolderSearchBar.tsx`

**Props:**
```typescript
interface FolderSearchBarProps {
  value: string;
  onChange: (query: string) => void;
  onSearch: (query: string) => void;
  loading: boolean;
}
```

**Responsibilities:**
- Render search input
- Debounce search input (300ms)
- Trigger search API call
- Show loading indicator

#### 5. CreateFolderDialog Component

**Location:** `resources/js/components/connections/CreateFolderDialog.tsx`

**Props:**
```typescript
interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, parentId: string | null) => Promise<void>;
  parentFolder: GoogleDriveFolder | null;
}
```

**Responsibilities:**
- Render folder creation dialog
- Validate folder name
- Call create folder API
- Handle errors

### Data Models

#### GoogleDriveFolder Interface

```typescript
interface GoogleDriveFolder {
  id: string;
  name: string;
  path: string;
  parentId: string | null;
  hasChildren: boolean;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
}
```

### Backend Components

#### 1. GoogleDriveFolderController

**Location:** `app/Http/Controllers/GoogleDriveFolderController.php`

**Methods:**

```php
class GoogleDriveFolderController extends Controller
{
    // GET /api/google-drive/folders?parent_id={id}
    public function index(Request $request): JsonResponse
    {
        // Validate parent_id parameter
        // Get OAuth tokens from session
        // Call GoogleDriveService->listFolders()
        // Return folders as JSON
    }

    // POST /api/google-drive/folders
    public function store(Request $request): JsonResponse
    {
        // Validate name and parent_id
        // Get OAuth tokens from session
        // Call GoogleDriveService->createFolder()
        // Return created folder as JSON
    }

    // GET /api/google-drive/folders/{id}
    public function show(string $id): JsonResponse
    {
        // Get OAuth tokens from session
        // Call GoogleDriveService->getFolderPath()
        // Return folder details with full path
    }

    // GET /api/google-drive/folders/search?q={query}
    public function search(Request $request): JsonResponse
    {
        // Validate query parameter
        // Get OAuth tokens from session
        // Call GoogleDriveService->searchFolders()
        // Return matching folders with paths
    }
}
```

#### 2. GoogleDriveService

**Location:** `app/Services/GoogleDriveService.php`

**Methods:**

```php
class GoogleDriveService
{
    private GoogleClient $client;

    public function __construct()
    {
        $this->client = new GoogleClient();
        $this->client->setClientId(config('services.google.client_id'));
        $this->client->setClientSecret(config('services.google.client_secret'));
    }

    /**
     * List folders in Google Drive
     * 
     * @param string|null $parentId Parent folder ID (null for root)
     * @param array $credentials OAuth credentials with access_token
     * @return array Array of folder objects
     */
    public function listFolders(?string $parentId, array $credentials): array
    {
        // Set access token
        // Refresh if expired
        // Query Drive API for folders
        // Filter by parent if specified
        // Return formatted folder array
    }

    /**
     * Create a new folder in Google Drive
     * 
     * @param string $name Folder name
     * @param string|null $parentId Parent folder ID
     * @param array $credentials OAuth credentials
     * @return array Created folder object
     */
    public function createFolder(string $name, ?string $parentId, array $credentials): array
    {
        // Set access token
        // Refresh if expired
        // Create folder via Drive API
        // Return created folder details
    }

    /**
     * Get full path for a folder
     * 
     * @param string $folderId Folder ID
     * @param array $credentials OAuth credentials
     * @return string Full folder path
     */
    public function getFolderPath(string $folderId, array $credentials): string
    {
        // Set access token
        // Traverse parent chain to build path
        // Return formatted path string
    }

    /**
     * Search folders by name
     * 
     * @param string $query Search query
     * @param array $credentials OAuth credentials
     * @return array Matching folders with paths
     */
    public function searchFolders(string $query, array $credentials): array
    {
        // Set access token
        // Query Drive API with search
        // Get paths for results
        // Return formatted results
    }

    /**
     * Refresh access token if expired
     * 
     * @param array $credentials OAuth credentials
     * @return array Updated credentials
     */
    public function refreshTokenIfExpired(array $credentials): array
    {
        // Check if token is expired
        // Use refresh token to get new access token
        // Return updated credentials
    }
}
```

### API Endpoints

```
GET    /api/google-drive/folders              - List folders (root or by parent_id)
POST   /api/google-drive/folders              - Create new folder
GET    /api/google-drive/folders/{id}         - Get folder details with path
GET    /api/google-drive/folders/search       - Search folders by name
```

### Request/Response Examples

#### List Folders

**Request:**
```http
GET /api/google-drive/folders?parent_id=abc123
```

**Response:**
```json
{
  "folders": [
    {
      "id": "folder1",
      "name": "Backups",
      "path": "/Backups",
      "parentId": null,
      "hasChildren": true,
      "mimeType": "application/vnd.google-apps.folder",
      "createdTime": "2024-01-15T10:30:00Z",
      "modifiedTime": "2024-01-15T10:30:00Z"
    },
    {
      "id": "folder2",
      "name": "Documents",
      "path": "/Documents",
      "parentId": null,
      "hasChildren": false,
      "mimeType": "application/vnd.google-apps.folder",
      "createdTime": "2024-01-10T08:20:00Z",
      "modifiedTime": "2024-01-10T08:20:00Z"
    }
  ]
}
```

#### Create Folder

**Request:**
```http
POST /api/google-drive/folders
Content-Type: application/json

{
  "name": "Database Backups",
  "parent_id": "folder1"
}
```

**Response:**
```json
{
  "folder": {
    "id": "newfolder123",
    "name": "Database Backups",
    "path": "/Backups/Database Backups",
    "parentId": "folder1",
    "hasChildren": false,
    "mimeType": "application/vnd.google-apps.folder",
    "createdTime": "2024-01-20T14:45:00Z",
    "modifiedTime": "2024-01-20T14:45:00Z"
  }
}
```

#### Search Folders

**Request:**
```http
GET /api/google-drive/folders/search?q=backup
```

**Response:**
```json
{
  "folders": [
    {
      "id": "folder1",
      "name": "Backups",
      "path": "/Backups",
      "parentId": null,
      "hasChildren": true
    },
    {
      "id": "newfolder123",
      "name": "Database Backups",
      "path": "/Backups/Database Backups",
      "parentId": "folder1",
      "hasChildren": false
    }
  ]
}
```

## Integration Points

### 1. CreateGoogleDrive Page Integration

**File:** `resources/js/pages/Connections/CreateGoogleDrive.tsx`

**Changes:**
- Add FolderPickerButton next to the folder_id input field
- Handle folder selection callback to populate folder_id
- Display selected folder path for user confirmation
- Keep manual input option available

**Updated UI:**
```tsx
<div>
  <Label htmlFor="folder_id">Backup Folder</Label>
  <div className="flex gap-2">
    <Input
      id="folder_id"
      value={formData.folder_id}
      onChange={(e) => setFormData((prev) => ({ ...prev, folder_id: e.target.value }))}
      placeholder="Leave empty to use root folder"
    />
    <FolderPickerButton
      onFolderSelect={(folder) => {
        setFormData((prev) => ({ ...prev, folder_id: folder.id }));
        setSelectedFolderPath(folder.path);
      }}
      currentFolderId={formData.folder_id}
    />
  </div>
  {selectedFolderPath && (
    <p className="mt-1 text-sm text-green-600">
      Selected: {selectedFolderPath}
    </p>
  )}
</div>
```

### 2. Edit Page Integration

**File:** `resources/js/pages/Connections/Edit.tsx`

**Changes:**
- Add folder picker for Google Drive connection type
- Pre-populate current folder in picker
- Highlight current folder in tree

### 3. OAuth Token Management

**Session Storage:**
- OAuth tokens are stored in session after OAuth callback
- Tokens are available during connection creation flow
- Backend APIs will read tokens from session

**Token Refresh:**
- GoogleDriveService will automatically refresh expired tokens
- Updated tokens should be saved back to session
- Frontend should handle 401 errors and prompt re-authentication

## Error Handling

### Frontend Error Scenarios

1. **No OAuth Tokens**
   - Display message: "Please authenticate with Google Drive first"
   - Provide button to start OAuth flow
   - Redirect to OAuth and return to picker

2. **API Request Failure**
   - Display error message in modal
   - Provide "Retry" button
   - Log error to console for debugging

3. **Token Expired**
   - Backend attempts automatic refresh
   - If refresh fails, prompt user to re-authenticate
   - Clear invalid tokens from session

4. **Network Error**
   - Display user-friendly error message
   - Provide retry option
   - Show offline indicator if applicable

5. **Empty Folder List**
   - Display message: "No folders found in your Google Drive"
   - Provide option to create new folder
   - Allow selecting root folder

### Backend Error Scenarios

1. **Invalid Access Token**
   - Return 401 Unauthorized
   - Include error message for frontend
   - Frontend triggers re-authentication

2. **Google API Rate Limit**
   - Return 429 Too Many Requests
   - Include retry-after header
   - Frontend displays appropriate message

3. **Folder Not Found**
   - Return 404 Not Found
   - Clear invalid folder selection
   - Allow user to select different folder

4. **Permission Denied**
   - Return 403 Forbidden
   - Explain permission issue to user
   - Suggest checking Google Drive sharing settings

## Testing Strategy

### Unit Tests

**Frontend:**
- FolderTree component rendering and interaction
- Search debouncing logic
- Folder selection state management
- Error handling in components

**Backend:**
- GoogleDriveService folder listing
- GoogleDriveService folder creation
- GoogleDriveService path building
- Token refresh logic

### Integration Tests

**Frontend:**
- Full folder picker flow (open → browse → select → close)
- Search functionality with API calls
- Create folder flow
- OAuth token validation

**Backend:**
- API endpoints with mocked Google Drive API
- Token refresh during API calls
- Error responses for various scenarios

### Manual Testing Checklist

- [ ] Open folder picker and browse folders
- [ ] Expand/collapse folders with children
- [ ] Search for folders by name
- [ ] Select folder and verify form population
- [ ] Create new folder from picker
- [ ] Handle expired token scenario
- [ ] Test with empty Google Drive
- [ ] Test with deeply nested folders
- [ ] Verify current folder highlighting on edit
- [ ] Test error scenarios (network failure, API errors)

## Security Considerations

1. **OAuth Token Storage**
   - Tokens stored in server-side session only
   - Never expose tokens in frontend code
   - Use HTTPS for all API calls

2. **CSRF Protection**
   - Laravel's CSRF middleware protects API endpoints
   - Include CSRF token in all POST requests

3. **Input Validation**
   - Validate folder names (no special characters)
   - Sanitize search queries
   - Validate folder IDs format

4. **Rate Limiting**
   - Apply rate limiting to folder API endpoints
   - Prevent abuse of Google Drive API quota

5. **Permission Scopes**
   - Use minimal required Google Drive scopes
   - Current scope: `drive.file` (access to files created by app)
   - Consider if broader scope needed for folder browsing

## Performance Considerations

1. **Lazy Loading**
   - Load folders on-demand when expanded
   - Don't fetch entire folder tree upfront
   - Cache loaded folders in component state

2. **Search Debouncing**
   - Debounce search input by 300ms
   - Cancel previous search requests
   - Show loading indicator during search

3. **API Response Caching**
   - Cache folder lists in frontend state
   - Invalidate cache on folder creation
   - Consider short-term backend caching

4. **Pagination**
   - Limit folder results per request (e.g., 100 folders)
   - Implement "Load More" for large folder lists
   - Google Drive API supports pageToken for pagination

## Future Enhancements

1. **Folder Icons**
   - Show different icons for shared folders
   - Display folder color if set in Google Drive

2. **Breadcrumb Navigation**
   - Show breadcrumb trail of current location
   - Allow clicking breadcrumbs to navigate up

3. **Recent Folders**
   - Remember recently selected folders
   - Show quick access to recent folders

4. **Folder Preview**
   - Show folder size and file count
   - Display last modified date

5. **Multi-Select**
   - Allow selecting multiple folders
   - Useful for batch operations in future

6. **Keyboard Navigation**
   - Arrow keys to navigate folders
   - Enter to expand/select
   - Escape to close picker
