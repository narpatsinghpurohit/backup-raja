import { useState, useEffect } from 'react';
import { FolderSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FolderPickerModal } from './FolderPickerModal';
import { setConnectionId } from '@/services/google-drive-api';
import type { GoogleDriveFolder } from '@/types/google-drive';

interface FolderPickerButtonProps {
  onFolderSelect: (folder: GoogleDriveFolder | null) => void;
  currentFolderId?: string;
  connectionId?: number;
  disabled?: boolean;
}

export function FolderPickerButton({
  onFolderSelect,
  currentFolderId,
  connectionId,
  disabled,
}: FolderPickerButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  // Set connection ID for API calls when editing existing connections
  useEffect(() => {
    if (connectionId) {
      setConnectionId(connectionId);
    }
    return () => setConnectionId(null);
  }, [connectionId]);

  const handleSelect = (folder: GoogleDriveFolder | null) => {
    onFolderSelect(folder);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setModalOpen(true)}
        disabled={disabled}
        className="gap-2"
      >
        <FolderSearch className="h-4 w-4" />
        Browse
      </Button>

      <FolderPickerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelect}
        currentFolderId={currentFolderId}
        connectionId={connectionId}
      />
    </>
  );
}
