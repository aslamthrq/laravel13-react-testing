<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            return;
        }

        Schema::ensureVectorExtensionExists();

        // Existing embeddings were generated with a different vector dimension.
        // Null them out first to avoid pgvector cast errors.
        DB::statement('UPDATE knowledge_items SET embedding = NULL');

        // Recreate index after changing vector dimensions.
        DB::statement('DROP INDEX IF EXISTS knowledge_items_embedding_vectorindex');

        // Align with Ollama embedding model `nomic-embed-text` (768 dims).
        DB::statement('ALTER TABLE knowledge_items ALTER COLUMN embedding TYPE vector(768)');

        DB::statement('CREATE INDEX knowledge_items_embedding_vectorindex ON public.knowledge_items USING hnsw (embedding vector_cosine_ops)');
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('UPDATE knowledge_items SET embedding = NULL');

        DB::statement('DROP INDEX IF EXISTS knowledge_items_embedding_vectorindex');

        DB::statement('ALTER TABLE knowledge_items ALTER COLUMN embedding TYPE vector(1536)');

        DB::statement('CREATE INDEX knowledge_items_embedding_vectorindex ON public.knowledge_items USING hnsw (embedding vector_cosine_ops)');
    }
};

