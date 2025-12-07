<?php

use App\Models\Connection;
use App\Models\User;
use App\Services\Validators\ConnectionValidatorFactory;
use App\Services\Validators\ConnectionValidatorInterface;

beforeEach(function () {
    $this->user = User::factory()->create();

    // Mock the validator factory to bypass real connection attempts
    $mockValidator = Mockery::mock(ConnectionValidatorInterface::class);
    $mockValidator->shouldReceive('validate')->andReturn(true);

    $mockFactory = Mockery::mock(ConnectionValidatorFactory::class);
    $mockFactory->shouldReceive('make')->andReturn($mockValidator);

    $this->app->instance(ConnectionValidatorFactory::class, $mockFactory);
});

describe('Connection Index', function () {
    it('redirects guests to login page', function () {
        $this->get(route('connections.index'))
            ->assertRedirect(route('login'));
    });

    it('allows authenticated users to view connections', function () {
        $this->actingAs($this->user)
            ->get(route('connections.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Connections/Index'));
    });

    it('lists all connections', function () {
        $connections = Connection::factory()->count(3)->create();

        $this->actingAs($this->user)
            ->get(route('connections.index'))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('Connections/Index')
                    ->has('connections', 3)
            );
    });
});

describe('Connection Create', function () {
    it('renders the create form', function () {
        $this->actingAs($this->user)
            ->get(route('connections.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Connections/Create'));
    });

    it('creates a mongodb connection', function () {
        $this->actingAs($this->user)
            ->post(route('connections.store'), [
                'name' => 'Test MongoDB',
                'type' => 'mongodb',
                'credentials' => [
                    'uri' => 'mongodb://localhost:27017',
                    'database' => 'test_db',
                ],
            ])
            ->assertRedirect(route('connections.index'));

        $this->assertDatabaseHas('connections', [
            'name' => 'Test MongoDB',
            'type' => 'mongodb',
        ]);
    });

    it('creates an s3 source connection', function () {
        $this->actingAs($this->user)
            ->post(route('connections.store'), [
                'name' => 'Test S3 Source',
                'type' => 's3',
                'credentials' => [
                    'access_key' => 'AKIAIOSFODNN7EXAMPLE',
                    'secret_key' => 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
                    'region' => 'us-east-1',
                    'bucket' => 'my-test-bucket',
                ],
            ])
            ->assertRedirect(route('connections.index'));

        $this->assertDatabaseHas('connections', [
            'name' => 'Test S3 Source',
            'type' => 's3',
        ]);
    });

    it('creates an s3 destination connection', function () {
        $this->actingAs($this->user)
            ->post(route('connections.store'), [
                'name' => 'Test S3 Destination',
                'type' => 's3_destination',
                'credentials' => [
                    'access_key' => 'AKIAIOSFODNN7EXAMPLE',
                    'secret_key' => 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
                    'region' => 'us-west-2',
                    'bucket' => 'my-backup-bucket',
                    'prefix' => 'backups/',
                ],
            ])
            ->assertRedirect(route('connections.index'));

        $this->assertDatabaseHas('connections', [
            'name' => 'Test S3 Destination',
            'type' => 's3_destination',
        ]);
    });

    it('creates a local storage connection', function () {
        $this->actingAs($this->user)
            ->post(route('connections.store'), [
                'name' => 'Test Local Storage',
                'type' => 'local_storage',
                'credentials' => [
                    'disk' => 'local',
                    'path' => 'backups/test',
                ],
            ])
            ->assertRedirect(route('connections.index'));

        $this->assertDatabaseHas('connections', [
            'name' => 'Test Local Storage',
            'type' => 'local_storage',
        ]);
    });

    it('validates required fields', function () {
        $this->actingAs($this->user)
            ->post(route('connections.store'), [])
            ->assertSessionHasErrors(['name', 'type']);
    });
});

describe('Connection Edit', function () {
    it('renders the edit form', function () {
        $connection = Connection::factory()->mongodb()->create();

        $this->actingAs($this->user)
            ->get(route('connections.edit', $connection))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('Connections/Edit')
                    ->has('connection')
            );
    });

    it('updates a connection', function () {
        $connection = Connection::factory()->mongodb()->create();

        $this->actingAs($this->user)
            ->put(route('connections.update', $connection), [
                'name' => 'Updated Connection Name',
                'credentials' => [
                    'uri' => 'mongodb://updated:27017',
                    'database' => 'updated_db',
                ],
            ])
            ->assertRedirect(route('connections.index'));

        $this->assertDatabaseHas('connections', [
            'id' => $connection->id,
            'name' => 'Updated Connection Name',
        ]);
    });
});

describe('Connection Delete', function () {
    it('deletes a connection', function () {
        $connection = Connection::factory()->mongodb()->create();

        $this->actingAs($this->user)
            ->delete(route('connections.destroy', $connection))
            ->assertRedirect(route('connections.index'));

        $this->assertDatabaseMissing('connections', [
            'id' => $connection->id,
        ]);
    });
});

describe('Connection Duplicate', function () {
    it('renders the duplicate form with pre-filled data', function () {
        $connection = Connection::factory()->mongodb()->create([
            'name' => 'Original MongoDB',
        ]);

        $this->actingAs($this->user)
            ->get(route('connections.duplicate', $connection))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('Connections/Duplicate')
                    ->has('baseConnection')
                    ->where('baseConnection.name', 'Original MongoDB')
            );
    });
});
