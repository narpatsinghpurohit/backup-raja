# Requirements Document

## Introduction

This document defines the requirements for adding a connection duplication feature to Backup Raja. Users often need to create multiple connections with the same credentials but different paths or folders (e.g., different Google Drive folders, different S3 buckets, or different local storage paths). The duplication feature allows users to quickly create a new connection based on an existing one, modifying only the necessary fields.

## Glossary

- **Connection**: A configured link to an external service (database or storage) used for backup operations
- **Duplicate Connection**: A new connection created by copying an existing connection's credentials and allowing modification of specific fields
- **Base Connection**: The original connection being duplicated
- **Path-like Fields**: Configuration fields that specify locations (folder_id, path, bucket, database)
- **Credential Fields**: Authentication fields that remain the same (access_token, secret_key, uri)

## Requirements

### Requirement 1: Duplicate Connection Action

**User Story:** As a user, I want to duplicate an existing connection from the connections list, so that I can quickly create a similar connection without re-entering credentials.

#### Acceptance Criteria

1. THE System SHALL provide a "Duplicate" action button on each connection card in the connections index page.
2. WHEN the user clicks the duplicate button, THE System SHALL navigate to a duplication form pre-filled with the base connection's data.
3. THE System SHALL visually distinguish the duplicate action from edit and delete actions.
4. THE System SHALL display the duplicate button for all connection types.

### Requirement 2: Pre-filled Duplication Form

**User Story:** As a user, I want the duplication form to be pre-filled with the original connection's data, so that I only need to modify the fields that differ.

#### Acceptance Criteria

1. THE System SHALL pre-fill the connection name with the pattern "[Original Name] (Copy)".
2. THE System SHALL pre-fill all credential fields with the original connection's values.
3. THE System SHALL pre-fill path-like fields (folder_id, path, bucket, database) with the original values.
4. THE System SHALL allow the user to modify any pre-filled field.
5. THE System SHALL display the technology type as read-only based on the base connection.

### Requirement 3: Field Modification Guidance

**User Story:** As a user, I want clear guidance on which fields I should modify when duplicating, so that I understand what makes this connection unique.

#### Acceptance Criteria

1. THE System SHALL highlight or indicate path-like fields that typically need modification (folder_id, path, bucket, database).
2. THE System SHALL provide helper text explaining what makes each connection unique.
3. WHEN duplicating a Google Drive connection, THE System SHALL indicate that folder_id should be changed.
4. WHEN duplicating a Local Storage connection, THE System SHALL indicate that path should be changed.
5. WHEN duplicating an S3 connection, THE System SHALL indicate that bucket name should be changed.

### Requirement 4: Connection Validation on Duplicate

**User Story:** As a user, I want the duplicated connection to be validated before creation, so that I know the new configuration works.

#### Acceptance Criteria

1. THE System SHALL validate the duplicated connection's credentials using the same validation logic as new connections.
2. WHEN validation fails, THE System SHALL display an error message with details.
3. WHEN validation succeeds, THE System SHALL create the new connection and mark it as active.
4. THE System SHALL redirect to the connections index page after successful duplication.

### Requirement 5: Duplicate from Connection Details

**User Story:** As a user, I want to duplicate a connection from its detail/edit page, so that I have multiple ways to access the duplication feature.

#### Acceptance Criteria

1. THE System SHALL provide a "Duplicate" button on the connection edit page.
2. WHEN the user clicks duplicate from the edit page, THE System SHALL navigate to the duplication form.
3. THE System SHALL maintain consistent duplication behavior regardless of entry point.
