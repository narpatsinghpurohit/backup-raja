import { MongoDBIcon, GoogleDriveIcon, AmazonS3Icon, ServerIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { ComponentType } from 'react';

interface TechnologyIconProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
  showBackground?: boolean;
  className?: string;
}

interface IconProps {
  className?: string;
}

// Map connection types to brand icons
const iconMap: Record<string, ComponentType<IconProps>> = {
  mongodb: MongoDBIcon,
  s3: AmazonS3Icon,
  s3_destination: AmazonS3Icon,
  google_drive: GoogleDriveIcon,
  local_storage: ServerIcon,
};

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
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
  const Icon = iconMap[type] || ServerIcon;

  if (showBackground) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-muted',
          backgroundSizeClasses[size],
          className
        )}
      >
        <Icon className={sizeClasses[size]} />
      </div>
    );
  }

  return <Icon className={cn(sizeClasses[size], className)} />;
}
