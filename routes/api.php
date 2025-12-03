<?php

use App\Http\Controllers\Api\BackupLogController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/backups/{backup}/logs', [BackupLogController::class, 'index']);
    Route::get('/restores/{restore}/logs', [BackupLogController::class, 'restoreLogs']);
});
