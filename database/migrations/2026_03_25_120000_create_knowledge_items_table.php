<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            Schema::ensureVectorExtensionExists();
        }

        Schema::create('knowledge_items', function (Blueprint $table) use ($driver) {
            $table->id();
            $table->string('title');
            $table->text('content');

            if ($driver === 'pgsql') {
                $table->vector('embedding', dimensions: 1536)->nullable();
            } else {
                $table->json('embedding')->nullable();
            }

            $table->timestamps();
        });

        if ($driver === 'pgsql') {
            Schema::table('knowledge_items', function (Blueprint $table) {
                $table->vectorIndex('embedding');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('knowledge_items');
    }
};
