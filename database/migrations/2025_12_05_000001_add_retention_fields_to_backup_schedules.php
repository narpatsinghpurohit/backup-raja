<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('backup_schedules', function (Blueprint $table) {
            $table->integer('retention_count')->nullable()->after('is_active');
            $table->integer('retention_days')->nullable()->after('retention_count');
        });
    }

    public function down(): void
    {
        Schema::table('backup_schedules', function (Blueprint $table) {
            $table->dropColumn(['retention_count', 'retention_days']);
        });
    }
};
