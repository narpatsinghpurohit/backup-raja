<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For SQLite, we need to recreate the table to modify the enum
        // For other databases, we could use ALTER TABLE
        
        if (DB::getDriverName() === 'sqlite') {
            // Create a temporary table with the new enum values
            Schema::create('connections_temp', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->enum('type', ['s3', 'mongodb', 'google_drive', 's3_destination', 'local_storage']);
                $table->text('credentials');
                $table->boolean('is_active')->default(true);
                $table->timestamp('last_validated_at')->nullable();
                $table->timestamps();
                
                $table->index('type');
                $table->index('is_active');
            });
            
            // Copy data from old table to new table
            DB::statement('INSERT INTO connections_temp SELECT * FROM connections');
            
            // Drop old table
            Schema::dropIfExists('connections');
            
            // Rename temp table to connections
            Schema::rename('connections_temp', 'connections');
        } else {
            // For MySQL/PostgreSQL, modify the enum column
            DB::statement("ALTER TABLE connections MODIFY COLUMN type ENUM('s3', 'mongodb', 'google_drive', 's3_destination', 'local_storage')");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            // Create a temporary table with the old enum values
            Schema::create('connections_temp', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->enum('type', ['s3', 'mongodb', 'google_drive', 's3_destination']);
                $table->text('credentials');
                $table->boolean('is_active')->default(true);
                $table->timestamp('last_validated_at')->nullable();
                $table->timestamps();
                
                $table->index('type');
                $table->index('is_active');
            });
            
            // Copy data (excluding local_storage types)
            DB::statement("INSERT INTO connections_temp SELECT * FROM connections WHERE type != 'local_storage'");
            
            // Drop old table
            Schema::dropIfExists('connections');
            
            // Rename temp table to connections
            Schema::rename('connections_temp', 'connections');
        } else {
            DB::statement("ALTER TABLE connections MODIFY COLUMN type ENUM('s3', 'mongodb', 'google_drive', 's3_destination')");
        }
    }
};
