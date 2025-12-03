# Backup System Debugging Guide

## Quick Status Check

Use the custom artisan command to check backup status:

```bash
# View all recent backups
php artisan backup:status

# View detailed logs for a specific backup
php artisan backup:status {id}
```

## Common Issues and Solutions

### 1. API Authentication Errors

**Symptom:** API calls to `/api/backups/{id}/logs` redirect to `/login`

**Cause:** API routes use stateless middleware by default, but Inertia uses session-based auth

**Solution:** API routes now use `['web', 'auth']` middleware to support session authentication

### 2. Logs Not Appearing in UI

**Check:**
1. Verify logs exist in database:
   ```bash
   php artisan backup:status {id}
   ```

2. Check browser console for API errors

3. Verify you're logged in (session-based auth)

### 3. Queue Jobs Not Processing

**Check if queue worker is running:**
```bash
# Should show queue:work process
ps aux | grep "queue:work"
```

**Start queue worker:**
```bash
php artisan queue:work
```

**Check failed jobs:**
```bash
php artisan queue:failed
```

**Retry failed jobs:**
```bash
php artisan queue:retry all
```

### 4. Backup Job Fails Silently

**Check the backup operation status:**
```bash
php artisan backup:status {id}
```

**Look for error messages in:**
- Operation logs (via command above)
- Laravel logs: `storage/logs/laravel.log`
- Queue worker output

### 5. MongoDB Connection Issues

**Common errors:**
- TLS certificate verification failed
- Connection timeout
- Authentication failed

**Solutions:**
- Ensure MongoDB URI is correct
- Check if mongodump is installed: `mongodump --version`
- For Atlas, ensure IP is whitelisted
- TLS issues are handled automatically by the validator

### 6. Local Storage Issues

**Check permissions:**
```bash
# Ensure storage directory is writable
ls -la storage/app/
```

**Create directories if needed:**
```bash
mkdir -p storage/app/backups
chmod -R 775 storage/app/backups
```

## Monitoring Backup Operations

### Real-time Queue Monitoring

```bash
# Watch queue worker output
php artisan queue:work --verbose
```

### Database Queries

```bash
# Check recent backups
php artisan tinker
>>> App\Models\BackupOperation::latest()->take(5)->get(['id', 'status', 'created_at'])

# Check logs for a backup
>>> App\Models\JobLog::where('loggable_id', 2)->where('loggable_type', 'App\Models\BackupOperation')->get(['level', 'message', 'created_at'])
```

### Log Files

```bash
# Laravel application logs
tail -f storage/logs/laravel.log

# Queue worker logs (if using supervisor)
tail -f /var/log/supervisor/queue-worker.log
```

## Testing Connections

### Test S3 Connection
```bash
php artisan tinker
>>> $conn = App\Models\Connection::find(1);
>>> $validator = new App\Services\Validators\S3ConnectionValidator();
>>> $validator->validate($conn->credentials);
```

### Test MongoDB Connection
```bash
php artisan tinker
>>> $conn = App\Models\Connection::find(2);
>>> $validator = new App\Services\Validators\MongoConnectionValidator();
>>> $validator->validate($conn->credentials);
```

### Test Local Storage Connection
```bash
php artisan tinker
>>> $conn = App\Models\Connection::find(3);
>>> $validator = new App\Services\Validators\LocalStorageConnectionValidator();
>>> $validator->validate($conn->credentials);
```

## Performance Monitoring

### Check Backup Sizes
```bash
php artisan backup:status
```

### Check Storage Usage
```bash
# Local storage
du -sh storage/app/backups/

# Database size
php artisan db:show
```

### Cleanup Old Backups
```bash
# Remove backups older than 7 days
php artisan backup:cleanup

# Remove old logs
php artisan logs:cleanup
```

## Troubleshooting Checklist

When a backup fails, check in this order:

1. ✅ Is the queue worker running?
2. ✅ Does the connection validate successfully?
3. ✅ Are there any error logs in the operation?
4. ✅ Is there enough disk space?
5. ✅ Are external tools installed (mongodump, aws cli)?
6. ✅ Are credentials still valid?
7. ✅ Is the network accessible (for cloud services)?

## Useful Commands Summary

```bash
# Check backup status
php artisan backup:status [id]

# Start queue worker
php artisan queue:work

# Check failed jobs
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all

# Clear cache
php artisan cache:clear
php artisan config:clear

# Check database
php artisan db:show

# Interactive shell
php artisan tinker
```

## Getting Help

If you're still stuck:

1. Check the operation logs: `php artisan backup:status {id}`
2. Check Laravel logs: `storage/logs/laravel.log`
3. Enable debug mode: Set `APP_DEBUG=true` in `.env`
4. Check the browser console for frontend errors
5. Verify all external dependencies are installed
