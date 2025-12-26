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

    it('filters destinations to only show matching types for MongoDB backup', function () {
        // Create backups with different source types
        $mongoSource = Connection::factory()->mongodb()->create(['name' => 'MongoDB Source']);
        $s3Destination = Connection::factory()->s3Destination()->create(['name' => 'S3 Dest']);
        $mongoDestination = Connection::factory()->mongodb()->create(['name' => 'Mongo Dest']);

        $mongoBackup = BackupOperation::factory()
            ->for($mongoSource, 'sourceConnection')
            ->for($s3Destination, 'destinationConnection')
            ->completed()
            ->create();

        $this->actingAs($this->user)
            ->get(route('restores.create', $mongoBackup))
            ->assertOk()
            ->assertInertia(fn($page) => $page
                ->component('Restores/Create')
                ->has('destinations')
                ->where('destinations', function ($destinations) {
                    // All destinations should be mongodb type
                    foreach ($destinations as $dest) {
                        if ($dest['type'] !== 'mongodb') {
                            return false;
                        }
                    }

                    return true;
                })
            );
    });

    it('passes source database from backup metadata', function () {
        $this->completedBackup->update([
            'metadata' => ['source_database' => 'test_database'],
        ]);

        $this->actingAs($this->user)
            ->get(route('restores.create', $this->completedBackup))
            ->assertOk()
            ->assertInertia(fn($page) => $page
                ->component('Restores/Create')
                ->where('sourceDatabase', 'test_database')
            );
    });

    it('marks matching destination with is_match flag', function () {
        $matchingDestination = Connection::factory()->mongodb()->create([
            'name' => 'Matching DB',
            'credentials' => [
                'uri' => 'mongodb://localhost',
                'database' => 'my_database',
            ],
        ]);

        $this->completedBackup->update([
            'metadata' => ['source_database' => 'my_database'],
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('restores.create', $this->completedBackup))
            ->assertOk();

        // Get destinations from the response and check is_match
        $destinations = $response->original->getData()['page']['props']['destinations'];
        $matchingDest = collect($destinations)->firstWhere('id', $matchingDestination->id);

        expect($matchingDest)->not->toBeNull();
        expect($matchingDest['is_match'])->toBeTrue();
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
