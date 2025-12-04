export interface LocalStorageFolder {
  id: string;
  name: string;
  path: string;
  parentPath: string | null;
  hasChildren: boolean;
  children?: LocalStorageFolder[];
  isLoading?: boolean;
  isExpanded?: boolean;
}

export interface FolderListResponse {
  folders: LocalStorageFolder[];
}

export interface FolderResponse {
  folder: LocalStorageFolder;
}

export interface FolderErrorResponse {
  error: string;
}
