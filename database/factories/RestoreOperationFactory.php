<?php

namespace Database\Factories;

use App\Models\BackupOperation;
use App\Models\Connection;
use App\Models\RestoreOperation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RestoreOperation>
 */
class RestoreOperationFactory extends Factory
{
    protected $model = RestoreOperation::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'backup_operation_id' => BackupOperation::factory()->completed(),
            'destination_connection_id' => Connection::factory()->mongodb(),
            'destination_config' => [
                'database' => fake()->word().'_restored',
                'drop_existing' => false,
            ],
            'status' => 'pending',
            'started_at' => null,
            'completed_at' => null,
            'error_message' => null,
        ];
    }

    /**
     * Indicate that the restore is pending.
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
     * Indicate that the restore is running.
     */
    public function running(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'running',
            'started_at' => now()->subMinutes(3),
            'completed_at' => null,
        ]);
    }

    /**
     * Indicate that the restore is completed successfully.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'started_at' => now()->subMinutes(10),
            'completed_at' => now()->subMinutes(2),
        ]);
    }

    /**
     * Indicate that the restore has failed.
     */
    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'failed',
            'started_at' => now()->subMinutes(5),
            'completed_at' => now()->subMinutes(1),
            'error_message' => fake()->randomElement([
                'Restore failed: database already exists',
                'Restore failed: insufficient permissions',
                'Restore failed: corrupted archive',
            ]),
        ]);
    }

    /**
     * Indicate that the restore is cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
            'started_at' => now()->subMinutes(3),
            'completed_at' => now()->subMinutes(1),
        ]);
    }

    /**
     * Restore to an S3 destination.
     */
    public function toS3(): static
    {
        return $this->state(fn (array $attributes) => [
            'destination_connection_id' => Connection::factory()->s3(),
            'destination_config' => [
                'bucket' => fake()->word().'-restored',
                'prefix' => 'restored/',
            ],
        ]);
    }

    /**
     * Restore to local storage.
     */
    public function toLocalStorage(): static
    {
        return $this->state(fn (array $attributes) => [
            'destination_connection_id' => Connection::factory()->localStorage(),
            'destination_config' => [
                'path' => 'restored/'.fake()->word(),
            ],
        ]);
    }
}
