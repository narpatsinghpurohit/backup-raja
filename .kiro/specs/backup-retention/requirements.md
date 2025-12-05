# Requirements Document

## Introduction

This feature adds backup retention policies to automatically clean up old backups based on configurable rules. Users can define retention policies per schedule or globally, specifying how many backups to keep or how long to retain them. The system automatically deletes expired backups and their associated files from storage destinations.

## Glossary

- **Retention_Policy**: A set of rules defining how long backups should be kept before automatic deletion
- **Retention_Type**: The method of retention - either count-based (keep last N) or time-based (keep for X days)
- **Cleanup_Job**: The background process that identifies and removes expired backups
- **Protected_Backup**: A backup marked to be excluded from automatic retention cleanup

## Requirements

### Requirement 1: Retention Policy Configuration

**User Story:** As a user, I want to configure retention policies for my backups, so that old backups are automatically cleaned up without manual intervention.

#### Acceptance Criteria

1. THE Retention_Policy SHALL support count-based retention where the user specifies the number of backups to keep.
2. THE Retention_Policy SHALL support time-based retention where the user specifies the number of days to retain backups.
3. WHEN creating or editing a backup schedule, THE System SHALL display retention policy configuration options for that schedule.
4. WHEN no schedule-specific retention policy exists, THE System SHALL apply the global default retention policy.
5. WHEN both count and time limits are configured, THE Retention_Policy SHALL apply whichever limit is more restrictive.

### Requirement 2: Retention Policy Options

**User Story:** As a user, I want flexible retention options, so that I can balance storage costs with backup availability.

#### Acceptance Criteria

1. THE System SHALL provide preset retention options: Keep Last 5, Keep Last 10, Keep Last 30, Keep 7 Days, Keep 30 Days, Keep 90 Days, and Forever.
2. THE System SHALL allow custom retention values for both count and days inputs.
3. WHEN the user selects "Forever" retention, THE System SHALL exclude backups under that policy from automatic deletion.
4. WHEN retention settings are configured, THE System SHALL display estimated storage impact based on those settings.

### Requirement 3: Automatic Cleanup Execution

**User Story:** As a user, I want expired backups to be automatically deleted, so that I don't have to manually manage storage.

#### Acceptance Criteria

1. THE Cleanup_Job SHALL run automatically on a configurable schedule (default: daily).
2. WHEN the Cleanup_Job runs, THE System SHALL identify all backups that exceed their retention policy limits.
3. THE Cleanup_Job SHALL delete the backup archive files from the storage destination.
4. THE Cleanup_Job SHALL update the BackupOperation record to reflect deletion.
5. IF file deletion fails, THEN THE System SHALL log the error and retry on the next cleanup run.

### Requirement 4: Protected Backups

**User Story:** As a user, I want to protect specific backups from automatic deletion, so that important backups are preserved regardless of retention policy.

#### Acceptance Criteria

1. WHEN viewing a backup, THE System SHALL allow the user to mark that backup as a Protected_Backup.
2. WHILE a backup is marked as a Protected_Backup, THE Cleanup_Job SHALL exclude that backup from deletion.
3. THE System SHALL display a visual indicator for protected backups in the backup list.
4. WHEN viewing a Protected_Backup, THE System SHALL allow the user to remove protection to make it eligible for cleanup.

### Requirement 5: Cleanup Visibility and Control

**User Story:** As a user, I want to see what backups will be deleted and have control over the cleanup process, so that I can prevent accidental data loss.

#### Acceptance Criteria

1. WHEN viewing cleanup settings, THE System SHALL display a list of backups eligible for deletion based on current retention policies.
2. THE System SHALL provide a manual "Run Cleanup Now" action accessible from the settings page.
3. WHEN the Cleanup_Job completes, THE System SHALL log all cleanup operations with details of deleted backups.
4. WHEN a backup is deleted by the Cleanup_Job, THE System SHALL retain the BackupOperation metadata for audit purposes.

### Requirement 6: Storage Cleanup

**User Story:** As a user, I want backup files to be properly removed from storage destinations, so that I'm not paying for storage of deleted backups.

#### Acceptance Criteria

1. WHEN deleting a backup, THE System SHALL remove the archive file from the destination (Google Drive, Local Storage, or S3).
2. IF the archive file no longer exists at the destination, THEN THE System SHALL mark the backup as deleted without raising an error.
3. WHEN cleaning up from Google Drive or S3, THE System SHALL use the appropriate API calls for file deletion.
4. WHEN cleaning up from Local Storage, THE System SHALL use filesystem deletion operations.
