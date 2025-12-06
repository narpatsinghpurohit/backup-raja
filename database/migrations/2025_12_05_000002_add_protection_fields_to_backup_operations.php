<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('backup_operations', function (Blueprint $table) {
            $table->boolean('is_protected')->default(false)->after('error_message');
            $table->boolean('is_deleted')->default(false)->after('is_protected');
            $table->timestamp('deleted_at')->nullable()->after('is_deleted');
        });
    }

    public function down(): void
    {
        Schema::table('backup_operations', function (Blueprint $table) {
            $table->dropColumn(['is_protected', 'is_deleted', 'deleted_at']);
        });
    }
};
