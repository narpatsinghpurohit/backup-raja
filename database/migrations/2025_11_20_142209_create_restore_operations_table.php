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
        Schema::create('restore_operations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('backup_operation_id')->constrained('backup_operations');
            $table->foreignId('destination_connection_id')->constrained('connections');
            $table->json('destination_config');
            $table->string('status'); // pending, running, completed, failed, cancelled
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
            
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('restore_operations');
    }
};
