<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $connections = \App\Models\Connection::count();
        $recentBackups = \App\Models\BackupOperation::with(['sourceConnection', 'destinationConnection'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();
        $stats = [
            'total_backups' => \App\Models\BackupOperation::count(),
            'successful_backups' => \App\Models\BackupOperation::where('status', 'completed')->count(),
            'failed_backups' => \App\Models\BackupOperation::where('status', 'failed')->count(),
            'total_connections' => $connections,
        ];

        return Inertia::render('dashboard', [
            'connections' => $connections,
            'recentBackups' => $recentBackups,
            'stats' => $stats,
        ]);
    })->name('dashboard');

    // Google OAuth Routes
    Route::get('oauth/google/redirect', [\App\Http\Controllers\GoogleOAuthController::class, 'redirect'])->name('oauth.google.redirect');
    Route::get('oauth/google/callback', [\App\Http\Controllers\GoogleOAuthController::class, 'callback'])->name('oauth.google.callback');

    // Connection Management Routes
    Route::get('connections/create/google-drive', [\App\Http\Controllers\ConnectionController::class, 'createGoogleDrive'])->name('connections.create.google-drive');
    Route::get('connections/{connection}/duplicate', [\App\Http\Controllers\ConnectionController::class, 'duplicate'])->name('connections.duplicate');
    Route::resource('connections', \App\Http\Controllers\ConnectionController::class);

    // Backup Management Routes
    Route::resource('backups', \App\Http\Controllers\BackupController::class)->only(['index', 'create', 'store', 'show']);
    Route::post('backups/{backup}/pause', [\App\Http\Controllers\BackupController::class, 'pause'])->name('backups.pause');
    Route::post('backups/{backup}/cancel', [\App\Http\Controllers\BackupController::class, 'cancel'])->name('backups.cancel');
    Route::post('backups/{backup}/resume', [\App\Http\Controllers\BackupController::class, 'resume'])->name('backups.resume');

    // Restore Management Routes
    Route::get('backups/{backup}/restore', [\App\Http\Controllers\RestoreController::class, 'create'])->name('restores.create');
    Route::post('backups/{backup}/restore', [\App\Http\Controllers\RestoreController::class, 'store'])->name('restores.store');
    Route::get('restores/{restore}', [\App\Http\Controllers\RestoreController::class, 'show'])->name('restores.show');
});

require __DIR__.'/settings.php';
