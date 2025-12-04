# Design Document: Connection Duplication Feature

## Overview

This design adds a connection duplication feature that allows users to quickly create new connections based on existing ones. The feature is particularly useful for creating multiple connections with the same credentials but different paths, folders, or buckets.

## Architecture

The duplication feature integrates into the existing connection management flow with minimal changes to the backend.

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│  Connections/Index.tsx    │  Connections/Duplicate.tsx       │
│  - Add Duplicate button   │  - Pre-filled form               │
│                           │  - Field highlighting            │
│                           │                                  │
│  Connections/Edit.tsx     │                                  │
│  - Add Duplicate button   │                                  │
├─────────────────────────────────────────────────────────────┤
│                     Backend (Laravel)                        │
│  ConnectionController     │  ConnectionService               │
│  - duplicate() method     │  - Existing validation           │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Backend Route

Add a new route for the duplicate page:

```php
// routes/web.php
Route::get('/connections/{connection}/duplicate', [ConnectionController::class, 'duplicate'])
    ->name('connections.duplicate');
```

### Backend Controller Method

```php
// app/Http/Controllers/ConnectionController.php

public function duplicate(Connection $connection)
{
    // Prepare credentials for duplication (mask sensitive fields)
    $credentials = $connection->credentials;
    
    return Inertia::render('Connections/Duplicate', [
        'baseConnection' => [
            'id' => $connection->id,
            'name' => $connection->name,
            'type' => $connection->type,
            'credentials' => $credentials,
        ],
    ]);
}
```


### Frontend Duplicate Page

Create a new page similar to Create.tsx but with pre-filled data:

```typescript
// resources/js/pages/Connections/Duplicate.tsx

interface BaseConnection {
  id: number;
  name: string;
  type: string;
  credentials: Record<string, string>;
}

interface Props {
  baseConnection: BaseConnection;
}

// The page will:
// 1. Use the same CredentialForm component from the UX redesign
// 2. Pre-fill form data with baseConnection data
// 3. Modify connection name to "[Original Name] (Copy)"
// 4. Highlight path-like fields with visual indicators
// 5. Submit to the existing POST /connections endpoint
```

### Field Highlighting Component

```typescript
// resources/js/components/connections/HighlightedField.tsx

interface HighlightedFieldProps {
  children: React.ReactNode;
  helpText: string;
}

// Wraps input fields with:
// - Subtle border highlight (e.g., blue border)
// - Info icon with tooltip
// - Helper text explaining why this field should be changed
```

### Path-like Fields by Technology

Define which fields should be highlighted for each technology:

```typescript
// resources/js/config/connection-types.ts

export const PATH_FIELDS_BY_TYPE: Record<string, string[]> = {
  mongodb: ['database'],
  s3: ['bucket'],
  google_drive: ['folder_id'],
  s3_destination: ['bucket'],
  local_storage: ['path'],
};

export const getPathFieldsForType = (type: string): string[] =>
  PATH_FIELDS_BY_TYPE[type] || [];
```


## UI Design

### Index Page - Duplicate Button

Add a duplicate button to each connection card:

```
┌─────────────────────────────────────────────────────┐
│ 🍃 MongoDB                              [Active]    │
│                                                     │
│ Edu AI Guru Prod                                    │
│                                                     │
│ [✏️ Edit] [📋 Duplicate] [🗑️ Delete]               │
└─────────────────────────────────────────────────────┘
```

### Duplicate Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to connections                                  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  🍃 Duplicate MongoDB Connection                 │  │
│  │                                                  │  │
│  │  Duplicating from: "Edu AI Guru Prod"           │  │
│  │                                                  │  │
│  │  Connection Name                                 │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │ Edu AI Guru Prod (Copy)                    │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  │                                                  │  │
│  │  Connection URI                                  │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │ mongodb://user:pass@host:27017             │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  │                                                  │  │
│  │  Database Name                    ℹ️ Change this│  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │ myapp_production                           │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  │  💡 Tip: Change the database name to create a  │  │
│  │     connection to a different database          │  │
│  │                                                  │  │
│  │  ┌──────────────────┐  ┌────────┐              │  │
│  │  │ Create Connection│  │ Cancel │              │  │
│  │  └──────────────────┘  └────────┘              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Edit Page - Duplicate Button

Add duplicate button to the edit page header:

```
┌─────────────────────────────────────────────────────────┐
│  Edit Connection              [📋 Duplicate] [🗑️ Delete]│
│                                                         │
│  ... edit form ...                                      │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

1. User clicks "Duplicate" on a connection
2. Navigate to `/connections/{id}/duplicate`
3. Controller loads connection and passes to Inertia
4. Duplicate page renders with pre-filled form
5. User modifies necessary fields (highlighted)
6. Form submits to existing `POST /connections` endpoint
7. ConnectionService validates and creates new connection
8. Redirect to connections index with success message

## Error Handling

| Scenario | Handling |
|----------|----------|
| Base connection not found | Show 404 error page |
| Validation fails on duplicate | Show validation errors on form |
| Duplicate with same path/folder | Allow (user might want same config with different name) |
| Connection test fails | Show error message, allow retry |

## Testing Strategy

### Manual Testing
- Duplicate each connection type and verify pre-filled data
- Modify path-like fields and verify new connection works
- Test duplicate from both index and edit pages
- Verify validation works on duplicated connections
