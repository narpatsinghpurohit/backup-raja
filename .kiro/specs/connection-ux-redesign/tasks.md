# Implementation Plan

- [x] 1. Create connection type configuration and shared components
  - [x] 1.1 Create connection types configuration file
    - Create `resources/js/config/connection-types.ts` with TechnologyConfig interface
    - Define CONNECTION_TECHNOLOGIES array with all 5 connection types (mongodb, s3, google_drive, s3_destination, local_storage)
    - Include helper functions: getTechnologyByType, getTechnologiesByCategory
    - _Requirements: 1.3, 2.1_

  - [x] 1.2 Create TechnologyIcon component
    - Create `resources/js/components/connections/TechnologyIcon.tsx`
    - Map technology types to Lucide icons (Database, Cloud, HardDrive, Folder)
    - Support size variants (sm, md, lg) and optional colored background
    - Handle fallback for unknown types with Server icon
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 1.3 Create TechnologyCard component
    - Create `resources/js/components/connections/TechnologyCard.tsx`
    - Display icon with colored background, name, and description
    - Support selected state with visual styling
    - Handle click events for selection
    - _Requirements: 1.2, 1.3_

- [x] 2. Redesign connection creation flow
  - [x] 2.1 Create CategoryStep component
    - Create `resources/js/components/connections/CategoryStep.tsx`
    - Display two large cards: "Data Source" and "Backup Destination"
    - Include icons and descriptions for each category
    - Handle category selection callback
    - _Requirements: 1.1_

  - [x] 2.2 Create TechnologyGrid component
    - Create `resources/js/components/connections/TechnologyGrid.tsx`
    - Accept category prop to filter technologies
    - Render grid of TechnologyCard components
    - Include back button to return to category selection
    - Handle technology selection callback
    - _Requirements: 1.2, 1.4_

  - [x] 2.3 Create CredentialForm component
    - Create `resources/js/components/connections/CredentialForm.tsx`
    - Accept technology type prop to render appropriate fields
    - Display technology icon and name in header
    - Include back button to return to technology selection
    - Reuse existing credential field logic from Create.tsx
    - _Requirements: 1.4, 1.5_

  - [x] 2.4 Refactor Create.tsx to use step-based flow
    - Add step state management (category → technology → form)
    - Integrate CategoryStep, TechnologyGrid, and CredentialForm components
    - Preserve form data when navigating back
    - Handle form submission with selected technology type
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [x] 3. Enhance connections index page
  - [x] 3.1 Create FilterBar component
    - Create `resources/js/components/connections/FilterBar.tsx`
    - Add category toggle buttons (All, Sources, Destinations)
    - Add technology dropdown filter populated from config
    - Add search input with debounced onChange
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.1_

  - [x] 3.2 Update Index.tsx with filtering and icons
    - Import and add FilterBar component
    - Add filter state management (category, technology, search)
    - Implement client-side filtering logic combining all filters
    - Update ConnectionCard to include TechnologyIcon
    - Show technology name from config instead of raw type
    - _Requirements: 2.1, 3.2, 3.3, 3.4, 4.2, 4.3, 4.4, 5.2, 5.3, 5.4_

  - [x] 3.3 Add empty state for filtered results
    - Show message when no connections match filters
    - Include button to clear all filters
    - _Requirements: 3.4_

- [x] 4. Testing
  - [x] 4.1 Write unit tests for connection type utilities
    - Test getTechnologyByType returns correct config
    - Test getTechnologiesByCategory filters correctly
    - Test fallback behavior for unknown types
    - _Requirements: 1.3, 2.3_

  - [x] 4.2 Write component tests for create flow
    - Test step navigation (forward and back)
    - Test technology filtering by category
    - Test form submission with correct type
    - _Requirements: 1.1, 1.2, 1.4, 1.5_
