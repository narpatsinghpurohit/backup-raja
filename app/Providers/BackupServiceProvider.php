<?php

namespace App\Providers;

use App\Services\BackupExecutor;
use App\Services\BackupService;
use App\Services\ConnectionService;
use App\Services\LogService;
use App\Services\RestoreExecutor;
use App\Services\RestoreService;
use App\Services\Validators\ConnectionValidatorFactory;
use Illuminate\Support\ServiceProvider;

class BackupServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(ConnectionValidatorFactory::class);
        $this->app->singleton(ConnectionService::class);
        $this->app->singleton(BackupExecutor::class);
        $this->app->singleton(BackupService::class);
        $this->app->singleton(RestoreExecutor::class);
        $this->app->singleton(RestoreService::class);
        $this->app->singleton(LogService::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
