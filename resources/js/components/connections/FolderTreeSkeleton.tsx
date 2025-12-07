import { useMemo } from 'react';

interface FolderTreeSkeletonProps {
  count?: number;
}

export function FolderTreeSkeleton({ count = 5 }: FolderTreeSkeletonProps) {
  // Use deterministic widths based on index to avoid calling Math.random() during render
  const widths = useMemo(
    () => Array.from({ length: count }).map((_, i) => 150 + ((i * 37) % 100)),
    [count]
  );

  return (
    <div className="space-y-2 p-4">
      {widths.map((width, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-5 w-5 animate-pulse rounded bg-muted" />
          <div className="h-4 animate-pulse rounded bg-muted" style={{ maxWidth: width }} />
        </div>
      ))}
    </div>
  );
}
