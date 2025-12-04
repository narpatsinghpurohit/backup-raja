import { useState } from 'react';
import { FolderSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocalStorageFolderPickerModal } from './LocalStorageFolderPickerModal';
import type { LocalStorageFolder } from '@/types/local-storage';

interface LocalStorageFolderPickerButtonProps {
  disk: string;
  onFolderSelect: (folder: LocalStorageFolder | null) => void;
  currentPath?: string;
  disabled?: boolean;
}

export function LocalStorageFolderPickerButton({
  disk,
  onFolderSelect,
  currentPath,
  disabled,
}: LocalStorageFolderPickerButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleSelect = (folder: LocalStorageFolder | null) => {
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

      <LocalStorageFolderPickerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelect}
        disk={disk}
        currentPath={currentPath}
      />
    </>
  );
}
