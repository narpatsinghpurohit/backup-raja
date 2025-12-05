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
        Schema::create('backup_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('source_connection_id')->constrained('connections')->onDelete('cascade');
            $table->foreignId('destination_connection_id')->constrained('connections')->onDelete('cascade');
            $table->string('cron_expression');
            $table->string('frequency_preset')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_run_at')->nullable();
            $table->timestamp('next_run_at')->nullable();
            $table->string('last_run_status')->nullable();
            $table->integer('success_count')->default(0);
            $table->integer('failure_count')->default(0);
            $table->timestamps();

            $table->index('is_active');
            $table->index('next_run_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('backup_schedules');
    }
};
