<?php

namespace App\Services;

use App\Models\Connection;
use App\Services\Validators\ConnectionValidatorFactory;
use Illuminate\Support\Facades\DB;

class ConnectionService
{
    public function __construct(
        private ConnectionValidatorFactory $validatorFactory
    ) {}

    public function createConnection(array $data): Connection
    {
        // Validate credentials before creating
        $this->testCredentials($data['type'], $data['credentials']);

        return DB::transaction(function () use ($data) {
            $connection = Connection::create([
                'name' => $data['name'],
                'type' => $data['type'],
                'credentials' => $data['credentials'],
                'is_active' => true,
                'last_validated_at' => now(),
            ]);

            return $connection;
        });
    }

    public function updateConnection(Connection $connection, array $data): Connection
    {
        $type = $data['type'] ?? $connection->type;
        $newCredentials = $data['credentials'] ?? null;
        $shouldValidate = false;

        // Handle Google Drive partial updates (folder_id only)
        if ($type === 'google_drive' && $newCredentials) {
            $existingCredentials = $connection->credentials;
            
            // If tokens are empty, merge with existing credentials (folder-only update)
            if (empty($newCredentials['access_token']) && empty($newCredentials['refresh_token'])) {
                $newCredentials = array_merge($existingCredentials, [
                    'folder_id' => $newCredentials['folder_id'] ?? $existingCredentials['folder_id'] ?? '',
                ]);
                // Don't validate for folder-only updates
                $shouldValidate = false;
            } else {
                // Full credential update - validate
                $shouldValidate = true;
            }
            
            $data['credentials'] = $newCredentials;
        } elseif (isset($data['credentials'])) {
            $shouldValidate = true;
        }

        // Re-validate credentials if they changed (except for folder-only updates)
        if ($shouldValidate && isset($data['credentials'])) {
            $this->testCredentials($type, $data['credentials']);
        }

        return DB::transaction(function () use ($connection, $data, $shouldValidate) {
            $connection->update([
                'name' => $data['name'] ?? $connection->name,
                'type' => $data['type'] ?? $connection->type,
                'credentials' => $data['credentials'] ?? $connection->credentials,
                'last_validated_at' => $shouldValidate ? now() : $connection->last_validated_at,
            ]);

            return $connection->fresh();
        });
    }

    public function deleteConnection(Connection $connection): void
    {
        // Check for ANY backup operations (including completed ones due to foreign key constraints)
        $totalSourceBackups = $connection->sourceBackupOperations()->count();
        $totalDestinationBackups = $connection->destinationBackupOperations()->count();
        $totalRestores = $connection->restoreOperations()->count();
        
        $totalOperations = $totalSourceBackups + $totalDestinationBackups + $totalRestores;

        if ($totalOperations > 0) {
            throw new \Exception(
                "Cannot delete connection. This connection is referenced by {$totalOperations} backup/restore operation(s) in the database.\n\n" .
                "To delete this connection, you would need to:\n" .
                "1. Delete all backup operations using this connection, or\n" .
                "2. Modify the database to allow cascade deletion\n\n" .
                "For now, you can mark this connection as inactive instead of deleting it."
            );
        }

        $connection->delete();
    }

    public function validateConnection(Connection $connection): bool
    {
        try {
            $validator = $this->validatorFactory->make($connection->type);
            $isValid = $validator->validate($connection->credentials);

            if ($isValid) {
                $connection->update([
                    'is_active' => true,
                    'last_validated_at' => now(),
                ]);
            } else {
                $connection->update(['is_active' => false]);
            }

            return $isValid;
        } catch (\Exception $e) {
            $connection->update(['is_active' => false]);
            throw $e;
        }
    }

    public function testCredentials(string $type, array $credentials): bool
    {
        try {
            $validator = $this->validatorFactory->make($type);
            
            if (!$validator->validate($credentials)) {
                throw new \Exception("Invalid {$type} credentials");
            }

            return true;
        } catch (\InvalidArgumentException $e) {
            throw new \Exception($e->getMessage());
        } catch (\RuntimeException $e) {
            throw new \Exception($e->getMessage());
        }
    }
}
