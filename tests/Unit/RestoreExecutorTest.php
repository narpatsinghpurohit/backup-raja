<?php

use App\Services\RestoreExecutor;

// Helper to access private methods for testing
function callPrivateMethod($object, string $methodName, array $args = [])
{
    $reflection = new ReflectionClass($object);
    $method = $reflection->getMethod($methodName);
    $method->setAccessible(true);

    return $method->invokeArgs($object, $args);
}

describe('RestoreExecutor', function () {
    describe('Google Drive URL Detection', function () {
        it('detects Google Drive view URLs', function () {
            $executor = new RestoreExecutor;

            $urlTests = [
                'https://drive.google.com/file/d/1iJLfBYZFsRnOzNQhNRYbX-Y7AkzDIb1h/view?usp=drivesdk' => true,
                'https://drive.google.com/file/d/abc123/view' => true,
                'https://docs.google.com/document/d/xyz789/edit' => true,
                'https://s3.amazonaws.com/bucket/file.tar.gz' => false,
                '/local/path/to/file.tar.gz' => false,
                'https://example.com/backup.tar.gz' => false,
            ];

            foreach ($urlTests as $url => $expected) {
                expect(callPrivateMethod($executor, 'isGoogleDriveUrl', [$url]))->toBe($expected);
            }
        });

        it('extracts file ID from Google Drive URLs', function () {
            $executor = new RestoreExecutor;

            $urlTests = [
                'https://drive.google.com/file/d/1iJLfBYZFsRnOzNQhNRYbX-Y7AkzDIb1h/view?usp=drivesdk' => '1iJLfBYZFsRnOzNQhNRYbX-Y7AkzDIb1h',
                'https://drive.google.com/file/d/abc123XYZ/view' => 'abc123XYZ',
                'https://drive.google.com/open?id=fileId789' => 'fileId789',
                'justAFileId123' => 'justAFileId123',
            ];

            foreach ($urlTests as $url => $expectedId) {
                expect(callPrivateMethod($executor, 'extractGoogleDriveFileId', [$url]))->toBe($expectedId);
            }
        });

        it('returns null for invalid Google Drive URLs', function () {
            $executor = new RestoreExecutor;

            $invalidUrls = [
                'https://example.com/file.tar.gz',
                'https://drive.google.com/', // No file ID
            ];

            foreach ($invalidUrls as $url) {
                expect(callPrivateMethod($executor, 'extractGoogleDriveFileId', [$url]))->toBeNull();
            }
        });
    });
});
