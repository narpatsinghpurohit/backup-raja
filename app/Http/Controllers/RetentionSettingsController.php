<?php

namespace App\Http\Controllers;

use App\Services\CleanupService;
use App\Services\RetentionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RetentionSettingsController extends Controller
{
    public function __construct(
        private RetentionService $retentionService,
        private CleanupService $cleanupService
    ) {}

    public function index()
    {
        $expiredBackups = $this->retentionService->getExpiredBackups();

        // Load relationships for each backup
        $expiredBackups->each(function ($backup) {
            $backup->load(['sourceConnection', 'destinationConnection']);
        });

        return Inertia::render('settings/retention', [
            'settings' => [
                'retention_count' => $this->retentionService->getGlobalSetting('retention_count'),
                'retention_days' => $this->retentionService->getGlobalSetting('retention_days'),
            ],
            'expiredBackups' => $expiredBackups,
            'expiredCount' => $expiredBackups->count(),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'retention_count' => 'nullable|integer|min:1',
            'retention_days' => 'nullable|integer|min:1',
        ]);

        $this->retentionService->setGlobalSetting('retention_count', $validated['retention_count']);
        $this->retentionService->setGlobalSetting('retention_days', $validated['retention_days']);

        return back()->with('success', 'Retention settings updated');
    }

    public function cleanupPreview()
    {
        $expiredBackups = $this->retentionService->getExpiredBackups()
            ->load(['sourceConnection', 'destinationConnection']);

        return response()->json([
            'backups' => $expiredBackups,
            'count' => $expiredBackups->count(),
        ]);
    }

    public function runCleanup()
    {
        $results = $this->cleanupService->runCleanup();

        if ($results['failed'] > 0) {
            return back()->with('warning', "Cleanup completed with errors. Deleted: {$results['deleted']}, Failed: {$results['failed']}");
        }

        return back()->with('success', "Cleanup completed. Deleted {$results['deleted']} backup(s).");
    }
}
