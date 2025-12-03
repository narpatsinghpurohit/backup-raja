# 🔐 Login Information

## Default Test Account

A test administrator account has been created for you:

```
Email:    admin@example.com
Password: password
```

## Quick Access

1. Start the application:
   ```bash
   php artisan serve
   ```

2. Open your browser to: **http://localhost:8000**

3. Click **Login** and use the credentials above

4. You'll be redirected to the dashboard

## Creating Additional Users

### Option 1: Register via UI
- Click "Register" on the login page
- Fill in your details
- Email verification is optional in development

### Option 2: Create via Tinker
```bash
php artisan tinker
```

Then run:
```php
User::create([
    'name' => 'Your Name',
    'email' => 'your@email.com',
    'password' => Hash::make('your-password'),
    'email_verified_at' => now(),
]);
```

### Option 3: Run the Seeder Again
The seeder will create the default admin user:
```bash
php artisan db:seed --class=TestUserSeeder
```

## Security Notes

⚠️ **Important for Production:**
- Change the default password immediately
- Remove or disable the TestUserSeeder
- Use strong passwords
- Enable email verification
- Consider implementing 2FA (Laravel Fortify supports this)

## Troubleshooting

### "These credentials do not match our records"
- Make sure you ran the seeder: `php artisan db:seed --class=TestUserSeeder`
- Check the database: `php artisan tinker --execute="User::all();"`

### Email Verification Required
If email verification is enabled, you can verify manually:
```bash
php artisan tinker --execute="User::first()->markEmailAsVerified();"
```

### Reset Password
```bash
php artisan tinker
```
Then:
```php
$user = User::where('email', 'admin@example.com')->first();
$user->password = Hash::make('new-password');
$user->save();
```

## Next Steps

Once logged in:
1. ✅ Navigate to **Connections** to add your first data source
2. ✅ Create a backup operation
3. ✅ Monitor it in real-time
4. ✅ Test the restore functionality

Happy backing up! 🚀
