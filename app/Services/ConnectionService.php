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
        // Re-validate credentials if they changed
        if (isset($data['credentials'])) {
            $this->testCredentials($data['type'] ?? $connection->type, $data['credentials']);
        }

        return DB::transaction(function () use ($connection, $data) {
            $connection->update([
                'name' => $data['name'] ?? $connection->name,
                'type' => $data['type'] ?? $connection->type,
                'credentials' => $data['credentials'] ?? $connection->credentials,
                'last_validated_at' => isset($data['credentials']) ? now() : $connection->last_validated_at,
            ]);

            return $connection->fresh();
        });
    }

    public function deleteConnection(Connection $connection): void
    {
        // Check for active backup operations
        $hasActiveOperations = $connection->sourceBackupOperations()
            ->whereIn('status', ['pending', 'running', 'paused'])
            ->exists()
            || $connection->destinationBackupOperations()
            ->whereIn('status', ['pending', 'running', 'paused'])
            ->exists();

        if ($hasActiveOperations) {
            throw new \Exception('Cannot delete connection with active backup operations');
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
