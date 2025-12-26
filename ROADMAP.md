# Product Roadmap

## Plans & Billing
- [ ] Plans table with limits (backup size, sources, destinations, frequency, bandwidth cap)
- [ ] Stripe/Paddle integration for subscriptions
- [ ] Usage tracking (monthly bandwidth per customer)
- [ ] Plan enforcement at connection creation
- [ ] Plan enforcement at schedule creation
- [ ] Backup size check before upload (reject if over plan limit)
- [ ] Bandwidth tracking per backup
- [ ] Soft limit warning emails (80% bandwidth used)
- [ ] Hard limit enforcement (pause backups at 100%)
- [ ] Upgrade prompts when hitting limits

## Core Backup Features
- [x] MongoDB backup adapter
- [x] S3 backup adapter (source)
- [x] Google Drive destination adapter
- [x] S3 destination adapter
- [x] Local storage destination adapter
- [x] Backup scheduling (cron-based)
- [x] Backup retention policies
- [x] Backup cleanup service
- [x] Backup operation logging
- [x] Backup pause/resume/cancel
- [ ] Backup success/failure email notifications
- [ ] Incremental backups

## Restore Features
- [x] MongoDB restore adapter
- [x] S3 restore adapter
- [x] Local storage restore adapter
- [x] Restore operation logging

## Connection Management
- [x] MongoDB connection support
- [x] S3 connection support
- [x] Google Drive connection support (OAuth)
- [x] Local storage connection support
- [x] Connection validation on create/update
- [x] Connection credential encryption
- [x] Connection duplicate feature

## User Management
- [x] User registration
- [x] User login/logout
- [x] Password reset flow
- [ ] Email verification
- [ ] Two-factor authentication
- [ ] Team members / multi-user

## Dashboard & UI
- [x] Backup history list
- [x] Backup detail view with logs
- [x] Connection management UI
- [x] Schedule management UI
- [x] Retention settings UI
- [ ] Usage stats dashboard (bandwidth, backup count)
- [ ] Plan usage indicators

## Reliability & Monitoring
- [x] Queue-based backup execution
- [x] Failed job handling
- [ ] Queue worker monitoring (Supervisor/Horizon)
- [ ] Health check endpoint
- [ ] Error alerting (Slack/email to admin)
- [ ] Uptime monitoring integration

## Security
- [x] Encrypted credentials storage
- [x] HTTPS support
- [x] Input validation
- [ ] Rate limiting on API/auth endpoints
- [ ] API authentication (Sanctum)

## Legal & Marketing
- [ ] Landing page
- [ ] Pricing page
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Documentation / Help center

## Future Features
- [ ] MySQL/PostgreSQL backup adapters
- [ ] Dropbox destination adapter
- [ ] OneDrive destination adapter
- [ ] Webhook notifications
- [ ] Public API access
- [ ] Multiple server regions
- [ ] White-label / reseller support
