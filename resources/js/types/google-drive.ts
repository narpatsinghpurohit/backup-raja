export interface GoogleDriveFolder {
  id: string;
  name: string;
  path?: string;
  parentId: string | null;
  hasChildren: boolean;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  children?: GoogleDriveFolder[];
  isLoading?: boolean;
  isExpanded?: boolean;
}

export interface FolderListResponse {
  folders: GoogleDriveFolder[];
}

export interface FolderResponse {
  folder: GoogleDriveFolder;
}

export interface FolderErrorResponse {
  error: string;
  requiresAuth?: boolean;
}
