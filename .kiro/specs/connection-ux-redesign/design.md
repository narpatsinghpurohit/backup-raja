# Design Document: Connection UX Redesign

## Overview

This design transforms the connection management experience from a simple dropdown-based form to a visual, card-based technology picker with enhanced filtering capabilities on the index page. The redesign improves discoverability, reduces cognitive load, and helps users quickly identify and manage their connections.

## Architecture

The redesign follows the existing Laravel + Inertia.js + React architecture. Changes are primarily frontend-focused with minimal backend modifications.

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│  Connections/Index.tsx    │  Connections/Create.tsx          │
│  - FilterBar component    │  - CategoryStep component        │
│  - ConnectionCard (icons) │  - TechnologyGrid component      │
│  - Search input           │  - CredentialForm component      │
├─────────────────────────────────────────────────────────────┤
│                  Shared Components                           │
│  - TechnologyIcon.tsx (icon mapping)                         │
│  - TechnologyCard.tsx (selectable card)                      │
│  - ConnectionTypeConfig.ts (type definitions)                │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Connection Type Configuration

A centralized configuration defining all supported technologies:

```typescript
// resources/js/config/connection-types.ts

export type ConnectionCategory = 'source' | 'destination';

export interface TechnologyConfig {
  type: string;           // Backend type identifier
  name: string;           // Display name
  description: string;    // Short description
  category: ConnectionCategory;
  icon: string;           // Icon identifier (lucide icon name or custom)
  color: string;          // Brand color for the icon background
}

export const CONNECTION_TECHNOLOGIES: TechnologyConfig[] = [
  // Sources
  {
    type: 'mongodb',
    name: 'MongoDB',
    description: 'NoSQL document database',
    category: 'source',
    icon: 'Database',        // Lucide: Database icon
    color: 'bg-green-500',
  },
  {
    type: 's3',
    name: 'Amazon S3',
    description: 'S3 bucket as data source',
    category: 'source',
    icon: 'Cloud',           // Lucide: Cloud icon
    color: 'bg-orange-500',
  },
  {
    type: 'google_drive',
    name: 'Google Drive',
    description: 'Google Drive folder',
    category: 'source',
    icon: 'HardDrive',       // Lucide: HardDrive icon
    color: 'bg-blue-500',
  },
  // Destinations
  {
    type: 's3_destination',
    name: 'Amazon S3',
    description: 'S3 bucket for backup storage',
    category: 'destination',
    icon: 'Cloud',           // Lucide: Cloud icon
    color: 'bg-orange-500',
  },
  {
    type: 'local_storage',
    name: 'Local Storage',
    description: 'Server local filesystem',
    category: 'destination',
    icon: 'Folder',          // Lucide: Folder icon
    color: 'bg-gray-500',
  },
];

export const getTechnologyByType = (type: string): TechnologyConfig | undefined =>
  CONNECTION_TECHNOLOGIES.find(t => t.type === type);

export const getTechnologiesByCategory = (category: ConnectionCategory): TechnologyConfig[] =>
  CONNECTION_TECHNOLOGIES.filter(t => t.category === category);
```

### TechnologyIcon Component

Renders the appropriate Lucide icon for a technology type. All icons are from the Lucide icon library (already used in the project) - no custom brand logos.

```typescript
// resources/js/components/connections/TechnologyIcon.tsx

import { Database, Cloud, HardDrive, Folder, Server } from 'lucide-react';

interface TechnologyIconProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
  showBackground?: boolean;
}

// Icon mapping using Lucide icons:
// - mongodb: Database (green background)
// - s3, s3_destination: Cloud (orange background)
// - google_drive: HardDrive (blue background)
// - local_storage: Folder (gray background)
// - fallback: Server (neutral background)
```

### TechnologyCard Component

Selectable card for the technology picker:

```typescript
// resources/js/components/connections/TechnologyCard.tsx

interface TechnologyCardProps {
  technology: TechnologyConfig;
  selected?: boolean;
  onClick: () => void;
}

// Renders a card with:
// - Icon with colored background
// - Technology name
// - Short description
// - Selected state styling
```

### Create Flow Components

#### Step 1: Category Selection

```
┌─────────────────────────────────────────────────────────┐
│           What would you like to connect?               │
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │      📥             │  │      📤             │      │
│  │                     │  │                     │      │
│  │   Data Source       │  │   Backup            │      │
│  │                     │  │   Destination       │      │
│  │   Connect to a      │  │   Where to store    │      │
│  │   database or       │  │   your backups      │      │
│  │   storage to        │  │                     │      │
│  │   backup from       │  │                     │      │
│  └─────────────────────┘  └─────────────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Step 2: Technology Selection

```
┌─────────────────────────────────────────────────────────┐
│  ← Back            Select a Data Source                 │
│                                                         │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐          │
│  │   🍃      │  │   ☁️      │  │   📁      │          │
│  │  MongoDB  │  │ Amazon S3 │  │  Google   │          │
│  │           │  │           │  │  Drive    │          │
│  │  NoSQL    │  │  S3 as    │  │  Google   │          │
│  │  document │  │  source   │  │  Drive    │          │
│  │  database │  │           │  │  folder   │          │
│  └───────────┘  └───────────┘  └───────────┘          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Step 3: Credential Form

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to technologies                                 │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  🍃 MongoDB Connection                           │  │
│  │                                                  │  │
│  │  Connection Name                                 │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │ My Production MongoDB                      │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  │                                                  │  │
│  │  Connection URI                                  │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │ mongodb://user:pass@host:27017             │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  │                                                  │  │
│  │  Database Name                                   │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │ myapp_production                           │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  │                                                  │  │
│  │  ┌──────────────────┐  ┌────────┐              │  │
│  │  │ Create Connection│  │ Cancel │              │  │
│  │  └──────────────────┘  └────────┘              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Index Page Components

#### FilterBar Component

```typescript
// resources/js/components/connections/FilterBar.tsx

interface FilterBarProps {
  selectedCategory: ConnectionCategory | 'all';
  selectedTechnology: string | 'all';
  searchQuery: string;
  onCategoryChange: (category: ConnectionCategory | 'all') => void;
  onTechnologyChange: (type: string | 'all') => void;
  onSearchChange: (query: string) => void;
}
```

#### Index Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  Connections                          + Add Connection  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔍 Search connections...                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Category: [All] [Sources] [Destinations]               │
│                                                         │
│  Technology: [All ▼]                                    │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ 🍃 MongoDB  │  │ 🍃 MongoDB  │  │ 📁 Local    │    │
│  │             │  │             │  │    Storage  │    │
│  │ Edu AI Guru │  │ Edu AI Guru │  │ edu         │    │
│  │ Prod        │  │ Dev         │  │             │    │
│  │    [Active] │  │    [Active] │  │    [Active] │    │
│  │             │  │             │  │             │    │
│  │ [Edit][Del] │  │ [Edit][Del] │  │ [Edit][Del] │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Updated ConnectionCard

The existing card component enhanced with technology icon:

```typescript
// Changes to existing card in Index.tsx

<Card>
  <CardHeader>
    <div className="flex items-start gap-3">
      <TechnologyIcon type={connection.type} size="md" showBackground />
      <div className="flex-1">
        <CardTitle>{connection.name}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {getTechnologyByType(connection.type)?.name}
        </p>
      </div>
      <Badge variant={connection.is_active ? 'default' : 'destructive'}>
        {connection.is_active ? 'Active' : 'Inactive'}
      </Badge>
    </div>
  </CardHeader>
  {/* ... rest of card */}
</Card>
```

## Data Models

No database changes required. The existing Connection model supports all needed data:

```php
// Existing fields used:
- id: number
- name: string
- type: string (s3, mongodb, google_drive, s3_destination, local_storage)
- credentials: encrypted array
- is_active: boolean
- last_validated_at: datetime
```

The `type` field already stores the technology identifier that maps to our frontend configuration.

## Error Handling

| Scenario | Handling |
|----------|----------|
| No connections match filters | Show empty state with message and clear filters button |
| Technology icon not found | Fall back to generic database/storage icon |
| Create flow navigation | Preserve form state when navigating back |
| Invalid technology type from backend | Display with fallback icon and "Unknown" label |

## Testing Strategy

### Unit Tests
- TechnologyIcon renders correct icon for each type
- FilterBar correctly filters connection list
- getTechnologyByType returns correct config
- getTechnologiesByCategory returns correct subset

### Integration Tests
- Create flow navigation between steps
- Filter combinations work correctly
- Search + filter combination
- Form submission with selected technology

### Manual Testing
- Visual verification of icons and colors
- Responsive layout on different screen sizes
- Keyboard navigation through technology cards
- Screen reader accessibility for card selection
