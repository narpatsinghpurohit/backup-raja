import { Database, Cloud, HardDrive, Folder, Server, LucideIcon } from 'lucide-react';
import { getTechnologyByType } from '@/config/connection-types';
import { cn } from '@/lib/utils';

interface TechnologyIconProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
  showBackground?: boolean;
  className?: string;
}

const iconMap: Record<string, LucideIcon> = {
  Database,
  Cloud,
  HardDrive,
  Folder,
  Server,
};

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const backgroundSizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export function TechnologyIcon({
  type,
  size = 'md',
  showBackground = false,
  className,
}: TechnologyIconProps) {
  const technology = getTechnologyByType(type);
  const iconName = technology?.icon || 'Server';
  const color = technology?.color || 'bg-gray-500';
  const Icon = iconMap[iconName] || Server;

  if (showBackground) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg',
          backgroundSizeClasses[size],
          color,
          className
        )}
      >
        <Icon className={cn(sizeClasses[size], 'text-white')} />
      </div>
    );
  }

  return <Icon className={cn(sizeClasses[size], className)} />;
}
