# Implementation Plan

- [x] 1. Set up database and model
  - [x] 1.1 Create backup_schedules migration
    - Create migration file for `backup_schedules` table
    - Include columns: name, source_connection_id, destination_connection_id, cron_expression, frequency_preset, is_active, last_run_at, next_run_at, last_run_status, success_count, failure_count
    - Add foreign key constraints to connections table with cascade delete
    - _Requirements: 1.1, 2.1, 4.1_

  - [x] 1.2 Add backup_schedule_id to backup_operations
    - Create migration to add nullable `backup_schedule_id` foreign key to backup_operations
    - Set onDelete to 'set null' to preserve backup history if schedule deleted
    - _Requirements: 3.2, 4.3_

  - [x] 1.3 Create BackupSchedule model
    - Create `app/Models/BackupSchedule.php`
    - Define fillable fields and casts
    - Add relationships: sourceConnection, destinationConnection, backupOperations
    - Add helper methods: isDue(), getNextRunDate(), getHumanReadableSchedule()
    - _Requirements: 1.4, 2.5, 3.1_

  - [x] 1.4 Update BackupOperation model
    - Add `backup_schedule_id` to fillable
    - Add `backupSchedule` relationship
    - _Requirements: 3.2, 4.3_

- [x] 2. Create schedule service and command
  - [x] 2.1 Install cron-expression package
    - Run `composer require dragonmantank/cron-expression`
    - _Requirements: 1.3, 3.1_

  - [x] 2.2 Create ScheduleService
    - Create `app/Services/ScheduleService.php`
    - Implement createSchedule() with cron expression handling
    - Implement updateSchedule() method
    - Implement runSchedule() to trigger backup and link to schedule
    - Implement runDueSchedules() to find and run all due schedules
    - Implement updateScheduleStatus() for success/failure tracking
    - Add getCronExpression() helper for preset to cron conversion
    - Add calculateNextRun() helper
    - _Requirements: 1.2, 1.3, 3.1, 3.2, 3.3, 3.4, 4.1, 4.4_

  - [x] 2.3 Create RunScheduledBackups command
    - Create `app/Console/Commands/RunScheduledBackups.php`
    - Implement handle() to call ScheduleService::runDueSchedules()
    - Output count of initiated backups
    - _Requirements: 3.1_

  - [x] 2.4 Register command in scheduler
    - Update `app/Console/Kernel.php` or `routes/console.php`
    - Schedule `backups:run-scheduled` to run every minute
    - _Requirements: 3.1_

  - [x] 2.5 Update BackupJob to notify schedule
    - Modify `app/Jobs/BackupJob.php`
    - After backup completes, call ScheduleService::updateScheduleStatus()
    - Update schedule's last_run_status, success_count, or failure_count
    - _Requirements: 3.3, 4.1, 4.4_

- [x] 3. Create schedule controller and routes
  - [x] 3.1 Create ScheduleController
    - Create `app/Http/Controllers/ScheduleController.php`
    - Implement index() - list all schedules with connections
    - Implement create() - show form with source/destination options
    - Implement store() - validate and create schedule
    - Implement show() - display schedule with recent runs
    - Implement edit() - show edit form
    - Implement update() - validate and update schedule
    - Implement destroy() - delete schedule
    - Implement toggle() - enable/disable schedule
    - Implement runNow() - manually trigger schedule
    - _Requirements: 1.1, 1.5, 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3_

  - [x] 3.2 Add routes
    - Add resource routes for schedules
    - Add POST route for toggle action
    - Add POST route for runNow action
    - _Requirements: 2.1, 2.3, 5.1_

- [x] 4. Create frontend pages
  - [x] 4.1 Create Schedules Index page
    - Create `resources/js/pages/Schedules/Index.tsx`
    - Display table/list of schedules with name, source→destination, frequency, status
    - Show last run time/status and next run time
    - Add toggle switch for enable/disable
    - Add action buttons: Edit, Run Now, Delete
    - Add "New Schedule" button linking to create page
    - _Requirements: 2.1, 2.3, 2.5, 6.2, 6.3_

  - [x] 4.2 Create Schedule Create page
    - Create `resources/js/pages/Schedules/Create.tsx`
    - Form with name, source select, destination select
    - Frequency preset dropdown (Hourly, Daily, Weekly, Monthly, Custom)
    - Custom cron input shown when Custom selected
    - Display human-readable schedule description
    - Active toggle (default on)
    - Submit creates schedule and redirects to index
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1_

  - [x] 4.3 Create Schedule Edit page
    - Create `resources/js/pages/Schedules/Edit.tsx`
    - Pre-populate form with existing schedule data
    - Same fields as create page
    - Submit updates schedule and redirects to index
    - _Requirements: 2.2_

  - [x] 4.4 Create Schedule Show page
    - Create `resources/js/pages/Schedules/Show.tsx`
    - Display schedule configuration details
    - Show statistics: success count, failure count
    - Display recent runs list with status, duration, link to backup details
    - Add "Run Now" button
    - Add Edit and Delete buttons
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1_

- [x] 5. Add navigation and polish
  - [x] 5.1 Add Schedules to navigation
    - Update sidebar/navigation to include Schedules link
    - Add calendar/clock icon for schedules
    - _Requirements: 2.1_

  - [x] 5.2 Add schedule info to backup details
    - Update Backups/Show page to display linked schedule if present
    - Show "Triggered by: [Schedule Name]" with link
    - _Requirements: 4.3_

- [ ]* 6. Add tests
  - [ ]* 6.1 Write unit tests for ScheduleService
    - Test cron expression parsing for each preset
    - Test next run calculation
    - Test due schedule detection
    - _Requirements: 3.1, 3.4_

  - [ ]* 6.2 Write feature tests for ScheduleController
    - Test CRUD operations
    - Test toggle endpoint
    - Test runNow endpoint
    - Test validation rules
    - _Requirements: 1.1, 2.2, 2.3, 5.1_
