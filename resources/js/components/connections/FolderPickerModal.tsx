import { useState, useEffect, useCallback } from 'react';
import { Loader2, FolderPlus, RefreshCw, Home, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FolderTree } from './FolderTree';
import { FolderSearchBar } from './FolderSearchBar';
import { CreateFolderDialog } from './CreateFolderDialog';
import { FolderTreeSkeleton } from './FolderTreeSkeleton';
import { listFolders, searchFolders, createFolder } from '@/services/google-drive-api';
import type { GoogleDriveFolder } from '@/types/google-drive';

interface FolderPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (folder: GoogleDriveFolder | null) => void;
  currentFolderId?: string;
}

export function FolderPickerModal({
  open,
  onClose,
  onSelect,
  currentFolderId,
}: FolderPickerModalProps) {
  const [folders, setFolders] = useState<GoogleDriveFolder[]>([]);
  const [searchResults, setSearchResults] = useState<GoogleDriveFolder[] | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<GoogleDriveFolder | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadRootFolders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rootFolders = await listFolders();
      setFolders(rootFolders);
    } catch (err) {
      if (err instanceof Error && err.message === 'AUTH_REQUIRED') {
        setError('Please authenticate with Google Drive first');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load folders');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadRootFolders();
      setSelectedFolder(null);
      setSearchResults(null);
    }
  }, [open, loadRootFolders]);


  const handleExpand = useCallback(async (folder: GoogleDriveFolder) => {
    if (folder.isExpanded) {
      // Collapse
      setFolders((prev) =>
        updateFolderInTree(prev, folder.id, { isExpanded: false })
      );
      return;
    }

    // Expand and load children
    setFolders((prev) =>
      updateFolderInTree(prev, folder.id, { isLoading: true, isExpanded: true })
    );

    try {
      const children = await listFolders(folder.id);
      setFolders((prev) =>
        updateFolderInTree(prev, folder.id, { children, isLoading: false })
      );
    } catch (err) {
      setFolders((prev) =>
        updateFolderInTree(prev, folder.id, { isLoading: false, isExpanded: false })
      );
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setSearchLoading(true);
    try {
      const results = await searchFolders(query);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchResults(null);
  }, []);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCreateFolder = useCallback(async (name: string) => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      const parentId = selectedFolder?.id || null;
      const newFolder = await createFolder(name, parentId || undefined);
      
      // Add to tree
      if (parentId) {
        setFolders((prev) =>
          updateFolderInTree(prev, parentId, {
            children: [...(findFolderInTree(prev, parentId)?.children || []), newFolder],
            hasChildren: true,
            isExpanded: true,
          })
        );
      } else {
        setFolders((prev) => [...prev, newFolder]);
      }
      
      setSelectedFolder(newFolder);
      setCreateDialogOpen(false);
      
      // Show success message briefly
      setSuccessMessage(`Folder "${name}" created successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setCreateLoading(false);
    }
  }, [selectedFolder]);

  const handleConfirm = () => {
    onSelect(selectedFolder);
    onClose();
  };

  const handleSelectRoot = () => {
    setSelectedFolder(null);
  };

  const displayFolders = searchResults ?? folders;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-h-[80vh] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Google Drive Folder</DialogTitle>
            <DialogDescription>
              Choose a folder for your backups or use the root folder
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <FolderSearchBar
              onSearch={handleSearch}
              onClear={handleClearSearch}
              loading={searchLoading}
            />

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={selectedFolder === null ? 'secondary' : 'outline'}
                size="sm"
                onClick={handleSelectRoot}
                className="gap-1"
              >
                <Home className="h-3 w-3" />
                Root Folder
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
                className="gap-1"
              >
                <FolderPlus className="h-3 w-3" />
                New Folder
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={loadRootFolders}
                disabled={loading}
                className="ml-auto gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="max-h-[300px] min-h-[200px] overflow-y-auto rounded-md border p-2">
              {loading ? (
                <FolderTreeSkeleton count={6} />
              ) : error ? (
                <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center px-4">
                  <p className="text-sm text-destructive">{error}</p>
                  {error.includes('authenticate') ? (
                    <a href="/oauth/google/redirect">
                      <Button variant="default" size="sm">
                        Re-authenticate with Google
                      </Button>
                    </a>
                  ) : (
                    <Button variant="outline" size="sm" onClick={loadRootFolders}>
                      Retry
                    </Button>
                  )}
                </div>
              ) : displayFolders.length === 0 ? (
                <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center px-4">
                  <p className="text-sm text-muted-foreground">
                    {searchResults !== null
                      ? 'No folders match your search'
                      : 'No folders found in your Google Drive'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateDialogOpen(true)}
                    className="gap-1"
                  >
                    <FolderPlus className="h-3 w-3" />
                    Create a folder
                  </Button>
                </div>
              ) : (
                <FolderTree
                  folders={displayFolders}
                  selectedFolderId={selectedFolder?.id ?? null}
                  currentFolderId={currentFolderId}
                  onSelect={setSelectedFolder}
                  onExpand={handleExpand}
                />
              )}
            </div>

            {successMessage && (
              <div className="flex items-center gap-2 rounded-md bg-green-50 p-2 text-sm text-green-700 dark:bg-green-950/20 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                {successMessage}
              </div>
            )}

            {selectedFolder && (
              <p className="text-sm text-muted-foreground">
                Selected: <span className="font-medium">{selectedFolder.path || `/${selectedFolder.name}`}</span>
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirm}>
              {selectedFolder ? 'Select Folder' : 'Use Root Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateFolderDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreateFolder}
        parentFolder={selectedFolder}
        loading={createLoading}
        error={createError}
      />
    </>
  );
}

// Helper functions for tree manipulation
function updateFolderInTree(
  folders: GoogleDriveFolder[],
  folderId: string,
  updates: Partial<GoogleDriveFolder>
): GoogleDriveFolder[] {
  return folders.map((folder) => {
    if (folder.id === folderId) {
      return { ...folder, ...updates };
    }
    if (folder.children) {
      return {
        ...folder,
        children: updateFolderInTree(folder.children, folderId, updates),
      };
    }
    return folder;
  });
}

function findFolderInTree(
  folders: GoogleDriveFolder[],
  folderId: string
): GoogleDriveFolder | null {
  for (const folder of folders) {
    if (folder.id === folderId) {
      return folder;
    }
    if (folder.children) {
      const found = findFolderInTree(folder.children, folderId);
      if (found) return found;
    }
  }
  return null;
}
