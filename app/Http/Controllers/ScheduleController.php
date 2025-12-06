<?php

namespace App\Http\Controllers;

use App\Models\BackupSchedule;
use App\Models\Connection;
use App\Services\ScheduleService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScheduleController extends Controller
{
    public function __construct(
        private ScheduleService $scheduleService
    ) {}

    public function index(Request $request)
    {
        $query = BackupSchedule::with(['sourceConnection', 'destinationConnection']);

        // Apply filters
        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'paused') {
                $query->where('is_active', false);
            }
        }

        if ($request->filled('source_connection_id')) {
            $query->where('source_connection_id', $request->source_connection_id);
        }

        if ($request->filled('destination_connection_id')) {
            $query->where('destination_connection_id', $request->destination_connection_id);
        }

        if ($request->filled('last_run_status')) {
            $query->where('last_run_status', $request->last_run_status);
        }

        $schedules = $query->orderBy('name')->paginate(10)->withQueryString();

        // Get connections for filter dropdowns
        $sources = Connection::whereIn('type', ['s3', 'mongodb'])->get(['id', 'name', 'type']);
        $destinations = Connection::whereIn('type', ['s3_destination', 'google_drive', 'local_storage'])->get(['id', 'name', 'type']);

        $filters = $request->only(['status', 'source_connection_id', 'destination_connection_id', 'last_run_status']);

        return Inertia::render('Schedules/Index', [
            'schedules' => $schedules,
            'sources' => $sources,
            'destinations' => $destinations,
            'filters' => $filters,
        ]);
    }

    public function create()
    {
        $sources = Connection::whereIn('type', ['s3', 'mongodb'])->get();
        $destinations = Connection::whereIn('type', ['s3_destination', 'google_drive', 'local_storage'])->get();

        return Inertia::render('Schedules/Create', [
            'sources' => $sources,
            'destinations' => $destinations,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:backup_schedules,name',
            'source_connection_id' => 'required|exists:connections,id',
            'destination_connection_id' => 'required|exists:connections,id',
            'frequency_preset' => 'required|in:hourly,daily,weekly,monthly,custom',
            'cron_expression' => 'required_if:frequency_preset,custom|nullable|string',
            'is_active' => 'boolean',
            'retention_count' => 'nullable|integer|min:1',
            'retention_days' => 'nullable|integer|min:1',
        ]);

        $this->scheduleService->createSchedule($validated);

        return redirect()->route('schedules.index')
            ->with('success', 'Schedule created successfully');
    }


    public function show(BackupSchedule $schedule)
    {
        $schedule->load(['sourceConnection', 'destinationConnection']);

        $recentRuns = $schedule->backupOperations()
            ->with(['sourceConnection', 'destinationConnection'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('Schedules/Show', [
            'schedule' => $schedule,
            'recentRuns' => $recentRuns,
        ]);
    }

    public function edit(BackupSchedule $schedule)
    {
        $sources = Connection::whereIn('type', ['s3', 'mongodb'])->get();
        $destinations = Connection::whereIn('type', ['s3_destination', 'google_drive', 'local_storage'])->get();

        return Inertia::render('Schedules/Edit', [
            'schedule' => $schedule,
            'sources' => $sources,
            'destinations' => $destinations,
        ]);
    }

    public function update(Request $request, BackupSchedule $schedule)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:backup_schedules,name,' . $schedule->id,
            'source_connection_id' => 'required|exists:connections,id',
            'destination_connection_id' => 'required|exists:connections,id',
            'frequency_preset' => 'required|in:hourly,daily,weekly,monthly,custom',
            'cron_expression' => 'required_if:frequency_preset,custom|nullable|string',
            'is_active' => 'boolean',
            'retention_count' => 'nullable|integer|min:1',
            'retention_days' => 'nullable|integer|min:1',
        ]);

        $this->scheduleService->updateSchedule($schedule, $validated);

        return redirect()->route('schedules.index')
            ->with('success', 'Schedule updated successfully');
    }

    public function destroy(BackupSchedule $schedule)
    {
        $schedule->delete();

        return redirect()->route('schedules.index')
            ->with('success', 'Schedule deleted successfully');
    }

    public function toggle(BackupSchedule $schedule)
    {
        $schedule->update(['is_active' => !$schedule->is_active]);

        return back()->with('success',
            $schedule->is_active ? 'Schedule activated' : 'Schedule paused'
        );
    }

    public function runNow(BackupSchedule $schedule)
    {
        $this->scheduleService->runSchedule($schedule);

        return redirect()->route('schedules.show', $schedule)
            ->with('success', 'Backup initiated');
    }
}
