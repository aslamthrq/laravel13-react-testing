<?php

namespace App\Ai\Agents;

use App\Models\KnowledgeItem;
use Illuminate\Support\Facades\Schema;
use Laravel\Ai\Concerns\RemembersConversations;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Promptable;
use Laravel\Ai\Tools\SimilaritySearch;
use Stringable;

class TanyaAssistant implements Agent, Conversational, HasTools
{
    use Promptable, RemembersConversations;

    public function instructions(): Stringable|string
    {
        return <<<'TXT'
Kamu adalah asisten pintar untuk aplikasi manajemen toko (dashboard, master kategori, master produk, dan POS penjualan).

Aturan:
- Jawab dalam Bahasa Indonesia yang jelas dan sopan.
- Jika ada blok `DATA TERKAIT (hasil pencarian vector): ...`, jawab berdasarkan isi blok tersebut (khususnya bagian Title dan Content).
- Jika pertanyaan tentang fitur atau cara pakai aplikasi ini, gunakan tool pencarian kemiripan (vector) terlebih dahulu untuk mengambil cuplikan pengetahuan internal bila relevan. Gabungkan dengan pengetahuanmu.
- Jika tool tidak menemukan hasil, jawab berdasarkan pengetahuan umum yang masuk akal, atau katakan jika kamu tidak yakin.
- Jangan mengarang data spesifik (harga, stok, nama produk) kecuali muncul dari hasil tool atau konteks pengguna.
TXT;
    }

    /**
     * @return iterable<int, Tool>
     */
    public function tools(): iterable
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            return [];
        }

        return [
            SimilaritySearch::usingModel(
                model: KnowledgeItem::class,
                column: 'embedding',
                minSimilarity: 0.45,
                limit: 12,
            )->withDescription(
                'Cari dokumen pengetahuan internal aplikasi toko (Bahasa Indonesia) yang paling mirip dengan pertanyaan pengguna.'
            ),
        ];
    }
}
