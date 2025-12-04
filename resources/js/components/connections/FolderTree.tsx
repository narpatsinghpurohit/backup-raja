import { ChevronRight, ChevronDown, Folder, FolderOpen, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GoogleDriveFolder } from '@/types/google-drive';

interface FolderTreeProps {
  folders: GoogleDriveFolder[];
  selectedFolderId: string | null;
  currentFolderId?: string;
  onSelect: (folder: GoogleDriveFolder) => void;
  onExpand: (folder: GoogleDriveFolder) => void;
  level?: number;
}

interface FolderItemProps {
  folder: GoogleDriveFolder;
  selectedFolderId: string | null;
  currentFolderId?: string;
  onSelect: (folder: GoogleDriveFolder) => void;
  onExpand: (folder: GoogleDriveFolder) => void;
  level: number;
}

function FolderItem({
  folder,
  selectedFolderId,
  currentFolderId,
  onSelect,
  onExpand,
  level,
}: FolderItemProps) {
  const isSelected = selectedFolderId === folder.id;
  const isCurrent = currentFolderId === folder.id;
  const isExpanded = folder.isExpanded;
  const isLoading = folder.isLoading;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (folder.hasChildren) {
      onExpand(folder);
    }
  };

  const handleSelect = () => {
    onSelect(folder);
  };

  return (
    <div>
      <div
        className={cn(
          'flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
          isSelected && 'bg-primary/10 text-primary',
          isCurrent && !isSelected && 'border border-dashed border-primary/50 bg-primary/5'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleSelect}
      >
        <button
          type="button"
          className="flex h-4 w-4 shrink-0 items-center justify-center"
          onClick={handleToggle}
          disabled={!folder.hasChildren}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          ) : folder.hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )
          ) : null}
        </button>
        
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-blue-500" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-blue-500" />
        )}
        
        <span className="truncate">{folder.name}</span>
        
        {isCurrent && (
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">(current)</span>
        )}
      </div>

      {isExpanded && folder.children && folder.children.length > 0 && (
        <FolderTree
          folders={folder.children}
          selectedFolderId={selectedFolderId}
          currentFolderId={currentFolderId}
          onSelect={onSelect}
          onExpand={onExpand}
          level={level + 1}
        />
      )}
    </div>
  );
}

export function FolderTree({
  folders,
  selectedFolderId,
  currentFolderId,
  onSelect,
  onExpand,
  level = 0,
}: FolderTreeProps) {
  if (folders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-0.5">
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          selectedFolderId={selectedFolderId}
          currentFolderId={currentFolderId}
          onSelect={onSelect}
          onExpand={onExpand}
          level={level}
        />
      ))}
    </div>
  );
}
