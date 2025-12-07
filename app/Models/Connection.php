<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Connection extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'credentials',
        'is_active',
        'last_validated_at',
    ];

    protected $casts = [
        'credentials' => 'encrypted:array',
        'is_active' => 'boolean',
        'last_validated_at' => 'datetime',
    ];

    public function sourceBackupOperations(): HasMany
    {
        return $this->hasMany(BackupOperation::class, 'source_connection_id');
    }

    public function destinationBackupOperations(): HasMany
    {
        return $this->hasMany(BackupOperation::class, 'destination_connection_id');
    }

    public function restoreOperations(): HasMany
    {
        return $this->hasMany(RestoreOperation::class, 'destination_connection_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }
}
