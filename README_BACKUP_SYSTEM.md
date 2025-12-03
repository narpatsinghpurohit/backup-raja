# Backup Management System

A centralized web application built with Laravel and Inertia.js for managing, executing, monitoring, and restoring backups across multiple data sources (S3 buckets and MongoDB instances) to various storage destinations (Google Drive and S3).

## Features

- **Multi-Source Backups**: Support for S3 and MongoDB data sources
- **Multi-Destination Storage**: Store backups in S3 or Google Drive
- **Real-Time Monitoring**: Terminal-like log viewer with automatic updates
- **Backup Control**: Pause, cancel, and resume backup operations
- **Restore Functionality**: Restore backups to original or different destinations
- **Secure Credential Storage**: Encrypted storage of connection credentials
- **Queue-Based Processing**: Asynchronous backup execution using Laravel queues

## Requirements

- PHP 8.2+
- Composer
- Node.js & NPM
- SQLite/MySQL/PostgreSQL
- AWS CLI (for S3 operations)
- mongodump/mongorestore (for MongoDB backups)

## Installation

1. Clone the repository and install dependencies:

```bash
composer install
npm install
```

2. Copy the environment file and generate application key:

```bash
cp .env.example .env
php artisan key:generate
```

3. Configure your database in `.env`:

```env
DB_CONNECTION=sqlite
# or for MySQL/PostgreSQL
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=backup_manager
# DB_USERNAME=root
# DB_PASSWORD=
```

4. Configure queue connection:

```env
QUEUE_CONNECTION=database
```

5. Run migrations:

```bash
php artisan migrate
```

6. Build frontend assets:

```bash
npm run build
# or for development
npm run dev
```

## Configuration

### AWS Credentials

Add your AWS credentials to `.env`:

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=us-east-1
```

### Google Drive OAuth

1. Create a project in Google Cloud Console
2. Enable Google Drive API
3. Create OAuth 2.0 credentials
4. Configure the OAuth consent screen
5. Add credentials when creating a Google Drive connection in the app

### MongoDB

Ensure `mongodump` and `mongorestore` are installed and available in your PATH:

```bash
# macOS
brew install mongodb-database-tools

# Ubuntu/Debian
sudo apt-get install mongodb-database-tools

# Verify installation
mongodump --version
mongorestore --version
```

## Default Login Credentials

A test user is available for immediate access:

- **Email**: `admin@example.com`
- **Password**: `password`

To create this user, run:
```bash
php artisan db:seed --class=TestUserSeeder
```

## Running the Application

1. Start the development server:

```bash
php artisan serve
```

2. Start the queue worker (in a separate terminal):

```bash
php artisan queue:work
```

3. (Optional) Start the scheduler for cleanup tasks:

```bash
php artisan schedule:work
```

## Usage

### Creating Connections

1. Navigate to **Connections** in the sidebar
2. Click **Add Connection**
3. Select connection type (S3, MongoDB, Google Drive, or S3 Destination)
4. Enter credentials
5. The system will validate the connection before saving

### Creating Backups

1. Navigate to **Backups** in the sidebar
2. Click **New Backup**
3. Select a source connection (S3 or MongoDB)
4. Select a destination connection (S3 or Google Drive)
5. Click **Start Backup**
6. Monitor progress in real-time on the backup details page

### Restoring Backups

1. Navigate to a completed backup operation
2. Click **Restore** button
3. Select destination connection
4. Configure restore options (optional)
5. Click **Start Restore**
6. Monitor progress in real-time

### Managing Operations

- **Pause**: Temporarily pause a running backup (S3 only)
- **Resume**: Continue a paused backup
- **Cancel**: Stop and clean up a backup operation

## Scheduled Tasks

The system includes automated cleanup tasks:

- **Temporary Files**: Removes backup files older than 7 days
- **Old Logs**: Removes job logs older than 30 days

These run daily via Laravel's scheduler. In production, add to crontab:

```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

## Security

- All connection credentials are encrypted at rest
- Authentication required for all routes
- CSRF protection enabled
- Rate limiting on backup/restore endpoints
- Input validation using Form Requests

## Troubleshooting

### Queue Jobs Not Processing

Ensure the queue worker is running:

```bash
php artisan queue:work
```

For production, use a process manager like Supervisor.

### MongoDB Backup Fails

Verify mongodump is installed and accessible:

```bash
which mongodump
mongodump --version
```

### S3 Connection Fails

Check AWS credentials and bucket permissions. The IAM user needs:
- `s3:ListBucket`
- `s3:GetObject`
- `s3:PutObject`

### Google Drive Upload Fails

Ensure OAuth tokens are valid. If expired, re-create the connection with fresh tokens.

## Development

### Running Tests

```bash
php artisan test
```

### Code Style

```bash
./vendor/bin/pint
```

### Frontend Development

```bash
npm run dev
```

## License

This project is open-sourced software licensed under the MIT license.
