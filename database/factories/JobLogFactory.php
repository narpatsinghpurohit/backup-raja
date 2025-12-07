<?php

namespace Database\Factories;

use App\Models\BackupOperation;
use App\Models\JobLog;
use App\Models\RestoreOperation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\JobLog>
 */
class JobLogFactory extends Factory
{
    protected $model = JobLog::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'loggable_type' => BackupOperation::class,
            'loggable_id' => BackupOperation::factory(),
            'level' => 'info',
            'message' => fake()->sentence(),
            'context' => null,
            'created_at' => now(),
        ];
    }

    /**
     * Indicate that this is an info log.
     */
    public function info(): static
    {
        return $this->state(fn (array $attributes) => [
            'level' => 'info',
            'message' => fake()->randomElement([
                'Backup started',
                'Connecting to database',
                'Dumping collection: users',
                'Compressing archive',
                'Uploading to destination',
                'Backup completed successfully',
            ]),
        ]);
    }

    /**
     * Indicate that this is a warning log.
     */
    public function warning(): static
    {
        return $this->state(fn (array $attributes) => [
            'level' => 'warning',
            'message' => fake()->randomElement([
                'Slow response from database',
                'Large collection detected, this may take a while',
                'Retry attempt 1 of 3',
                'Connection temporarily lost, reconnecting',
            ]),
        ]);
    }

    /**
     * Indicate that this is an error log.
     */
    public function error(): static
    {
        return $this->state(fn (array $attributes) => [
            'level' => 'error',
            'message' => fake()->randomElement([
                'Failed to connect to database',
                'Authentication failed',
                'Backup failed: disk full',
                'Network timeout',
            ]),
            'context' => [
                'error_code' => fake()->numberBetween(1000, 9999),
                'stack_trace' => 'Error at line '.fake()->numberBetween(1, 500),
            ],
        ]);
    }

    /**
     * Associate this log with a backup operation.
     */
    public function forBackup(?BackupOperation $backup = null): static
    {
        return $this->state(fn (array $attributes) => [
            'loggable_type' => BackupOperation::class,
            'loggable_id' => $backup?->id ?? BackupOperation::factory(),
        ]);
    }

    /**
     * Associate this log with a restore operation.
     */
    public function forRestore(?RestoreOperation $restore = null): static
    {
        return $this->state(fn (array $attributes) => [
            'loggable_type' => RestoreOperation::class,
            'loggable_id' => $restore?->id ?? RestoreOperation::factory(),
        ]);
    }

    /**
     * Add context data to the log.
     */
    public function withContext(array $context): static
    {
        return $this->state(fn (array $attributes) => [
            'context' => $context,
        ]);
    }
}
