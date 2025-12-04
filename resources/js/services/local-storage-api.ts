import type {
  LocalStorageFolder,
  FolderListResponse,
  FolderResponse,
  FolderErrorResponse,
} from '@/types/local-storage';

const API_BASE = '/api/local-storage/folders';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 419) {
      throw new Error('Session expired. Please refresh the page and try again.');
    }
    
    try {
      const error: FolderErrorResponse = await response.json();
      throw new Error(error.error || 'An error occurred');
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message !== 'An error occurred') {
        throw parseError;
      }
      throw new Error(`Request failed with status ${response.status}`);
    }
  }
  return response.json();
}

function getCsrfToken(): string {
  const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (metaToken) {
    return metaToken;
  }
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  
  return '';
}

export async function listFolders(
  disk: string,
  path?: string
): Promise<LocalStorageFolder[]> {
  const params = new URLSearchParams({ disk });
  if (path) params.set('path', path);
  
  const response = await fetch(`${API_BASE}?${params}`, {
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'same-origin',
  });

  const data = await handleResponse<FolderListResponse>(response);
  return data.folders;
}

export async function createFolder(
  disk: string,
  name: string,
  parentPath?: string
): Promise<LocalStorageFolder> {
  const csrfToken = getCsrfToken();
  
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-TOKEN': csrfToken,
      'X-XSRF-TOKEN': csrfToken,
    },
    credentials: 'same-origin',
    body: JSON.stringify({
      disk,
      name,
      path: parentPath || '',
    }),
  });

  const data = await handleResponse<FolderResponse>(response);
  return data.folder;
}
