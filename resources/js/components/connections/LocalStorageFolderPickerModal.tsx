import { useState, useEffect, useCallback } from 'react';
import { FolderPlus, RefreshCw, Home, CheckCircle2 } from 'lucide-react';
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
import { CreateFolderDialog } from './CreateFolderDialog';
import { FolderTreeSkeleton } from './FolderTreeSkeleton';
import { listFolders, createFolder } from '@/services/local-storage-api';
import type { LocalStorageFolder } from '@/types/local-storage';
import type { GoogleDriveFolder } from '@/types/google-drive';

interface LocalStorageFolderPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (folder: LocalStorageFolder | null) => void;
  disk: string;
  currentPath?: string;
}

export function LocalStorageFolderPickerModal({
  open,
  onClose,
  onSelect,
  disk,
  currentPath,
}: LocalStorageFolderPickerModalProps) {
  const [folders, setFolders] = useState<LocalStorageFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<LocalStorageFolder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const diskLabel = disk === 'local' ? 'storage/app' : 'storage/app/public';

  const loadRootFolders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rootFolders = await listFolders(disk);
      setFolders(rootFolders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  }, [disk]);

  useEffect(() => {
    if (open) {
      loadRootFolders();
      setSelectedFolder(null);
    }
  }, [open, loadRootFolders]);

  const handleExpand = useCallback(async (folder: LocalStorageFolder) => {
    if (folder.isExpanded) {
      setFolders((prev) =>
        updateFolderInTree(prev, folder.id, { isExpanded: false })
      );
      return;
    }

    setFolders((prev) =>
      updateFolderInTree(prev, folder.id, { isLoading: true, isExpanded: true })
    );

    try {
      const children = await listFolders(disk, folder.id);
      setFolders((prev) =>
        updateFolderInTree(prev, folder.id, { children, isLoading: false })
      );
    } catch {
      setFolders((prev) =>
        updateFolderInTree(prev, folder.id, { isLoading: false, isExpanded: false })
      );
    }
  }, [disk]);

  const handleCreateFolder = useCallback(async (name: string) => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      const parentPath = selectedFolder?.id || '';
      const newFolder = await createFolder(disk, name, parentPath);

      if (parentPath) {
        setFolders((prev) =>
          updateFolderInTree(prev, parentPath, {
            children: [...(findFolderInTree(prev, parentPath)?.children || []), newFolder],
            hasChildren: true,
            isExpanded: true,
          })
        );
      } else {
        setFolders((prev) => [...prev, newFolder].sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        ));
      }

      setSelectedFolder(newFolder);
      setCreateDialogOpen(false);
      setSuccessMessage(`Folder "${name}" created successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setCreateLoading(false);
    }
  }, [disk, selectedFolder]);

  const handleConfirm = () => {
    onSelect(selectedFolder);
    onClose();
  };

  const handleSelectRoot = () => {
    setSelectedFolder(null);
  };

  // Adapt LocalStorageFolder to GoogleDriveFolder format for FolderTree reuse
  const adaptedFolders = folders.map(adaptToGoogleDriveFolder);

  const handleTreeSelect = (folder: GoogleDriveFolder) => {
    setSelectedFolder(adaptFromGoogleDriveFolder(folder));
  };

  const handleTreeExpand = (folder: GoogleDriveFolder) => {
    const localFolder = adaptFromGoogleDriveFolder(folder);
    handleExpand(localFolder);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-h-[80vh] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Storage Folder</DialogTitle>
            <DialogDescription>
              Browsing: {diskLabel}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={selectedFolder === null ? 'secondary' : 'outline'}
                size="sm"
                onClick={handleSelectRoot}
                className="gap-1"
              >
                <Home className="h-3 w-3" />
                Root
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
                  <Button variant="outline" size="sm" onClick={loadRootFolders}>
                    Retry
                  </Button>
                </div>
              ) : folders.length === 0 ? (
                <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center px-4">
                  <p className="text-sm text-muted-foreground">
                    No folders found. Create one to get started.
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
                  folders={adaptedFolders}
                  selectedFolderId={selectedFolder?.id ?? null}
                  currentFolderId={currentPath}
                  onSelect={handleTreeSelect}
                  onExpand={handleTreeExpand}
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
                Selected: <span className="font-medium">{selectedFolder.path}</span>
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirm}>
              {selectedFolder ? 'Select Folder' : 'Use Root'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateFolderDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreateFolder}
        parentFolder={selectedFolder ? { id: selectedFolder.id, name: selectedFolder.name } as GoogleDriveFolder : null}
        loading={createLoading}
        error={createError}
      />
    </>
  );
}

// Helper functions for tree manipulation
function updateFolderInTree(
  folders: LocalStorageFolder[],
  folderId: string,
  updates: Partial<LocalStorageFolder>
): LocalStorageFolder[] {
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
  folders: LocalStorageFolder[],
  folderId: string
): LocalStorageFolder | null {
  for (const folder of folders) {
    if (folder.id === folderId) return folder;
    if (folder.children) {
      const found = findFolderInTree(folder.children, folderId);
      if (found) return found;
    }
  }
  return null;
}

// Adapter functions to reuse FolderTree component
function adaptToGoogleDriveFolder(folder: LocalStorageFolder): GoogleDriveFolder {
  return {
    id: folder.id,
    name: folder.name,
    path: folder.path,
    parentId: folder.parentPath,
    hasChildren: folder.hasChildren,
    mimeType: 'application/vnd.google-apps.folder',
    createdTime: '',
    modifiedTime: '',
    children: folder.children?.map(adaptToGoogleDriveFolder),
    isLoading: folder.isLoading,
    isExpanded: folder.isExpanded,
  };
}

function adaptFromGoogleDriveFolder(folder: GoogleDriveFolder): LocalStorageFolder {
  return {
    id: folder.id,
    name: folder.name,
    path: folder.path || `/${folder.name}`,
    parentPath: folder.parentId,
    hasChildren: folder.hasChildren,
    children: folder.children?.map(adaptFromGoogleDriveFolder),
    isLoading: folder.isLoading,
    isExpanded: folder.isExpanded,
  };
}
