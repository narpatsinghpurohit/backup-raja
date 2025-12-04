# Implementation Plan

- [ ] 1. Database migrations
  - [ ] 1.1 Add retention fields to backup_schedules
    - Create migration to add `retention_count` (nullable integer) and `retention_days` (nullable integer) to backup_schedules table
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 1.2 Add protection and deletion fields to backup_operations
    - Create migration to add `is_protected` (boolean, default false), `is_deleted` (boolean, default false), `deleted_at` (nullable timestamp) to backup_operations table
    - _Requirements: 4.1, 5.4_

  - [ ] 1.3 Create retention_settings table
    - Create migration for `retention_settings` table with id, key (unique string), value (nullable string), timestamps
    - _Requirements: 1.4_

- [ ] 2. Create models and update existing models
  - [ ] 2.1 Create RetentionSetting model
    - Create `app/Models/RetentionSetting.php`
    - Define fillable fields: key, value
    - _Requirements: 1.4_

  - [ ] 2.2 Update BackupSchedule model
    - Add `retention_count` and `retention_days` to fillable array
    - Add `getRetentionDescription()` helper method
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 2.3 Update BackupOperation model
    - Add `is_protected`, `is_deleted`, `deleted_at` to fillable array
    - Add casts for boolean and datetime fields
    - Add scope `notDeleted()` to exclude soft-deleted backups
    - _Requirements: 4.1, 5.4_

- [ ] 3. Create retention and cleanup services
  - [ ] 3.1 Create RetentionService
    - Create `app/Services/RetentionService.php`
    - Implement `getExpiredBackups()` to find all backups exceeding retention limits
    - Implement `getExpiredForSchedule()` for schedule-specific retention
    - Implement `getExpiredOrphanBackups()` for backups without schedules using global settings
    - Implement `getGlobalSetting()` and `setGlobalSetting()` helpers
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 3.2_

  - [ ] 3.2 Create CleanupAdapterInterface
    - Create `app/Services/Adapters/CleanupAdapterInterface.php`
    - Define `deleteFile(string $path, Connection $connection): void` method
    - _Requirements: 6.1, 6.3_

  - [ ] 3.3 Create LocalStorageCleanupAdapter
    - Create `app/Services/Adapters/LocalStorageCleanupAdapter.php`
    - Implement file deletion using Laravel Storage facade
    - Handle case where file doesn't exist gracefully
    - _Requirements: 6.1, 6.2_

  - [ ] 3.4 Create GoogleDriveCleanupAdapter
    - Create `app/Services/Adapters/GoogleDriveCleanupAdapter.php`
    - Add `deleteFile()` method to GoogleDriveService
    - Implement file deletion via Google Drive API
    - Handle case where file doesn't exist gracefully
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 3.5 Create CleanupService
    - Create `app/Services/CleanupService.php`
    - Implement `runCleanup()` to process all expired backups
    - Implement `deleteBackup()` to delete single backup and its files
    - Implement `getCleanupAdapter()` to get appropriate adapter for destination type
    - Return results with processed/deleted/failed counts
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1_

- [ ] 4. Create cleanup command and scheduler
  - [ ] 4.1 Create CleanupBackups command
    - Create `app/Console/Commands/CleanupBackups.php`
    - Add `--dry-run` option to preview without deleting
    - Output processed/deleted/failed counts
    - Log errors for failed deletions
    - _Requirements: 3.1, 5.1, 5.2, 5.3_

  - [ ] 4.2 Register cleanup in scheduler
    - Add `backups:cleanup` command to run daily at 3 AM in Kernel.php or routes/console.php
    - _Requirements: 3.1_

- [ ] 5. Add controller endpoints
  - [ ] 5.1 Add backup protection toggle
    - Add `toggleProtection()` method to BackupController
    - Add route `POST /backups/{backup}/protect`
    - Toggle `is_protected` field and return updated backup
    - _Requirements: 4.1, 4.2, 4.4_

  - [ ] 5.2 Create SettingsController for retention
    - Create `app/Http/Controllers/SettingsController.php`
    - Implement `getRetention()` to return global retention settings
    - Implement `updateRetention()` to save global retention settings
    - Implement `cleanupPreview()` to return list of backups eligible for deletion
    - Implement `runCleanup()` to manually trigger cleanup
    - _Requirements: 1.4, 5.1, 5.2_

  - [ ] 5.3 Add settings routes
    - Add routes for retention settings and cleanup endpoints
    - _Requirements: 1.4, 5.2_

- [ ] 6. Update schedule forms with retention
  - [ ] 6.1 Update Schedule Create page
    - Add retention section to `resources/js/pages/Schedules/Create.tsx`
    - Add retention type select: Keep Forever, Keep Last N, Keep for X Days, Custom
    - Show count input when Keep Last N or Custom selected
    - Show days input when Keep for X Days or Custom selected
    - Display human-readable retention description
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_

  - [ ] 6.2 Update Schedule Edit page
    - Add same retention fields to `resources/js/pages/Schedules/Edit.tsx`
    - Pre-populate with existing retention values
    - _Requirements: 1.3_

  - [ ] 6.3 Update ScheduleController
    - Add retention_count and retention_days to validation rules
    - Pass retention fields to ScheduleService
    - _Requirements: 1.3_

- [ ] 7. Add backup protection UI
  - [ ] 7.1 Update Backup Show page
    - Add protection toggle to `resources/js/pages/Backups/Show.tsx`
    - Show protected badge when backup is protected
    - _Requirements: 4.1, 4.3, 4.4_

  - [ ] 7.2 Update Backup Index page
    - Add protected badge/icon to backup list items
    - Filter out deleted backups from list (or show with deleted indicator)
    - _Requirements: 4.3_

- [ ] 8. Create retention settings page
  - [ ] 8.1 Create Settings page
    - Create `resources/js/pages/Settings/Index.tsx`
    - Add global retention settings form (default count, default days)
    - Add "Run Cleanup Now" button with confirmation
    - Show cleanup preview (list of backups to be deleted)
    - Display last cleanup run info
    - _Requirements: 1.4, 2.1, 2.2, 5.1, 5.2_

  - [ ] 8.2 Add Settings to navigation
    - Add Settings link to sidebar navigation
    - _Requirements: 1.4_

- [ ]* 9. Add tests
  - [ ]* 9.1 Write unit tests for RetentionService
    - Test count-based retention logic
    - Test time-based retention logic
    - Test combined retention (most restrictive)
    - Test protected backup exclusion
    - _Requirements: 1.1, 1.2, 1.5, 4.2_

  - [ ]* 9.2 Write integration tests for CleanupService
    - Test file deletion for each adapter
    - Test soft delete of backup records
    - Test error handling when file missing
    - _Requirements: 3.3, 3.4, 6.1, 6.2_
