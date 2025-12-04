# Implementation Plan

- [x] 1. Add path fields configuration
  - [x] 1.1 Update connection-types.ts with path fields mapping
    - Add PATH_FIELDS_BY_TYPE constant mapping each connection type to its path-like fields
    - Add getPathFieldsForType helper function
    - _Requirements: 3.3, 3.4, 3.5_

- [x] 2. Create field highlighting component
  - [x] 2.1 Create HighlightedField component
    - Create `resources/js/components/connections/HighlightedField.tsx`
    - Wrap children with highlighted border styling
    - Display info icon with tooltip
    - Show helper text below the field
    - _Requirements: 3.1, 3.2_

- [x] 3. Add duplicate route and controller method
  - [x] 3.1 Add duplicate route to web.php
    - Add GET route for `/connections/{connection}/duplicate`
    - Name route as `connections.duplicate`
    - _Requirements: 1.2_

  - [x] 3.2 Add duplicate method to ConnectionController
    - Load connection by ID
    - Prepare credentials for display (keep all fields for duplication)
    - Return Inertia render with baseConnection data
    - _Requirements: 1.2, 2.2_

- [x] 4. Create Duplicate page component
  - [x] 4.1 Create Duplicate.tsx page
    - Create `resources/js/pages/Connections/Duplicate.tsx`
    - Accept baseConnection prop from backend
    - Pre-fill form with baseConnection data
    - Modify name to "[Original Name] (Copy)"
    - Display "Duplicating from: [name]" header
    - Reuse CredentialForm component with modifications
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4_

  - [x] 4.2 Enhance CredentialForm for duplication mode
    - Add optional `highlightFields` prop to CredentialForm
    - Wrap highlighted fields with HighlightedField component
    - Pass appropriate helper text for each field type
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Add duplicate button to Index page
  - [x] 5.1 Update Index.tsx with duplicate button
    - Add "Duplicate" button to each connection card
    - Position between Edit and Delete buttons
    - Link to `/connections/{id}/duplicate` route
    - Use Copy icon from lucide-react
    - _Requirements: 1.1, 1.3, 1.4_

- [x] 6. Add duplicate button to Edit page
  - [x] 6.1 Update Edit.tsx with duplicate button
    - Add "Duplicate" button to page header
    - Link to `/connections/{id}/duplicate` route
    - Position near other action buttons
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 7. Testing
  - [x] 7.1 Test duplication for each connection type
    - Test MongoDB duplication (database field highlighted)
    - Test S3 duplication (bucket field highlighted)
    - Test Google Drive duplication (folder_id field highlighted)
    - Test Local Storage duplication (path field highlighted)
    - Verify validation works on duplicated connections
    - _Requirements: 2.5, 4.1, 4.2, 4.3_

  - [x] 7.2 Test duplicate from multiple entry points
    - Test duplicate from index page
    - Test duplicate from edit page
    - Verify consistent behavior
    - _Requirements: 5.3_
