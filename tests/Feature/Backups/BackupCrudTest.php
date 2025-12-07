<?php

use App\Models\BackupOperation;
use App\Models\Connection;
use App\Models\User;
use Illuminate\Support\Facades\Bus;

beforeEach(function () {
    $this->user = User::factory()->create();

    // Create source and destination connections for backups
    $this->source = Connection::factory()->mongodb()->create();
    $this->destination = Connection::factory()->s3Destination()->create();
});

describe('Backup Index', function () {
    it('redirects guests to login page', function () {
        $this->get(route('backups.index'))
            ->assertRedirect(route('login'));
    });

    it('allows authenticated users to view backups', function () {
        $this->actingAs($this->user)
            ->get(route('backups.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Backups/Index'));
    });

    it('displays backup stats', function () {
        BackupOperation::factory()->count(3)->completed()->create();
        BackupOperation::factory()->count(2)->failed()->create();

        $this->actingAs($this->user)
            ->get(route('backups.index'))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('Backups/Index')
                    ->has('stats')
                    ->where('stats.successful', 3)
                    ->where('stats.failed', 2)
            );
    });

    it('filters backups by status', function () {
        BackupOperation::factory()->completed()->create();
        BackupOperation::factory()->failed()->create();

        $this->actingAs($this->user)
            ->get(route('backups.index', ['status' => 'completed']))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('Backups/Index')
                    ->where('filters.status', 'completed')
            );
    });
});

describe('Backup Create', function () {
    it('renders the create form', function () {
        $this->actingAs($this->user)
            ->get(route('backups.create'))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('Backups/Create')
                    ->has('sources')
                    ->has('destinations')
            );
    });

    it('initiates a backup operation', function () {
        $this->actingAs($this->user)
            ->post(route('backups.store'), [
                'source_connection_id' => $this->source->id,
                'destination_connection_id' => $this->destination->id,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('backup_operations', [
            'source_connection_id' => $this->source->id,
            'destination_connection_id' => $this->destination->id,
        ]);
    });

    it('validates source and destination', function () {
        $this->actingAs($this->user)
            ->post(route('backups.store'), [])
            ->assertSessionHasErrors(['source_connection_id', 'destination_connection_id']);
    });

    it('requires valid connection ids', function () {
        $this->actingAs($this->user)
            ->post(route('backups.store'), [
                'source_connection_id' => 9999,
                'destination_connection_id' => 9999,
            ])
            ->assertSessionHasErrors(['source_connection_id', 'destination_connection_id']);
    });
});

describe('Backup Show', function () {
    it('displays backup operation details', function () {
        $backup = BackupOperation::factory()
            ->for($this->source, 'sourceConnection')
            ->for($this->destination, 'destinationConnection')
            ->completed()
            ->create();

        $this->actingAs($this->user)
            ->get(route('backups.show', $backup))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('Backups/Show')
                    ->has('backup')
                    ->where('backup.id', $backup->id)
            );
    });

    it('loads relationships', function () {
        $backup = BackupOperation::factory()
            ->for($this->source, 'sourceConnection')
            ->for($this->destination, 'destinationConnection')
            ->create();

        $this->actingAs($this->user)
            ->get(route('backups.show', $backup))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->has('backup.source_connection')
                    ->has('backup.destination_connection')
            );
    });
});

describe('Backup Control', function () {
    it('can pause a running backup', function () {
        $backup = BackupOperation::factory()
            ->for($this->source, 'sourceConnection')
            ->for($this->destination, 'destinationConnection')
            ->running()
            ->create();

        $this->actingAs($this->user)
            ->post(route('backups.pause', $backup))
            ->assertRedirect();

        $this->assertDatabaseHas('backup_operations', [
            'id' => $backup->id,
            'status' => 'paused',
        ]);
    });

    it('can resume a paused backup', function () {
        // Fake job dispatch to prevent actual backup execution
        Bus::fake();

        $backup = BackupOperation::factory()
            ->for($this->source, 'sourceConnection')
            ->for($this->destination, 'destinationConnection')
            ->paused()
            ->create();

        $this->actingAs($this->user)
            ->post(route('backups.resume', $backup))
            ->assertRedirect();

        // Resume sets status to pending and dispatches the job
        $this->assertDatabaseHas('backup_operations', [
            'id' => $backup->id,
            'status' => 'pending',
        ]);

        Bus::assertDispatched(\App\Jobs\BackupJob::class);
    });

    it('can cancel a running backup', function () {
        $backup = BackupOperation::factory()
            ->for($this->source, 'sourceConnection')
            ->for($this->destination, 'destinationConnection')
            ->running()
            ->create();

        $this->actingAs($this->user)
            ->post(route('backups.cancel', $backup))
            ->assertRedirect();

        $this->assertDatabaseHas('backup_operations', [
            'id' => $backup->id,
            'status' => 'cancelled',
        ]);
    });

    it('can toggle protection on a backup', function () {
        $backup = BackupOperation::factory()
            ->for($this->source, 'sourceConnection')
            ->for($this->destination, 'destinationConnection')
            ->completed()
            ->create(['is_protected' => false]);

        $this->actingAs($this->user)
            ->post(route('backups.protect', $backup))
            ->assertRedirect();

        $this->assertDatabaseHas('backup_operations', [
            'id' => $backup->id,
            'is_protected' => true,
        ]);

        // Toggle off
        $this->actingAs($this->user)
            ->post(route('backups.protect', $backup))
            ->assertRedirect();

        $this->assertDatabaseHas('backup_operations', [
            'id' => $backup->id,
            'is_protected' => false,
        ]);
    });
});
