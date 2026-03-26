<?php

namespace App\Observers;

use App\Models\KnowledgeItem;
use Illuminate\Support\Str;

class KnowledgeItemObserver
{
    public function saving(KnowledgeItem $item): void
    {
        // Hanya generate embedding saat belum tersedia.
        // Konten bisa berubah (mis. stok menurun di POS), tapi kita ingin
        // tetap punya vector untuk pencarian kemiripan tanpa biaya embedding ulang.
        $hasEmbedding = ! is_null($item->embedding)
            && $item->embedding !== []
            && $item->embedding !== '';

        if ($hasEmbedding) {
            return;
        }

        $text = trim($item->title."\n\n".$item->content);

        if ($text === '') {
            return;
        }

        try {
            // Sesuaikan dimensi dengan migration `knowledge_items.embedding` (pgvector).
            // Ollama model `nomic-embed-text` default menghasilkan vektor 768 dimensi.
            $item->embedding = Str::of($text)->toEmbeddings(dimensions: 768);
        } catch (\Throwable $e) {
            // Embedding gagal (mis. provider embedding tidak bisa diakses);
            // biarkan null tapi catat agar mudah debug.
            // Retry sederhana untuk kondisi rate limit sementara.
            for ($attempt = 1; $attempt <= 2; $attempt++) {
                $message = strtolower($e->getMessage());

                if (! str_contains($message, 'rate') && ! str_contains($message, '429')) {
                    break;
                }

                sleep(2 * $attempt);

                try {
                    $item->embedding = Str::of($text)->toEmbeddings(dimensions: 768);

                    return;
                } catch (\Throwable $e2) {
                    $e = $e2;
                }
            }

            logger()->warning('KnowledgeItem embedding failed', [
                'title' => $item->title,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
