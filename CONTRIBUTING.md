# Contributing to Backup Raja 👑

First off, thank you for considering contributing to Backup Raja! It's people like you that make Backup Raja such a great tool for the developer community.

## 🎯 Code of Conduct

This project and everyone participating in it is governed by our commitment to creating a welcoming and inclusive environment. Be respectful, be kind, and help us build something amazing together.

## 🚀 How Can I Contribute?

### Reporting Bugs 🐛

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if relevant**
- **Include your environment details** (OS, PHP version, Laravel version, etc.)

### Suggesting Enhancements ✨

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any similar features in other tools**

### Pull Requests 🔧

1. **Fork the repo** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Write clear commit messages**
6. **Submit a pull request**

## 💻 Development Setup

### Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+ & NPM
- SQLite/MySQL/PostgreSQL
- MongoDB tools (optional, for MongoDB backups)
- AWS CLI (optional, for S3 backups)

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/backup-raja.git
cd backup-raja

# Install dependencies
composer install
npm install

# Setup environment
cp .env.example .env
php artisan key:generate

# Create database
touch database/database.sqlite

# Run migrations
php artisan migrate

# Seed test data
php artisan db:seed --class=TestUserSeeder

# Build frontend
npm run dev
```

### Running the Application

```bash
# Terminal 1: Laravel server
php artisan serve

# Terminal 2: Queue worker
php artisan queue:work

# Terminal 3: Vite dev server
npm run dev
```

## 📝 Coding Standards

### PHP/Laravel

- Follow [PSR-12](https://www.php-fig.org/psr/psr-12/) coding standards
- Use Laravel Pint for code formatting: `./vendor/bin/pint`
- Write descriptive variable and method names
- Add PHPDoc blocks for classes and methods
- Keep methods focused and small
- Use type hints and return types

```php
// Good ✅
public function createBackup(Connection $source, Connection $destination): BackupOperation
{
    // Implementation
}

// Bad ❌
public function create($s, $d)
{
    // Implementation
}
```

### TypeScript/React

- Use TypeScript for all new components
- Follow React hooks best practices
- Use functional components
- Keep components small and focused
- Use meaningful prop names
- Add proper TypeScript interfaces

```typescript
// Good ✅
interface BackupCardProps {
  backup: BackupOperation;
  onRestore: (id: number) => void;
}

export function BackupCard({ backup, onRestore }: BackupCardProps) {
  // Implementation
}

// Bad ❌
export function Card(props: any) {
  // Implementation
}
```

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters
- Reference issues and pull requests after the first line

```bash
# Good ✅
git commit -m "Add MongoDB connection validation

- Implement connection test before saving
- Add error handling for invalid URIs
- Update tests

Fixes #123"

# Bad ❌
git commit -m "fixed stuff"
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test tests/Feature/BackupTest.php

# Run with coverage
php artisan test --coverage
```

### Writing Tests

- Write tests for new features
- Update tests when modifying existing features
- Aim for high test coverage
- Use descriptive test names

```php
public function test_backup_can_be_created_with_valid_connections(): void
{
    $source = Connection::factory()->create(['type' => 'mongodb']);
    $destination = Connection::factory()->create(['type' => 's3_destination']);
    
    $response = $this->post('/backups', [
        'source_connection_id' => $source->id,
        'destination_connection_id' => $destination->id,
    ]);
    
    $response->assertRedirect();
    $this->assertDatabaseHas('backup_operations', [
        'source_connection_id' => $source->id,
        'destination_connection_id' => $destination->id,
    ]);
}
```

## 📚 Documentation

- Update README.md for new features
- Add inline comments for complex logic
- Update API documentation if applicable
- Create/update migration guides for breaking changes

## 🎨 UI/UX Guidelines

- Follow the existing design system
- Use shadcn/ui components when possible
- Maintain consistent spacing and colors
- Ensure mobile responsiveness
- Test in both light and dark modes
- Add loading states for async operations
- Provide clear error messages

## 🔍 Code Review Process

1. **Automated checks** must pass (tests, linting, etc.)
2. **At least one maintainer** must approve
3. **All conversations** must be resolved
4. **Documentation** must be updated
5. **No merge conflicts** with main branch

## 🏗️ Project Structure

```
backup-raja/
├── app/
│   ├── Http/Controllers/     # Request handlers
│   ├── Services/             # Business logic
│   ├── Jobs/                 # Queue jobs
│   ├── Models/               # Eloquent models
│   └── Services/Adapters/    # External integrations
├── resources/
│   └── js/
│       ├── pages/            # Inertia pages
│       ├── components/       # React components
│       └── layouts/          # Layout components
├── database/
│   ├── migrations/           # Database migrations
│   └── seeders/              # Database seeders
└── tests/
    ├── Feature/              # Feature tests
    └── Unit/                 # Unit tests
```

## 🎯 Areas We Need Help

- [ ] Writing tests for existing features
- [ ] Improving documentation
- [ ] Adding new backup sources (PostgreSQL, MySQL)
- [ ] Adding new destinations (FTP, SFTP)
- [ ] Implementing scheduled backups
- [ ] Adding email notifications
- [ ] Improving error handling
- [ ] Performance optimizations
- [ ] UI/UX improvements

## 💡 Feature Requests

Have an idea for a new feature? Great! Here's how to propose it:

1. **Check existing issues** to avoid duplicates
2. **Create a new issue** with the "enhancement" label
3. **Describe the feature** in detail
4. **Explain the use case** and benefits
5. **Discuss implementation** if you have ideas

## 🤔 Questions?

- Open an issue with the "question" label
- Join our Discord community
- Email us at support@backupraja.com

## 📜 License

By contributing to Backup Raja, you agree that your contributions will be licensed under the MIT License.

---

<div align="center">
  <strong>Thank you for contributing to Backup Raja! 👑</strong>
  <br />
  <sub>Together, we're building the best backup management tool for developers</sub>
</div>
