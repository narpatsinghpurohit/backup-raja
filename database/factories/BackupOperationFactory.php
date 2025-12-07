<?php

namespace Database\Factories;

use App\Models\BackupOperation;
use App\Models\Connection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\BackupOperation>
 */
class BackupOperationFactory extends Factory
{
    protected $model = BackupOperation::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'source_connection_id' => Connection::factory()->mongodb(),
            'destination_connection_id' => Connection::factory()->s3Destination(),
            'backup_schedule_id' => null,
            'status' => 'pending',
            'archive_path' => null,
            'archive_size' => null,
            'metadata' => null,
            'started_at' => null,
            'completed_at' => null,
            'error_message' => null,
            'is_protected' => false,
            'is_deleted' => false,
            'deleted_at' => null,
        ];
    }

    /**
     * Indicate that the backup is pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'started_at' => null,
            'completed_at' => null,
        ]);
    }

    /**
     * Indicate that the backup is running.
     */
    public function running(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'running',
            'started_at' => now()->subMinutes(5),
            'completed_at' => null,
        ]);
    }

    /**
     * Indicate that the backup is completed successfully.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'started_at' => now()->subMinutes(10),
            'completed_at' => now()->subMinutes(2),
            'archive_path' => 'backups/'.fake()->uuid().'.tar.gz',
            'archive_size' => fake()->numberBetween(1000000, 500000000),
            'metadata' => [
                'collections' => fake()->numberBetween(5, 20),
                'documents' => fake()->numberBetween(1000, 100000),
                'compression_ratio' => fake()->randomFloat(2, 0.3, 0.7),
            ],
        ]);
    }

    /**
     * Indicate that the backup has failed.
     */
    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'failed',
            'started_at' => now()->subMinutes(5),
            'completed_at' => now()->subMinutes(1),
            'error_message' => fake()->randomElement([
                'Connection timeout',
                'Authentication failed',
                'Insufficient storage space',
                'Network error',
            ]),
        ]);
    }

    /**
     * Indicate that the backup is paused.
     */
    public function paused(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'paused',
            'started_at' => now()->subMinutes(10),
            'completed_at' => null,
        ]);
    }

    /**
     * Indicate that the backup is cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
            'started_at' => now()->subMinutes(5),
            'completed_at' => now()->subMinutes(1),
        ]);
    }

    /**
     * Indicate that the backup is protected from cleanup.
     */
    public function protected(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_protected' => true,
        ]);
    }

    /**
     * Indicate that the backup is soft deleted.
     */
    public function deleted(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_deleted' => true,
            'deleted_at' => now(),
        ]);
    }

    /**
     * Use S3 as source instead of MongoDB.
     */
    public function fromS3(): static
    {
        return $this->state(fn (array $attributes) => [
            'source_connection_id' => Connection::factory()->s3(),
        ]);
    }

    /**
     * Use Google Drive as destination.
     */
    public function toGoogleDrive(): static
    {
        return $this->state(fn (array $attributes) => [
            'destination_connection_id' => Connection::factory()->googleDrive(),
        ]);
    }

    /**
     * Use local storage as destination.
     */
    public function toLocalStorage(): static
    {
        return $this->state(fn (array $attributes) => [
            'destination_connection_id' => Connection::factory()->localStorage(),
        ]);
    }
}
