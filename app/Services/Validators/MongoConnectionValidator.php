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
            // Build driver options with SSL/TLS settings for MongoDB Atlas
            $driverOptions = [
                'serverSelectionTimeoutMS' => 5000, // 5 second timeout
                'connectTimeoutMS' => 5000,
            ];

            // For MongoDB Atlas (mongodb+srv://), we need proper TLS handling
            $uriOptions = [];
            if (str_starts_with($credentials['uri'], 'mongodb+srv://')) {
                $uriOptions['tls'] = true;
                // Try to use system CA bundle, or allow insecure for local dev
                $caBundlePath = $this->findCaBundle();
                if ($caBundlePath) {
                    $uriOptions['tlsCAFile'] = $caBundlePath;
                } else {
                    // For development: allow insecure connections if no CA bundle found
                    // In production, you should configure proper CA certificates
                    $uriOptions['tlsAllowInvalidCertificates'] = true;
                }
            }

            $client = new Client($credentials['uri'], $uriOptions, $driverOptions);
            
            // Test connection by pinging the database
            $database = $client->selectDatabase($credentials['database']);
            $database->command(['ping' => 1]);

            return true;
        } catch (\Exception $e) {
            throw new \RuntimeException('MongoDB connection failed: ' . $e->getMessage());
        }
    }

    /**
     * Find the CA certificate bundle on the system
     */
    private function findCaBundle(): ?string
    {
        $possiblePaths = [
            // macOS with Homebrew
            '/usr/local/etc/openssl@3/cert.pem',
            '/usr/local/etc/openssl@1.1/cert.pem',
            '/usr/local/etc/openssl/cert.pem',
            '/opt/homebrew/etc/openssl@3/cert.pem',
            '/opt/homebrew/etc/openssl/cert.pem',
            // macOS system
            '/etc/ssl/cert.pem',
            // Linux
            '/etc/ssl/certs/ca-certificates.crt',
            '/etc/pki/tls/certs/ca-bundle.crt',
            '/etc/ssl/ca-bundle.pem',
            // PHP's bundled CA
            ini_get('openssl.cafile'),
            ini_get('curl.cainfo'),
        ];

        foreach ($possiblePaths as $path) {
            if ($path && file_exists($path)) {
                return $path;
            }
        }

        return null;
    }
}
