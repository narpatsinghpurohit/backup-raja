<?php

namespace Database\Factories;

use App\Models\RetentionSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RetentionSetting>
 */
class RetentionSettingFactory extends Factory
{
    protected $model = RetentionSetting::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'key' => fake()->unique()->word(),
            'value' => fake()->word(),
        ];
    }

    /**
     * Create a retention count setting.
     */
    public function retentionCount(int $count = 10): static
    {
        return $this->state(fn (array $attributes) => [
            'key' => 'retention_count',
            'value' => (string) $count,
        ]);
    }

    /**
     * Create a retention days setting.
     */
    public function retentionDays(int $days = 30): static
    {
        return $this->state(fn (array $attributes) => [
            'key' => 'retention_days',
            'value' => (string) $days,
        ]);
    }

    /**
     * Create a cleanup enabled setting.
     */
    public function cleanupEnabled(bool $enabled = true): static
    {
        return $this->state(fn (array $attributes) => [
            'key' => 'cleanup_enabled',
            'value' => $enabled ? 'true' : 'false',
        ]);
    }

    /**
     * Create a last cleanup timestamp setting.
     */
    public function lastCleanup(): static
    {
        return $this->state(fn (array $attributes) => [
            'key' => 'last_cleanup_at',
            'value' => now()->toIso8601String(),
        ]);
    }
}
