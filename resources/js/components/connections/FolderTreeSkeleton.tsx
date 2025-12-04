import { Skeleton } from '@/components/ui/skeleton';

interface FolderTreeSkeletonProps {
  count?: number;
}

export function FolderTreeSkeleton({ count = 5 }: FolderTreeSkeletonProps) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-2" style={{ paddingLeft: `${(i % 3) * 16}px` }}>
          <Skeleton className="h-4 w-4 shrink-0" />
          <Skeleton className="h-4 w-4 shrink-0" />
          <Skeleton className="h-4 flex-1" style={{ maxWidth: `${150 + Math.random() * 100}px` }} />
        </div>
      ))}
    </div>
  );
}
