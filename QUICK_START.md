# Quick Start Guide - Backup Management System

## ✅ System Status

All tasks completed successfully! The Backup Management System is ready to use.

## 🔐 Default Login Credentials

A test user has been created for you:

- **Email**: `admin@example.com`
- **Password**: `password`

You can also register a new account at the registration page.

## 🚀 Getting Started

### 1. Start the Queue Worker

The queue worker processes backup and restore jobs asynchronously:

```bash
php artisan queue:work
```

Keep this running in a separate terminal window.

### 2. Start the Development Server

```bash
php artisan serve
```

The application will be available at: http://localhost:8000

### 3. Create Your First Connection

1. Register/Login to the application
2. Navigate to **Connections** in the sidebar
3. Click **Add Connection**
4. Choose a connection type:
   - **S3 Source**: For backing up S3 buckets
   - **MongoDB**: For backing up MongoDB databases
   - **S3 Destination**: For storing backups in S3
   - **Google Drive**: For storing backups in Google Drive

### 4. Create Your First Backup

1. Navigate to **Backups** in the sidebar
2. Click **New Backup**
3. Select a source connection (S3 or MongoDB)
4. Select a destination connection (S3 or Google Drive)
5. Click **Start Backup**
6. Monitor progress in real-time!

## 📋 Available Routes

### Web Routes
- `/dashboard` - Main dashboard with statistics
- `/connections` - Manage connections
- `/backups` - View and manage backup operations
- `/restores` - View restore operations

### API Routes
- `GET /api/backups/{id}/logs` - Poll backup logs
- `GET /api/restores/{id}/logs` - Poll restore logs

## 🔧 Configuration

### Environment Variables

Make sure these are set in your `.env` file:

```env
# Queue Configuration
QUEUE_CONNECTION=database

# AWS (if using S3)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_DEFAULT_REGION=us-east-1
```

### External Tools Required

- **mongodump/mongorestore**: For MongoDB backups
  ```bash
  # macOS
  brew install mongodb-database-tools
  
  # Ubuntu/Debian
  sudo apt-get install mongodb-database-tools
  ```

## 🎯 Key Features

✅ Multi-source backups (S3, MongoDB)
✅ Multi-destination storage (S3, Google Drive)
✅ Real-time log monitoring
✅ Pause/resume/cancel operations
✅ Restore functionality
✅ Encrypted credential storage
✅ Queue-based async processing

## 🧪 Testing the System

### Test S3 Backup
1. Create an S3 source connection with valid AWS credentials
2. Create an S3 destination connection
3. Initiate a backup
4. Watch the terminal logs in real-time

### Test MongoDB Backup
1. Ensure mongodump is installed
2. Create a MongoDB source connection
3. Create a destination connection (S3 or Google Drive)
4. Initiate a backup

### Test Restore
1. Navigate to a completed backup
2. Click the restore button
3. Select destination and configure options
4. Monitor the restore process

## 📊 Monitoring

### Dashboard
- View total backups, success rate, and failures
- See recent backup operations
- Quick access to create new backups

### Backup Details Page
- Real-time terminal logs
- Operation status
- Pause/cancel/resume controls
- Archive size and metadata

## 🔄 Scheduled Tasks

The system includes automated cleanup:

```bash
# Run scheduler (for production)
php artisan schedule:work

# Or add to crontab:
* * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
```

Cleanup tasks:
- Remove temporary files older than 7 days
- Remove job logs older than 30 days

## 🐛 Troubleshooting

### Queue Jobs Not Processing
```bash
# Check if queue worker is running
php artisan queue:work

# Check failed jobs
php artisan queue:failed
```

### Build Errors
```bash
# Rebuild frontend assets
npm run build
```

### Database Issues
```bash
# Check database status
php artisan db:show

# Re-run migrations if needed
php artisan migrate:fresh
```

## 📚 Next Steps

1. Set up your first connections
2. Test backup operations
3. Configure scheduled tasks for production
4. Set up Supervisor for queue workers in production
5. Configure proper AWS IAM permissions
6. Set up Google OAuth for Google Drive

## 🎉 You're Ready!

The Backup Management System is fully functional and ready to manage your backups across multiple sources and destinations.

For detailed documentation, see `README_BACKUP_SYSTEM.md`
