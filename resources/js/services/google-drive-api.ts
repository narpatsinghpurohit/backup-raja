import type {
  GoogleDriveFolder,
  FolderListResponse,
  FolderResponse,
  FolderErrorResponse,
} from '@/types/google-drive';

const API_BASE = '/api/google-drive/folders';

// Store connection ID for API calls when editing existing connections
let currentConnectionId: number | null = null;

export function setConnectionId(connectionId: number | null): void {
  currentConnectionId = connectionId;
}

export function getConnectionId(): number | null {
  return currentConnectionId;
}

function buildUrl(path: string, params: Record<string, string> = {}): string {
  const url = new URL(path, window.location.origin);
  
  // Add connection_id if set (for editing existing connections)
  if (currentConnectionId) {
    url.searchParams.set('connection_id', currentConnectionId.toString());
  }
  
  // Add other params
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  
  return url.toString();
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: FolderErrorResponse = await response.json();
    if (error.requiresAuth) {
      throw new Error('AUTH_REQUIRED');
    }
    throw new Error(error.error || 'An error occurred');
  }
  return response.json();
}

export async function listFolders(parentId?: string): Promise<GoogleDriveFolder[]> {
  const url = buildUrl(API_BASE, parentId ? { parent_id: parentId } : {});
  
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'same-origin',
  });

  const data = await handleResponse<FolderListResponse>(response);
  return data.folders;
}

export async function createFolder(name: string, parentId?: string): Promise<GoogleDriveFolder> {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  const url = buildUrl(API_BASE);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-TOKEN': csrfToken || '',
    },
    credentials: 'same-origin',
    body: JSON.stringify({
      name,
      parent_id: parentId || null,
    }),
  });

  const data = await handleResponse<FolderResponse>(response);
  return data.folder;
}

export async function getFolderDetails(folderId: string): Promise<GoogleDriveFolder> {
  const url = buildUrl(`${API_BASE}/${encodeURIComponent(folderId)}`);
  
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'same-origin',
  });

  const data = await handleResponse<FolderResponse>(response);
  return data.folder;
}

export async function searchFolders(query: string): Promise<GoogleDriveFolder[]> {
  const url = buildUrl(`${API_BASE}/search`, { q: query });
  
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'same-origin',
  });

  const data = await handleResponse<FolderListResponse>(response);
  return data.folders;
}
