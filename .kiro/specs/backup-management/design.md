# Design Document

## Overview

The Backup Management System is a Laravel 12 application with Inertia.js (React) frontend that provides centralized backup orchestration for S3 and MongoDB data sources. The architecture follows Laravel best practices with a service-oriented approach, utilizing Laravel's queue system for asynchronous backup execution, encrypted database storage for credentials, and real-time log streaming via polling.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  React/Inertia  │ ← Frontend (shadcn/ui components)
│   Components    │
└────────┬────────┘
         │ HTTP/Inertia
┌────────▼────────┐
│    Laravel      │
│   Controllers   │
└────────┬────────┘
         │
┌────────▼────────┐
│    Services     │ ← Business Logic Layer
│  - BackupService│
│  - RestoreService│
│  - ConnectionService│
└────────┬────────┘
         │
┌────────▼────────┐
│   Repositories  │ ← Data Access Layer
└────────┬────────┘
         │
┌────────▼────────┐
│   Eloquent      │
│    Models       │
└────────┬────────┘
         │
┌────────▼────────┐
│    Database     │ (SQLite/MySQL/PostgreSQL)
└─────────────────┘

┌─────────────────┐
│  Laravel Queue  │ ← Async Job Processing
│   - BackupJob   │
│   - RestoreJob  │
└────────┬────────┘
         │
┌────────▼────────┐
│   Adapters      │ ← External Service Integration
│  - S3Adapter    │
│  - MongoAdapter │
│  - GDriveAdapter│
└─────────────────┘
```

### Technology Stack

- **Backend**: Laravel 12, PHP 8.2+
- **Frontend**: React 18, Inertia.js, TypeScript
- **UI Components**: shadcn/ui
- **Queue**: Laravel Queue (database driver for MVP)
- **Database**: SQLite (default), supports MySQL/PostgreSQL
- **External SDKs**:
  - AWS SDK for PHP (S3 operations)
  - MongoDB PHP Library (mongodump execution)
  - Google API PHP Client (Google Drive operations)

## Components and Interfaces

### 1. Data Models

#### Connection Model
```php
class Connection extends Model
{
    protected $fillable = [
        'name',
        'type', // 's3', 'mongodb', 'google_drive'
        'credentials', // encrypted JSON
        'is_active',
        'last_validated_at'
    ];
    
    protected $casts = [
        'credentials' => 'encrypted:array',
        'is_active' => 'boolean',
        'last_validated_at' => 'datetime'
    ];
}
```

#### BackupOperation Model
```php
class BackupOperation extends Model
{
    protected $fillable = [
        'source_connection_id',
        'destination_connection_id',
        'status', // pending, running, completed, failed, paused, cancelled
        'archive_path',
        'archive_size',
        'metadata', // JSON with timestamp, source details
        'started_at',
        'completed_at',
        'error_message'
    ];
    
    protected $casts = [
        'metadata' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime'
    ];
}
```

#### RestoreOperation Model
```php
class RestoreOperation extends Model
{
    protected $fillable = [
        'backup_operation_id',
        'destination_connection_id',
        'destination_config', // JSON with target details
        'status',
        'started_at',
        'completed_at',
        'error_message'
    ];
    
    protected $casts = [
        'destination_config' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime'
    ];
}
```

#### JobLog Model
```php
class JobLog extends Model
{
    protected $fillable = [
        'loggable_type', // BackupOperation or RestoreOperation
        'loggable_id',
        'level', // info, warning, error
        'message',
        'context' // JSON
    ];
    
    protected $casts = [
        'context' => 'array'
    ];
}
```

### 2. Service Layer

#### ConnectionService
Handles connection management, credential validation, and encryption.

**Methods:**
- `createConnection(array $data): Connection` - Create and validate new connection
- `updateConnection(Connection $connection, array $data): Connection` - Update and re-validate
- `validateConnection(Connection $connection): bool` - Test connection validity
- `deleteConnection(Connection $connection): void` - Delete if no active operations
- `testCredentials(string $type, array $credentials): bool` - Validate before saving

#### BackupService
Orchestrates backup operations and job dispatching.

**Methods:**
- `initiateBackup(Connection $source, Connection $destination): BackupOperation` - Create and dispatch backup job
- `pauseBackup(BackupOperation $operation): void` - Pause running backup
- `cancelBackup(BackupOperation $operation): void` - Cancel and cleanup
- `resumeBackup(BackupOperation $operation): void` - Resume paused backup
- `getBackupHistory(array $filters): Collection` - Retrieve filtered backup list

#### RestoreService
Manages restore operations.

**Methods:**
- `initiateRestore(BackupOperation $backup, Connection $destination, array $config): RestoreOperation` - Create and dispatch restore job
- `getRestoreHistory(): Collection` - Retrieve restore operations

#### LogService
Handles job logging and retrieval.

**Methods:**
- `log(Model $loggable, string $level, string $message, array $context = []): void` - Create log entry
- `getLogsForOperation(Model $operation, ?int $since = null): Collection` - Get logs with optional filtering
- `clearOldLogs(int $daysToKeep): void` - Cleanup old logs

### 3. Job Classes

#### BackupJob
```php
class BackupJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    
    public function __construct(
        public BackupOperation $operation
    ) {}
    
    public function handle(
        BackupExecutor $executor,
        LogService $logService
    ): void {
        // Execute backup using appropriate adapter
        // Log progress at each step
        // Handle pause/cancel signals
        // Update operation status
    }
}
```

#### RestoreJob
```php
class RestoreJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    
    public function __construct(
        public RestoreOperation $operation
    ) {}
    
    public function handle(
        RestoreExecutor $executor,
        LogService $logService
    ): void {
        // Execute restore using appropriate adapter
        // Log progress
        // Verify integrity
        // Update operation status
    }
}
```

### 4. Adapter Pattern for External Services

#### BackupAdapterInterface
```php
interface BackupAdapterInterface
{
    public function backup(Connection $source, string $tempPath): string;
    public function upload(string $archivePath, Connection $destination): string;
    public function canPause(): bool;
    public function pause(): void;
    public function resume(): void;
}
```

#### Implementations:
- **S3BackupAdapter**: Uses AWS SDK to sync bucket contents, create tar.gz archive
- **MongoBackupAdapter**: Executes mongodump command, creates gzip archive
- **S3DestinationAdapter**: Uploads archive to S3 bucket
- **GoogleDriveDestinationAdapter**: Uploads archive to Google Drive folder

### 5. Frontend Components (React/Inertia)

#### Pages:
- **Dashboard** - Overview of connections and recent operations
- **Connections/Index** - List all connections with status indicators
- **Connections/Create** - Form to add new connection
- **Connections/Edit** - Form to edit connection
- **Backups/Index** - List all backup operations with filters
- **Backups/Create** - Form to initiate new backup
- **Backups/Show** - View backup details and logs
- **Restores/Create** - Form to initiate restore
- **Restores/Show** - View restore details and logs

#### Shared Components:
- **TerminalLog** - Terminal-like log viewer with auto-scroll and polling
- **ConnectionCard** - Display connection with status badge
- **OperationStatusBadge** - Color-coded status indicator
- **BackupControls** - Pause/Cancel/Resume buttons
- **ConnectionForm** - Dynamic form based on connection type

## Data Models

### Database Schema

#### connections
```sql
CREATE TABLE connections (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    type ENUM('s3', 'mongodb', 'google_drive', 's3_destination') NOT NULL,
    credentials TEXT NOT NULL, -- encrypted JSON
    is_active BOOLEAN DEFAULT TRUE,
    last_validated_at TIMESTAMP NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_is_active (is_active)
);
```

#### backup_operations
```sql
CREATE TABLE backup_operations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    source_connection_id BIGINT NOT NULL,
    destination_connection_id BIGINT NOT NULL,
    status ENUM('pending', 'running', 'completed', 'failed', 'paused', 'cancelled') NOT NULL,
    archive_path VARCHAR(500) NULL,
    archive_size BIGINT NULL,
    metadata JSON NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (source_connection_id) REFERENCES connections(id),
    FOREIGN KEY (destination_connection_id) REFERENCES connections(id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

#### restore_operations
```sql
CREATE TABLE restore_operations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    backup_operation_id BIGINT NOT NULL,
    destination_connection_id BIGINT NOT NULL,
    destination_config JSON NOT NULL,
    status ENUM('pending', 'running', 'completed', 'failed', 'cancelled') NOT NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (backup_operation_id) REFERENCES backup_operations(id),
    FOREIGN KEY (destination_connection_id) REFERENCES connections(id),
    INDEX idx_status (status)
);
```

#### job_logs
```sql
CREATE TABLE job_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    loggable_type VARCHAR(255) NOT NULL,
    loggable_id BIGINT NOT NULL,
    level ENUM('info', 'warning', 'error') NOT NULL,
    message TEXT NOT NULL,
    context JSON NULL,
    created_at TIMESTAMP,
    INDEX idx_loggable (loggable_type, loggable_id),
    INDEX idx_created_at (created_at)
);
```

### Credential Storage Format

#### S3 Source Connection
```json
{
    "access_key": "AKIA...",
    "secret_key": "...",
    "region": "us-east-1",
    "bucket": "my-bucket"
}
```

#### MongoDB Connection
```json
{
    "uri": "mongodb://user:pass@host:27017",
    "database": "mydb",
    "auth_database": "admin"
}
```

#### Google Drive Connection
```json
{
    "access_token": "ya29...",
    "refresh_token": "1//...",
    "folder_id": "1ABC..."
}
```

## Error Handling

### Strategy

1. **Connection Validation Errors**: Return validation errors to user with specific failure reason
2. **Backup Job Failures**: Log error, update operation status to 'failed', store error message
3. **Network Timeouts**: Implement retry logic with exponential backoff (3 attempts)
4. **Insufficient Storage**: Check available space before starting backup, fail gracefully
5. **Credential Expiry**: Detect OAuth token expiry, prompt user to re-authenticate
6. **Partial Backups**: If cancelled/paused, mark as incomplete and allow cleanup or resume

### Error Logging

- All exceptions logged to Laravel log with context
- User-facing errors displayed in JobLog with 'error' level
- Critical errors trigger notification (future enhancement)

## Testing Strategy

### Unit Tests
- Service layer methods (ConnectionService, BackupService, RestoreService)
- Adapter implementations (mock external API calls)
- Model relationships and scopes
- Encryption/decryption of credentials

### Feature Tests
- Connection CRUD operations
- Backup initiation and status updates
- Restore operations
- Authentication and authorization
- API endpoints for log polling

### Integration Tests
- End-to-end backup flow with mocked S3/MongoDB
- Queue job execution
- Log streaming and polling

### Manual Testing
- Real S3 bucket backup and restore
- Real MongoDB backup and restore
- Google Drive upload
- UI responsiveness and terminal log updates
- Pause/cancel/resume functionality

## Security Considerations

1. **Credential Encryption**: Use Laravel's built-in encryption for credentials at rest
2. **HTTPS Only**: Enforce HTTPS in production for data in transit
3. **CSRF Protection**: Laravel's CSRF middleware enabled for all forms
4. **Authentication**: All routes protected by auth middleware
5. **Input Validation**: Validate all user inputs using Form Requests
6. **SQL Injection**: Use Eloquent ORM and parameterized queries
7. **File Path Traversal**: Sanitize all file paths and use storage facades
8. **Rate Limiting**: Apply rate limiting to backup initiation endpoints
9. **Audit Logging**: Log all connection changes and backup operations

## Performance Considerations

1. **Queue Workers**: Run multiple queue workers for parallel backup processing
2. **Chunked Uploads**: Use multipart uploads for large files to S3/Google Drive
3. **Database Indexing**: Index frequently queried columns (status, created_at)
4. **Log Pagination**: Limit log queries to recent entries, paginate older logs
5. **Polling Optimization**: 10-second polling interval balances real-time feel with server load
6. **Temporary File Cleanup**: Scheduled job to remove old temporary backup files
7. **Archive Compression**: Use gzip compression to reduce storage and transfer time

## Deployment Considerations

1. **Environment Variables**: Store sensitive config in .env (queue connection, storage paths)
2. **Queue Worker**: Supervisor process to keep queue workers running
3. **Storage**: Ensure sufficient disk space for temporary backup files
4. **External Dependencies**: Install AWS CLI, mongodump, Google Drive CLI tools
5. **Cron Jobs**: Schedule cleanup tasks and queue worker monitoring
6. **Database Migrations**: Run migrations on deployment
7. **Asset Compilation**: Build frontend assets with npm run build
