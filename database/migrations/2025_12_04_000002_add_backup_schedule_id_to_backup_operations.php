<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('backup_operations', function (Blueprint $table) {
            $table->foreignId('backup_schedule_id')
                ->nullable()
                ->after('destination_connection_id')
                ->constrained('backup_schedules')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('backup_operations', function (Blueprint $table) {
            $table->dropForeign(['backup_schedule_id']);
            $table->dropColumn('backup_schedule_id');
        });
    }
};
