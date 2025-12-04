import { useState } from 'react';
import { Loader2, FolderPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { GoogleDriveFolder } from '@/types/google-drive';

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  parentFolder: GoogleDriveFolder | null;
  loading: boolean;
  error: string | null;
}

export function CreateFolderDialog({
  open,
  onClose,
  onCreate,
  parentFolder,
  loading,
  error,
}: CreateFolderDialogProps) {
  const [name, setName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling to parent forms
    setValidationError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Folder name is required');
      return;
    }

    if (trimmedName.length > 255) {
      setValidationError('Folder name must be less than 255 characters');
      return;
    }

    // Check for invalid characters
    if (/[<>:"/\\|?*]/.test(trimmedName)) {
      setValidationError('Folder name contains invalid characters');
      return;
    }

    try {
      await onCreate(trimmedName);
      setName('');
    } catch (err) {
      // Error is handled by parent, but we catch here to prevent any bubbling
      console.error('Failed to create folder:', err);
    }
  };

  const handleClose = () => {
    setName('');
    setValidationError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Create New Folder
          </DialogTitle>
          <DialogDescription>
            {parentFolder
              ? `Create a new folder inside "${parentFolder.name}"`
              : 'Create a new folder in your Google Drive root'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter folder name"
                disabled={loading}
                autoFocus
              />
              {(validationError || error) && (
                <p className="text-sm text-destructive">{validationError || error}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Folder'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
