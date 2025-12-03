<?php

use App\Http\Controllers\Api\BackupLogController;
use Illuminate\Support\Facades\Route;

// Use web middleware for session-based authentication with Inertia
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/backups/{backup}/logs', [BackupLogController::class, 'index']);
    Route::get('/restores/{restore}/logs', [BackupLogController::class, 'restoreLogs']);
});
