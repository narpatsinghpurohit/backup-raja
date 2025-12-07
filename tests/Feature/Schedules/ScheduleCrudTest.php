<?php

use App\Models\BackupSchedule;
use App\Models\Connection;
use App\Models\User;
use Illuminate\Support\Facades\Bus;

beforeEach(function () {
    $this->user = User::factory()->create();

    // Create source and destination connections for schedules
    $this->source = Connection::factory()->mongodb()->create();
    $this->destination = Connection::factory()->s3Destination()->create();
});

describe('Schedule Index', function () {
    it('redirects guests to login page', function () {
        $this->get(route('schedules.index'))
            ->assertRedirect(route('login'));
    });

    it('allows authenticated users to view schedules', function () {
        $this->actingAs($this->user)
            ->get(route('schedules.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Schedules/Index'));
    });

    it('lists all schedules', function () {
        BackupSchedule::factory()->count(3)->create();

        $this->actingAs($this->user)
            ->get(route('schedules.index'))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('Schedules/Index')
                    ->has('schedules.data', 3)
            );
    });
});

describe('Schedule Create', function () {
    it('renders the create form', function () {
        $this->actingAs($this->user)
            ->get(route('schedules.create'))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('Schedules/Create')
                    ->has('sources')
                    ->has('destinations')
            );
    });

    it('creates a schedule with daily preset', function () {
        $this->actingAs($this->user)
            ->post(route('schedules.store'), [
                'name' => 'Daily Backup',
                'source_connection_id' => $this->source->id,
                'destination_connection_id' => $this->destination->id,
                'frequency_preset' => 'daily',
                'cron_expression' => '0 0 * * *',
            ])
            ->assertRedirect(route('schedules.index'));

        $this->assertDatabaseHas('backup_schedules', [
            'name' => 'Daily Backup',
            'frequency_preset' => 'daily',
            'cron_expression' => '0 0 * * *',
        ]);
    });

    it('creates a schedule with hourly preset', function () {
        $this->actingAs($this->user)
            ->post(route('schedules.store'), [
                'name' => 'Hourly Backup',
                'source_connection_id' => $this->source->id,
                'destination_connection_id' => $this->destination->id,
                'frequency_preset' => 'hourly',
                'cron_expression' => '0 * * * *',
            ])
            ->assertRedirect(route('schedules.index'));

        $this->assertDatabaseHas('backup_schedules', [
            'name' => 'Hourly Backup',
            'frequency_preset' => 'hourly',
        ]);
    });

    it('creates a schedule with custom cron expression', function () {
        $this->actingAs($this->user)
            ->post(route('schedules.store'), [
                'name' => 'Custom Schedule',
                'source_connection_id' => $this->source->id,
                'destination_connection_id' => $this->destination->id,
                'frequency_preset' => 'custom', // Use custom preset
                'cron_expression' => '30 2 * * 1-5', // 2:30 AM on weekdays
            ])
            ->assertRedirect(route('schedules.index'));

        $this->assertDatabaseHas('backup_schedules', [
            'name' => 'Custom Schedule',
            'frequency_preset' => 'custom',
            'cron_expression' => '30 2 * * 1-5',
        ]);
    });

    it('validates required fields', function () {
        $this->actingAs($this->user)
            ->post(route('schedules.store'), [])
            ->assertSessionHasErrors(['name', 'source_connection_id', 'destination_connection_id', 'frequency_preset']);
    });
});

describe('Schedule Edit', function () {
    it('renders the edit form', function () {
        $schedule = BackupSchedule::factory()->create();

        $this->actingAs($this->user)
            ->get(route('schedules.edit', $schedule))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('Schedules/Edit')
                    ->has('schedule')
            );
    });

    it('updates a schedule', function () {
        $schedule = BackupSchedule::factory()->create();

        $this->actingAs($this->user)
            ->put(route('schedules.update', $schedule), [
                'name' => 'Updated Schedule Name',
                'source_connection_id' => $this->source->id,
                'destination_connection_id' => $this->destination->id,
                'frequency_preset' => 'weekly',
                'cron_expression' => '0 0 * * 0',
            ])
            ->assertRedirect(route('schedules.index'));

        $this->assertDatabaseHas('backup_schedules', [
            'id' => $schedule->id,
            'name' => 'Updated Schedule Name',
            'frequency_preset' => 'weekly',
        ]);
    });
});

describe('Schedule Control', function () {
    it('can toggle schedule active status', function () {
        $schedule = BackupSchedule::factory()->create(['is_active' => true]);

        $this->actingAs($this->user)
            ->post(route('schedules.toggle', $schedule))
            ->assertRedirect();

        $this->assertDatabaseHas('backup_schedules', [
            'id' => $schedule->id,
            'is_active' => false,
        ]);

        // Toggle back on
        $this->actingAs($this->user)
            ->post(route('schedules.toggle', $schedule))
            ->assertRedirect();

        $this->assertDatabaseHas('backup_schedules', [
            'id' => $schedule->id,
            'is_active' => true,
        ]);
    });

    it('can run schedule manually', function () {
        // Fake job dispatch to prevent actual backup execution
        Bus::fake();

        $schedule = BackupSchedule::factory()->create();

        $this->actingAs($this->user)
            ->post(route('schedules.run', $schedule))
            ->assertRedirect();

        // Should have created a backup operation
        $this->assertDatabaseHas('backup_operations', [
            'source_connection_id' => $schedule->source_connection_id,
            'destination_connection_id' => $schedule->destination_connection_id,
            'backup_schedule_id' => $schedule->id,
        ]);

        Bus::assertDispatched(\App\Jobs\BackupJob::class);
    });
});

describe('Schedule Delete', function () {
    it('deletes a schedule', function () {
        $schedule = BackupSchedule::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('schedules.destroy', $schedule))
            ->assertRedirect(route('schedules.index'));

        $this->assertDatabaseMissing('backup_schedules', [
            'id' => $schedule->id,
        ]);
    });
});

describe('Schedule Show', function () {
    it('displays schedule details', function () {
        $schedule = BackupSchedule::factory()
            ->withSuccessfulRuns(5)
            ->create();

        $this->actingAs($this->user)
            ->get(route('schedules.show', $schedule))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('Schedules/Show')
                    ->has('schedule')
                    ->where('schedule.id', $schedule->id)
            );
    });
});
