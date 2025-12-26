<?php

namespace App\Services\Helpers;

class MongoUriHelper
{
    /**
     * Escape special characters in MongoDB URI credentials.
     * MongoDB URIs have format: mongodb+srv://user:password@host/...
     * Special characters in the password need to be URL-encoded.
     */
    public static function escapeUri(string $uri): string
    {
        // Parse the URI to find the credentials portion
        // Pattern: mongodb://user:password@host or mongodb+srv://user:password@host
        $pattern = '/^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@(.+)$/';

        if (preg_match($pattern, $uri, $matches)) {
            $scheme = $matches[1];      // mongodb:// or mongodb+srv://
            $username = $matches[2];    // username
            $password = $matches[3];    // password (may contain special chars)
            $rest = $matches[4];        // host and everything after

            // URL-encode the username and password
            $encodedUsername = rawurlencode($username);
            $encodedPassword = rawurlencode($password);

            return $scheme.$encodedUsername.':'.$encodedPassword.'@'.$rest;
        }

        // If it doesn't match the pattern (e.g., no credentials), return as-is
        return $uri;
    }
}
