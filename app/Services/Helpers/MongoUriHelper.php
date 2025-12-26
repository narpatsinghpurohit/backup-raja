<?php

namespace App\Services\Helpers;

class MongoUriHelper
{
    /**
     * Escape special characters in MongoDB URI credentials.
     * MongoDB URIs have format: mongodb+srv://user:password@host/...
     * Special characters in the password need to be URL-encoded.
     * 
     * This handles passwords that contain @ symbols by finding the LAST @
     * which separates credentials from the host.
     */
    public static function escapeUri(string $uri): string
    {
        // Find scheme (mongodb:// or mongodb+srv://)
        if (preg_match('/^(mongodb(?:\+srv)?:\/\/)(.+)$/', $uri, $schemeMatch)) {
            $scheme = $schemeMatch[1];
            $rest = $schemeMatch[2];
            
            // Find the LAST @ which separates user:pass from host
            $lastAtPos = strrpos($rest, '@');
            
            if ($lastAtPos !== false) {
                $userPass = substr($rest, 0, $lastAtPos);
                $hostAndRest = substr($rest, $lastAtPos + 1);
                
                // Split user:pass by the FIRST : to get user and password
                $firstColonPos = strpos($userPass, ':');
                
                if ($firstColonPos !== false) {
                    $username = substr($userPass, 0, $firstColonPos);
                    $password = substr($userPass, $firstColonPos + 1);
                    
                    // URL-encode the username and password
                    $encodedUsername = rawurlencode($username);
                    $encodedPassword = rawurlencode($password);
                    
                    return $scheme . $encodedUsername . ':' . $encodedPassword . '@' . $hostAndRest;
                }
            }
        }
        
        // If it doesn't match the pattern (e.g., no credentials), return as-is
        return $uri;
    }
}
