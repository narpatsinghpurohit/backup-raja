# Local Storage Feature

## Overview

Added **Local Storage** as a new backup destination option, allowing users to store backups directly on the Laravel application server using Laravel's Storage facade.

## What Was Added

### Backend Components

1. **LocalStorageDestinationAdapter** (`app/Services/Adapters/LocalStorageDestinationAdapter.php`)
   - Uploads backup archives to Laravel storage disks
   - Supports both `local` and `public` disks
   - Configurable storage path

2. **LocalStorageRestoreAdapter** (`app/Services/Adapters/LocalStorageRestoreAdapter.php`)
   - Restores backups from local storage
   - Extracts archives and uploads files to specified storage location
   - Handles cleanup of temporary files

3. **LocalStorageConnectionValidator** (`app/Services/Validators/LocalStorageConnectionValidator.php`)
   - Validates storage disk configuration
   - Tests write permissions
   - Creates storage directories if needed

4. **Updated Services**
   - `ConnectionValidatorFactory` - Added local_storage case
   - `BackupExecutor` - Added local_storage destination adapter
   - `RestoreExecutor` - Added local_storage restore adapter

5. **Updated Form Requests**
   - `StoreConnectionRequest` - Added validation for local_storage credentials
   - `UpdateConnectionRequest` - Added validation for local_storage credentials

6. **Updated Controllers**
   - `ConnectionController` - Added local_storage credential handling
   - `BackupController` - Included local_storage in destinations query
   - `RestoreController` - Included local_storage in destinations query

### Frontend Components

1. **Connections/Create.tsx**
   - Added "Local Storage" option to connection type dropdown
   - Added form fields for disk selection (local/public) and storage path
   - Added validation error display for local storage fields

2. **Connections/Edit.tsx**
   - Added local storage credential editing support
   - Pre-fills disk and path values
   - Includes local storage in type label mapping

3. **Connections/Index.tsx**
   - Added "Local Storage" label to type display

## Configuration

### Connection Credentials

When creating a Local Storage connection, you need to provide:

- **Storage Disk**: Choose between:
  - `local` - Stores in `storage/app/`
  - `public` - Stores in `storage/app/public/`
  
- **Storage Path**: Relative path within the disk (e.g., `backups`, `backups/mongodb`)

### Example Configuration

```json
{
  "disk": "local",
  "path": "backups"
}
```

This will store backups in `storage/app/backups/`

## Usage

### Creating a Local Storage Connection

1. Navigate to **Connections** → **Add Connection**
2. Select **Local Storage** as the connection type
3. Choose a storage disk (local or public)
4. Enter a storage path (e.g., "backups")
5. Click **Create Connection**

The system will:
- Validate the disk exists in Laravel config
- Create the directory if it doesn't exist
- Test write permissions
- Mark the connection as active if successful

### Backing Up to Local Storage

1. Create a backup operation
2. Select your data source (S3 or MongoDB)
3. Select your Local Storage connection as the destination
4. Start the backup

The backup archive will be stored in the configured storage location.

### Restoring from Local Storage

1. Navigate to a completed backup
2. Click **Restore**
3. Select a destination connection
4. Configure restore options
5. Start the restore

## Benefits

- **No External Dependencies**: No need for AWS, Google Drive, or other cloud services
- **Fast Transfers**: Local disk I/O is faster than network transfers
- **Cost-Effective**: No cloud storage costs
- **Development-Friendly**: Perfect for local development and testing
- **Simple Configuration**: Just specify disk and path

## Storage Locations

- **Local Disk**: `storage/app/{path}/`
- **Public Disk**: `storage/app/public/{path}/`

## Security Considerations

- Local storage connections don't require sensitive credentials
- Ensure proper file permissions on the storage directory
- Consider disk space limitations
- For production, ensure backups are also replicated to off-site storage

## Limitations

- Backups are stored on the same server as the application
- No automatic off-site replication
- Limited by server disk space
- Not suitable as the only backup destination for production (use in combination with cloud storage)

## Best Practices

1. **Use for Development**: Great for local testing without cloud credentials
2. **Temporary Storage**: Use as intermediate storage before transferring to cloud
3. **Monitor Disk Space**: Set up alerts for low disk space
4. **Regular Cleanup**: Implement retention policies to remove old backups
5. **Combine with Cloud**: Use local storage + cloud storage for redundancy

## Future Enhancements

Potential improvements:
- Support for additional Laravel storage drivers (FTP, SFTP, etc.)
- Automatic cleanup of old backups based on retention policy
- Disk space monitoring and alerts
- Compression options for local storage
- Symlink support for public disk backups
