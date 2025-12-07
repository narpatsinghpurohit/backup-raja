<?php

namespace Database\Factories;

use App\Models\Connection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Connection>
 */
class ConnectionFactory extends Factory
{
    protected $model = Connection::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company().' MongoDB',
            'type' => 'mongodb',
            'credentials' => [
                'uri' => 'mongodb://localhost:27017',
                'database' => fake()->word().'_db',
            ],
            'is_active' => true,
            'last_validated_at' => null,
        ];
    }

    /**
     * Indicate that the connection is a MongoDB source.
     */
    public function mongodb(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => fake()->company().' MongoDB',
            'type' => 'mongodb',
            'credentials' => [
                'uri' => 'mongodb+srv://user:password@cluster.mongodb.net',
                'database' => fake()->word().'_db',
            ],
        ]);
    }

    /**
     * Indicate that the connection is an S3 source.
     */
    public function s3(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => fake()->company().' S3 Source',
            'type' => 's3',
            'credentials' => [
                'access_key' => 'AKIA'.strtoupper(fake()->bothify('################')),
                'secret_key' => fake()->sha256(),
                'region' => fake()->randomElement(['us-east-1', 'us-west-2', 'eu-west-1', 'ap-south-1']),
                'bucket' => fake()->word().'-bucket',
            ],
        ]);
    }

    /**
     * Indicate that the connection is an S3 destination.
     */
    public function s3Destination(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => fake()->company().' S3 Destination',
            'type' => 's3_destination',
            'credentials' => [
                'access_key' => 'AKIA'.strtoupper(fake()->bothify('################')),
                'secret_key' => fake()->sha256(),
                'region' => fake()->randomElement(['us-east-1', 'us-west-2', 'eu-west-1', 'ap-south-1']),
                'bucket' => fake()->word().'-backup-bucket',
                'prefix' => 'backups/',
            ],
        ]);
    }

    /**
     * Indicate that the connection is a Google Drive destination.
     */
    public function googleDrive(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => fake()->company().' Google Drive',
            'type' => 'google_drive',
            'credentials' => [
                'access_token' => fake()->sha256(),
                'refresh_token' => fake()->sha256(),
                'folder_id' => fake()->bothify('1??????????????????????????????????'),
            ],
        ]);
    }

    /**
     * Indicate that the connection is local storage.
     */
    public function localStorage(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => fake()->company().' Local Storage',
            'type' => 'local_storage',
            'credentials' => [
                'disk' => 'local',
                'path' => 'backups/'.fake()->word(),
            ],
        ]);
    }

    /**
     * Indicate that the connection is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the connection has been validated.
     */
    public function validated(): static
    {
        return $this->state(fn (array $attributes) => [
            'last_validated_at' => now(),
        ]);
    }
}
