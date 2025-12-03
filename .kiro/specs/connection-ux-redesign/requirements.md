# Requirements Document

## Introduction

This document defines the requirements for redesigning the Connection management UX in Backup Raja. The current implementation presents all connection types in a flat dropdown and displays connections without clear categorization. The redesign introduces a visual, card-based technology picker for creating connections and adds filtering capabilities to the connections index page.

## Glossary

- **Connection**: A configured link to an external service (database or storage) used for backup operations
- **Source Connection**: A connection to a data source that will be backed up (e.g., MongoDB, PostgreSQL, MySQL)
- **Destination Connection**: A connection to a storage location where backups are saved (e.g., S3, Local Storage)
- **Technology**: The specific database or storage system type (e.g., MongoDB, S3, Local Storage)
- **Technology Card**: A visual card component displaying a technology option with icon and name
- **Connection Category**: Classification of a connection as either "source" or "destination"

## Requirements

### Requirement 1: Visual Technology Selection for Connection Creation

**User Story:** As a user, I want to select a connection technology from visual cards with icons, so that I can quickly identify and choose the right technology without reading through a dropdown list.

#### Acceptance Criteria

1. WHEN the user initiates connection creation, THE System SHALL display a category selection step presenting "Source" and "Destination" as distinct visual options.
2. WHEN the user selects a connection category, THE System SHALL display a grid of technology cards showing only technologies applicable to that category.
3. THE System SHALL display each technology card with a recognizable icon, technology name, and brief description.
4. WHEN the user selects a technology card, THE System SHALL navigate to the credential form specific to that technology.
5. THE System SHALL provide a back navigation option to return to the technology selection step from the credential form.

### Requirement 2: Technology Icons on Connection Cards

**User Story:** As a user, I want to see technology icons on my existing connection cards, so that I can quickly identify the technology type at a glance.

#### Acceptance Criteria

1. THE System SHALL display the appropriate technology icon on each connection card in the index view.
2. THE System SHALL maintain consistent icon styling across the index page and creation flow.
3. WHEN a connection type does not have a specific icon, THE System SHALL display a default placeholder icon.

### Requirement 3: Connection Filtering by Category

**User Story:** As a user, I want to filter connections by source or destination category, so that I can focus on the relevant connections for my current task.

#### Acceptance Criteria

1. THE System SHALL provide filter controls on the connections index page for filtering by connection category.
2. WHEN the user selects a category filter, THE System SHALL display only connections matching that category.
3. THE System SHALL indicate the currently active category filter visually.
4. THE System SHALL provide an option to clear filters and show all connections.

### Requirement 4: Connection Filtering by Technology Type

**User Story:** As a user, I want to filter connections by technology type, so that I can quickly find all connections of a specific technology.

#### Acceptance Criteria

1. THE System SHALL provide filter controls for filtering by technology type (MongoDB, S3, Local Storage, etc.).
2. WHEN the user selects a technology filter, THE System SHALL display only connections of that technology type.
3. THE System SHALL allow combining category and technology filters.
4. WHEN filters are combined, THE System SHALL display connections matching all selected filter criteria.

### Requirement 5: Connection Search

**User Story:** As a user, I want to search connections by name, so that I can quickly find a specific connection when I have many configured.

#### Acceptance Criteria

1. THE System SHALL provide a search input on the connections index page.
2. WHEN the user enters a search term, THE System SHALL filter connections to show only those with names containing the search term.
3. THE System SHALL perform search filtering in combination with any active category or technology filters.
4. THE System SHALL update search results as the user types with minimal delay.
