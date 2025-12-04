export type ConnectionCategory = 'source' | 'destination';

export interface TechnologyConfig {
  type: string;
  name: string;
  description: string;
  category: ConnectionCategory;
  icon: string;
  color: string;
}

export const CONNECTION_TECHNOLOGIES: TechnologyConfig[] = [
  // Sources
  {
    type: 'mongodb',
    name: 'MongoDB',
    description: 'NoSQL document database',
    category: 'source',
    icon: 'Database',
    color: 'bg-green-500',
  },
  {
    type: 's3',
    name: 'Amazon S3',
    description: 'S3 bucket as data source',
    category: 'source',
    icon: 'Cloud',
    color: 'bg-orange-500',
  },
  {
    type: 'google_drive',
    name: 'Google Drive',
    description: 'Google Drive folder',
    category: 'source',
    icon: 'HardDrive',
    color: 'bg-blue-500',
  },
  // Destinations
  {
    type: 's3_destination',
    name: 'Amazon S3',
    description: 'S3 bucket for backup storage',
    category: 'destination',
    icon: 'Cloud',
    color: 'bg-orange-500',
  },
  {
    type: 'local_storage',
    name: 'Local Storage',
    description: 'Server local filesystem',
    category: 'destination',
    icon: 'Folder',
    color: 'bg-gray-500',
  },
];

export const getTechnologyByType = (type: string): TechnologyConfig | undefined =>
  CONNECTION_TECHNOLOGIES.find((t) => t.type === type);

export const getTechnologiesByCategory = (category: ConnectionCategory): TechnologyConfig[] =>
  CONNECTION_TECHNOLOGIES.filter((t) => t.category === category);

export const getCategoryForType = (type: string): ConnectionCategory | undefined =>
  getTechnologyByType(type)?.category;
