<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Note: The 'local_storage' type is now included in the original connections migration.
     * This migration is kept for reference but no longer needs to modify the column
     * since we use string instead of enum for the type column.
     */
    public function up(): void
    {
        // No-op: Type column is now a string, so it accepts any value including 'local_storage'
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op
    }
};
