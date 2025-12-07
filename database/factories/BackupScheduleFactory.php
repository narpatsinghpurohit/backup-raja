<?php

namespace Database\Factories;

use App\Models\BackupSchedule;
use App\Models\Connection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\BackupSchedule>
 */
class BackupScheduleFactory extends Factory
{
    protected $model = BackupSchedule::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true).' Backup',
            'source_connection_id' => Connection::factory()->mongodb(),
            'destination_connection_id' => Connection::factory()->s3Destination(),
            'cron_expression' => '0 0 * * *', // Daily at midnight
            'frequency_preset' => 'daily',
            'is_active' => true,
            'retention_count' => null,
            'retention_days' => null,
            'last_run_at' => null,
            'next_run_at' => now()->addDay(),
            'last_run_status' => null,
            'success_count' => 0,
            'failure_count' => 0,
        ];
    }

    /**
     * Set schedule to run hourly.
     */
    public function hourly(): static
    {
        return $this->state(fn (array $attributes) => [
            'cron_expression' => '0 * * * *',
            'frequency_preset' => 'hourly',
            'next_run_at' => now()->addHour(),
        ]);
    }

    /**
     * Set schedule to run daily at midnight.
     */
    public function daily(): static
    {
        return $this->state(fn (array $attributes) => [
            'cron_expression' => '0 0 * * *',
            'frequency_preset' => 'daily',
            'next_run_at' => now()->addDay(),
        ]);
    }

    /**
     * Set schedule to run weekly on Sunday at midnight.
     */
    public function weekly(): static
    {
        return $this->state(fn (array $attributes) => [
            'cron_expression' => '0 0 * * 0',
            'frequency_preset' => 'weekly',
            'next_run_at' => now()->next('Sunday'),
        ]);
    }

    /**
     * Set schedule to run monthly on the 1st at midnight.
     */
    public function monthly(): static
    {
        return $this->state(fn (array $attributes) => [
            'cron_expression' => '0 0 1 * *',
            'frequency_preset' => 'monthly',
            'next_run_at' => now()->startOfMonth()->addMonth(),
        ]);
    }

    /**
     * Set a custom cron expression.
     */
    public function custom(string $cronExpression): static
    {
        return $this->state(fn (array $attributes) => [
            'cron_expression' => $cronExpression,
            'frequency_preset' => null,
        ]);
    }

    /**
     * Indicate that the schedule is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Configure retention by count.
     */
    public function withRetentionCount(int $count): static
    {
        return $this->state(fn (array $attributes) => [
            'retention_count' => $count,
        ]);
    }

    /**
     * Configure retention by days.
     */
    public function withRetentionDays(int $days): static
    {
        return $this->state(fn (array $attributes) => [
            'retention_days' => $days,
        ]);
    }

    /**
     * Indicate that the schedule has run successfully before.
     */
    public function withSuccessfulRuns(int $count = 5): static
    {
        return $this->state(fn (array $attributes) => [
            'last_run_at' => now()->subHours(2),
            'last_run_status' => 'completed',
            'success_count' => $count,
        ]);
    }

    /**
     * Indicate that the schedule has failed runs.
     */
    public function withFailedRuns(int $count = 2): static
    {
        return $this->state(fn (array $attributes) => [
            'last_run_at' => now()->subHours(1),
            'last_run_status' => 'failed',
            'failure_count' => $count,
        ]);
    }

    /**
     * Indicate that the schedule is due to run.
     */
    public function due(): static
    {
        return $this->state(fn (array $attributes) => [
            'next_run_at' => now()->subMinutes(5),
            'is_active' => true,
        ]);
    }
}
