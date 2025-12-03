<?php

namespace App\Services\Validators;

use MongoDB\Client;

class MongoConnectionValidator implements ConnectionValidatorInterface
{
    public function validate(array $credentials): bool
    {
        // Check required fields exist
        if (empty($credentials['uri']) || empty($credentials['database'])) {
            throw new \InvalidArgumentException('MongoDB URI and database name are required');
        }

        // Validate URI format
        if (!str_starts_with($credentials['uri'], 'mongodb://') && !str_starts_with($credentials['uri'], 'mongodb+srv://')) {
            throw new \InvalidArgumentException('MongoDB URI must start with mongodb:// or mongodb+srv://');
        }

        try {
            $client = new Client($credentials['uri'], [
                'serverSelectionTimeoutMS' => 5000, // 5 second timeout
                'connectTimeoutMS' => 5000,
            ]);
            
            // Test connection by listing databases
            $client->listDatabases();

            // Verify the specified database exists or can be accessed
            $database = $client->selectDatabase($credentials['database']);
            $database->listCollections();

            return true;
        } catch (\Exception $e) {
            throw new \RuntimeException('MongoDB connection failed: ' . $e->getMessage());
        }
    }
}
