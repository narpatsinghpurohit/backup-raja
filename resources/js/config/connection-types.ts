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
  // S3 source hidden - uncomment to enable
  // {
  //   type: 's3',
  //   name: 'Amazon S3',
  //   description: 'S3 bucket as data source',
  //   category: 'source',
  //   icon: 'Cloud',
  //   color: 'bg-orange-500',
  // },
  // Destinations
  // S3 destination hidden - uncomment to enable
  // {
  //   type: 's3_destination',
  //   name: 'Amazon S3',
  //   description: 'S3 bucket for backup storage',
  //   category: 'destination',
  //   icon: 'Cloud',
  //   color: 'bg-orange-500',
  // },
  {
    type: 'google_drive',
    name: 'Google Drive',
    description: 'Google Drive folder for backups',
    category: 'destination',
    icon: 'HardDrive',
    color: 'bg-blue-500',
  },
  {
    type: 'local_storage',
    name: 'Server Storage',
    description: 'Store backups on the server filesystem',
    category: 'destination',
    icon: 'Folder',
    color: 'bg-gray-500',
  },
];


export const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    mongodb: 'MongoDB',
    s3: 'S3',
    google_drive: 'Google Drive',
    s3_destination: 'S3',
    local_storage: 'Server Storage',
  };
  return labels[type] || type;
};

export const getTechnologyByType = (type: string): TechnologyConfig | undefined =>
  CONNECTION_TECHNOLOGIES.find((t) => t.type === type);

export const getTechnologiesByCategory = (category: ConnectionCategory): TechnologyConfig[] =>
  CONNECTION_TECHNOLOGIES.filter((t) => t.category === category);

export const getCategoryForType = (type: string): ConnectionCategory | undefined =>
  getTechnologyByType(type)?.category;

export interface PathFieldConfig {
  field: string;
  label: string;
  helpText: string;
}

export const PATH_FIELDS_BY_TYPE: Record<string, PathFieldConfig[]> = {
  mongodb: [
    {
      field: 'database',
      label: 'Database Name',
      helpText: 'Change this to connect to a different database with the same credentials',
    },
  ],
  s3: [
    {
      field: 'bucket',
      label: 'Bucket Name',
      helpText: 'Change this to connect to a different S3 bucket with the same credentials',
    },
  ],
  s3_destination: [
    {
      field: 'bucket',
      label: 'Bucket Name',
      helpText: 'Change this to store backups in a different S3 bucket',
    },
  ],
  google_drive: [
    {
      field: 'folder_id',
      label: 'Folder ID',
      helpText: 'Change this to store backups in a different Google Drive folder',
    },
  ],
  local_storage: [
    {
      field: 'path',
      label: 'Storage Path',
      helpText: 'Change this to store backups in a different directory',
    },
  ],
};

export const getPathFieldsForType = (type: string): PathFieldConfig[] =>
  PATH_FIELDS_BY_TYPE[type] || [];
