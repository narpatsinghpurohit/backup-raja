# 👑 Backup Raja

**The King of Backup Management**

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](https://opensource.org/licenses/MIT)
[![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?logo=laravel)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)

> Centralized backup orchestration for MongoDB and S3. Monitor, manage, and restore your data with real-time visibility. **No command-line required.**

![Backup Raja Dashboard](https://via.placeholder.com/1200x600/FF6B35/FFFFFF?text=Backup+Raja+Dashboard)

## 🎯 Why Backup Raja?

Every tech founder faces the same nightmare: **"Is my data backed up?"**

Backup Raja gives you **complete peace of mind** with:

- 👀 **Real-time monitoring** - Watch every backup happen live
- 🎯 **One-click operations** - No SSH, no commands, just clicks
- 🔒 **Enterprise security** - Encrypted credentials, CSRF protection, rate limiting
- 📊 **Detailed logging** - Know exactly what's being backed up
- ⚡ **Async processing** - Never block your workflow
- 🌍 **Multi-destination** - S3, Google Drive, Local Storage

## ✨ Features

### 🎬 Real-Time Monitoring
Watch your backups happen in real-time with terminal-like logs. See every collection, every file, compression ratios, upload progress - everything.

```
[20:38:50] [INFO] Backup started
[20:38:50] [INFO] Source: Production DB (mongodb)
[20:38:50] [INFO] Database: my_production_db
[20:38:52] [INFO] Dumping collection: users (1,234 documents)
[20:38:53] [INFO] Dumping collection: orders (5,678 documents)
[20:38:55] [INFO] Total collections: 15
[20:38:55] [INFO] Dump size: 234.5 MB
[20:38:58] [INFO] Compressed size: 89.2 MB (61.9% compression)
[20:39:03] [INFO] Backup completed successfully
```

### 🗄️ Multi-Source Support
- **MongoDB** - Full database backups with mongodump
- **S3 Buckets** - Complete bucket synchronization
- More sources coming soon!

### ☁️ Flexible Destinations
- **S3** - Store in any S3-compatible storage
- **Google Drive** - Upload to your Google Drive
- **Local Storage** - Keep backups on your server
- Mix and match as needed!

### 🔄 One-Click Restore
Restore backups to:
- Original location
- Different database/bucket
- Different server entirely

With full integrity verification!

### 🎛️ Operation Control
- **Pause** backups mid-flight
- **Cancel** operations cleanly
- **Resume** paused backups
- All from the UI!

### 📈 Dashboard & Analytics
- Total backups count
- Success/failure rates
- Recent operations
- Storage usage
- Quick actions

## 🚀 Quick Start

### Prerequisites

- PHP 8.2+
- Composer
- Node.js & NPM
- SQLite/MySQL/PostgreSQL
- MongoDB tools (for MongoDB backups)
- AWS CLI (for S3 backups)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/backup-raja.git
cd backup-raja

# Install dependencies
composer install
npm install

# Setup environment
cp .env.example .env
php artisan key:generate

# Configure database
php artisan migrate

# Build frontend
npm run build

# Create test user
php artisan db:seed --class=TestUserSeeder
```

### Running

```bash
# Terminal 1: Start the server
php artisan serve

# Terminal 2: Start the queue worker
php artisan queue:work

# Terminal 3 (optional): Watch frontend changes
npm run dev
```

Visit `http://localhost:8000` and login with:
- **Email**: `admin@example.com`
- **Password**: `password`

## 📖 Usage

### 1. Create Connections

Navigate to **Connections** → **Add Connection**

**MongoDB Example:**
```
Name: Production Database
Type: MongoDB
URI: mongodb+srv://user:pass@cluster.mongodb.net
Database: my_production_db
```

**S3 Example:**
```
Name: Production Bucket
Type: S3 Source
Access Key: AKIA...
Secret Key: ****
Region: us-east-1
Bucket: my-prod-bucket
```

**Local Storage Example:**
```
Name: Local Backups
Type: Local Storage
Disk: local
Path: backups/production
```

### 2. Create Backup

Navigate to **Backups** → **New Backup**

1. Select source (MongoDB or S3)
2. Select destination (S3, Google Drive, or Local)
3. Click **Start Backup**
4. Watch it happen in real-time! 🎬

### 3. Restore Backup

1. Navigate to a completed backup
2. Click **Restore**
3. Select destination
4. Configure options
5. Click **Start Restore**

## 🏗️ Architecture

```
┌─────────────────┐
│  React/Inertia  │ ← Beautiful UI with real-time updates
│   Components    │
└────────┬────────┘
         │
┌────────▼────────┐
│    Laravel      │ ← RESTful API & Inertia responses
│   Controllers   │
└────────┬────────┘
         │
┌────────▼────────┐
│    Services     │ ← Business logic layer
│  - BackupService│
│  - RestoreService│
└────────┬────────┘
         │
┌────────▼────────┐
│  Queue Jobs     │ ← Async processing
│  - BackupJob    │
│  - RestoreJob   │
└────────┬────────┘
         │
┌────────▼────────┐
│   Adapters      │ ← Pluggable integrations
│  - S3Adapter    │
│  - MongoAdapter │
│  - DriveAdapter │
└─────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **Laravel 12** - Modern PHP framework
- **PHP 8.2+** - Latest PHP features
- **Queue System** - Async job processing
- **Eloquent ORM** - Database abstraction
- **Service Layer** - Clean architecture

### Frontend
- **React 19** - Latest React with hooks
- **TypeScript** - Type-safe JavaScript
- **Inertia.js** - Seamless SPA experience
- **shadcn/ui** - Beautiful components
- **Tailwind CSS 4.0** - Utility-first styling

### Integrations
- **AWS SDK** - S3 operations
- **MongoDB PHP** - Database backups
- **Google API** - Drive uploads

## 🔒 Security

- ✅ Encrypted credential storage (Laravel encryption)
- ✅ Authentication required for all routes
- ✅ CSRF protection on all forms
- ✅ Rate limiting on backup endpoints
- ✅ Input validation with Form Requests
- ✅ SQL injection protection (Eloquent ORM)
- ✅ Password masking in logs
- ✅ Secure session management

## 📊 Performance

- ⚡ Queue-based async processing
- ⚡ Chunked uploads for large files
- ⚡ Database indexing on key columns
- ⚡ Efficient log pagination
- ⚡ 10-second polling (configurable)
- ⚡ Gzip compression for archives
- ⚡ Automatic cleanup of temp files

## 🎨 Screenshots

### Dashboard
![Dashboard](https://via.placeholder.com/800x500/FF6B35/FFFFFF?text=Dashboard)

### Real-Time Logs
![Logs](https://via.placeholder.com/800x500/FF6B35/FFFFFF?text=Real-Time+Logs)

### Connections
![Connections](https://via.placeholder.com/800x500/FF6B35/FFFFFF?text=Connections)

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Install dependencies
composer install
npm install

# Run tests
php artisan test

# Code style
./vendor/bin/pint

# Frontend dev server
npm run dev
```

## 📝 Roadmap

- [ ] **Scheduled Backups** - Cron-based automatic backups
- [ ] **Email Notifications** - Get notified on success/failure
- [ ] **Slack Integration** - Backup alerts in Slack
- [ ] **Backup Retention Policies** - Auto-delete old backups
- [ ] **Incremental Backups** - Only backup changes
- [ ] **Multi-tenancy** - Team/organization support
- [ ] **PostgreSQL Support** - Add PostgreSQL backups
- [ ] **MySQL Support** - Add MySQL backups
- [ ] **FTP/SFTP Support** - More destination options
- [ ] **Backup Encryption** - Encrypt archives at rest
- [ ] **API Access** - RESTful API for automation
- [ ] **Webhooks** - Trigger external actions
- [ ] **Backup Verification** - Automated integrity checks
- [ ] **Docker Support** - One-command deployment

## 🐛 Known Issues

- MongoDB backups require `mongodump` CLI tool
- S3 backups require AWS CLI for large files
- Google Drive has OAuth token expiry (needs refresh)

## 📄 License

This project is open-sourced software licensed under the [MIT license](LICENSE).

## 💬 Support

- 📧 Email: support@backupraja.com
- 💬 Discord: [Join our community](https://discord.gg/backupraja)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/backup-raja/issues)
- 📖 Docs: [Documentation](https://docs.backupraja.com)

## 🙏 Acknowledgments

Built with ❤️ using:
- [Laravel](https://laravel.com)
- [React](https://reactjs.org)
- [Inertia.js](https://inertiajs.com)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)

## ⭐ Star History

If you find Backup Raja useful, please consider giving it a star! ⭐

---

<div align="center">
  <strong>Made with 👑 by developers, for developers</strong>
  <br />
  <sub>Backup Raja - The King of Backup Management</sub>
</div>
