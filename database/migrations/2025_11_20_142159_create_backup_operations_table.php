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
        Schema::create('backup_operations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('source_connection_id')->constrained('connections');
            $table->foreignId('destination_connection_id')->constrained('connections');
            $table->string('status'); // pending, running, completed, failed, paused, cancelled
            $table->string('archive_path', 500)->nullable();
            $table->bigInteger('archive_size')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
            
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('backup_operations');
    }
};
