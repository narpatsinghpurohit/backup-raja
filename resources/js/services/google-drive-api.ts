import type {
  GoogleDriveFolder,
  FolderListResponse,
  FolderResponse,
  FolderErrorResponse,
} from '@/types/google-drive';

const API_BASE = '/api/google-drive/folders';

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
  const url = parentId ? `${API_BASE}?parent_id=${encodeURIComponent(parentId)}` : API_BASE;
  
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
  
  const response = await fetch(API_BASE, {
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
  const response = await fetch(`${API_BASE}/${encodeURIComponent(folderId)}`, {
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
  const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`, {
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'same-origin',
  });

  const data = await handleResponse<FolderListResponse>(response);
  return data.folders;
}
