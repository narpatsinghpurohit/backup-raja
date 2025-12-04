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
    // Handle CSRF token mismatch specifically
    if (response.status === 419) {
      throw new Error('Session expired. Please refresh the page and try again.');
    }
    
    try {
      const error: FolderErrorResponse = await response.json();
      if (error.requiresAuth) {
        throw new Error('AUTH_REQUIRED');
      }
      throw new Error(error.error || 'An error occurred');
    } catch (parseError) {
      // If we can't parse the error response, throw a generic error
      throw new Error(`Request failed with status ${response.status}`);
    }
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

function getCsrfToken(): string {
  // Try meta tag first
  const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (metaToken) {
    return metaToken;
  }
  
  // Try XSRF-TOKEN cookie (Laravel sets this)
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  
  return '';
}

export async function createFolder(name: string, parentId?: string): Promise<GoogleDriveFolder> {
  const csrfToken = getCsrfToken();
  const url = buildUrl(API_BASE);
  
  if (!csrfToken) {
    console.warn('No CSRF token found');
  }
  
  const body: Record<string, unknown> = {
    name,
    parent_id: parentId || null,
  };
  
  // Include connection_id in body for POST requests
  if (currentConnectionId) {
    body.connection_id = currentConnectionId;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-TOKEN': csrfToken,
      'X-XSRF-TOKEN': csrfToken,
    },
    credentials: 'same-origin',
    body: JSON.stringify(body),
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
