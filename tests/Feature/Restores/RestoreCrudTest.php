<?php

use App\Models\BackupOperation;
use App\Models\Connection;
use App\Models\RestoreOperation;
use App\Models\User;
use Illuminate\Support\Facades\Bus;

beforeEach(function () {
    $this->user = User::factory()->create();

    // Create connections and a completed backup for restore tests
    $this->source = Connection::factory()->mongodb()->create();
    $this->destination = Connection::factory()->s3Destination()->create();
    $this->restoreDestination = Connection::factory()->mongodb()->create(['name' => 'Restore Target']);

    $this->completedBackup = BackupOperation::factory()
        ->for($this->source, 'sourceConnection')
        ->for($this->destination, 'destinationConnection')
        ->completed()
        ->create();
});

describe('Restore Create', function () {
    it('renders the restore form for a completed backup', function () {
        $this->actingAs($this->user)
            ->get(route('restores.create', $this->completedBackup))
            ->assertOk()
            ->assertInertia(fn($page) => $page->component('Restores/Create'));
    });

    it('initiates a restore operation', function () {
        // Fake job dispatch to prevent actual restore execution
        Bus::fake();

        $this->actingAs($this->user)
            ->post(route('restores.store', $this->completedBackup), [
                'destination_connection_id' => $this->restoreDestination->id,
                'config' => [
                    'database' => 'restored_db',
                    'drop_existing' => false,
                ],
            ])
            ->assertRedirect();

        // Verify restore operation was created
        $this->assertDatabaseHas('restore_operations', [
            'backup_operation_id' => $this->completedBackup->id,
            'destination_connection_id' => $this->restoreDestination->id,
        ]);

        Bus::assertDispatched(\App\Jobs\RestoreJob::class);
    });

    it('requires destination connection', function () {
        $this->actingAs($this->user)
            ->post(route('restores.store', $this->completedBackup), [])
            ->assertSessionHasErrors(['destination_connection_id']);
    });
});

describe('Restore Show', function () {
    it('displays restore operation details', function () {
        $restore = RestoreOperation::factory()
            ->for($this->completedBackup, 'backupOperation')
            ->for($this->restoreDestination, 'destinationConnection')
            ->create();

        $this->actingAs($this->user)
            ->get(route('restores.show', $restore))
            ->assertOk()
            ->assertInertia(
                fn($page) => $page
                    ->component('Restores/Show')
                    ->has('restore')
                    ->where('restore.id', $restore->id)
            );
    });

    it('shows restore with completed status', function () {
        $restore = RestoreOperation::factory()
            ->for($this->completedBackup, 'backupOperation')
            ->for($this->restoreDestination, 'destinationConnection')
            ->completed()
            ->create();

        $this->actingAs($this->user)
            ->get(route('restores.show', $restore))
            ->assertOk()
            ->assertInertia(
                fn($page) => $page
                    ->where('restore.status', 'completed')
            );
    });

    it('shows restore with failed status', function () {
        $restore = RestoreOperation::factory()
            ->for($this->completedBackup, 'backupOperation')
            ->for($this->restoreDestination, 'destinationConnection')
            ->failed()
            ->create();

        $this->actingAs($this->user)
            ->get(route('restores.show', $restore))
            ->assertOk()
            ->assertInertia(
                fn($page) => $page
                    ->where('restore.status', 'failed')
                    ->has('restore.error_message')
            );
    });
});

describe('Restore Guards', function () {
    // Note: The application currently allows viewing restore create for any backup status
    // These tests document the current behavior - guards could be added later

    it('can view restore form for pending backup', function () {
        $pendingBackup = BackupOperation::factory()
            ->for($this->source, 'sourceConnection')
            ->for($this->destination, 'destinationConnection')
            ->pending()
            ->create();

        $this->actingAs($this->user)
            ->get(route('restores.create', $pendingBackup))
            ->assertOk()
            ->assertInertia(fn($page) => $page->component('Restores/Create'));
    });

    it('can view restore form for running backup', function () {
        $runningBackup = BackupOperation::factory()
            ->for($this->source, 'sourceConnection')
            ->for($this->destination, 'destinationConnection')
            ->running()
            ->create();

        $this->actingAs($this->user)
            ->get(route('restores.create', $runningBackup))
            ->assertOk()
            ->assertInertia(fn($page) => $page->component('Restores/Create'));
    });

    it('can view restore form for failed backup', function () {
        $failedBackup = BackupOperation::factory()
            ->for($this->source, 'sourceConnection')
            ->for($this->destination, 'destinationConnection')
            ->failed()
            ->create();

        $this->actingAs($this->user)
            ->get(route('restores.create', $failedBackup))
            ->assertOk()
            ->assertInertia(fn($page) => $page->component('Restores/Create'));
    });
});

describe('Restore Authentication', function () {
    it('redirects guests to login', function () {
        $this->get(route('restores.create', $this->completedBackup))
            ->assertRedirect(route('login'));
    });

    it('redirects guests from restore show', function () {
        $restore = RestoreOperation::factory()
            ->for($this->completedBackup, 'backupOperation')
            ->for($this->restoreDestination, 'destinationConnection')
            ->create();

        $this->get(route('restores.show', $restore))
            ->assertRedirect(route('login'));
    });
});
