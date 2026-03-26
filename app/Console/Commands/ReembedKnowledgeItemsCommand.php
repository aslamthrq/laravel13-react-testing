<?php

namespace App\Console\Commands;

use App\Models\KnowledgeItem;
use Illuminate\Console\Command;

class ReembedKnowledgeItemsCommand extends Command
{
    protected $signature = 'ai:reembed-knowledge-items
        {--limit=200 : Batas item yang dire-embed ulang}
    ';

    protected $description = 'Regenerate embeddings for knowledge_items using current AI config.';

    public function handle(): int
    {
        $limit = (int) $this->option('limit');
        $limit = $limit > 0 ? $limit : 200;

        // Embedding di observer akan diregenerasi saat field embedding bernilai null.
        $items = KnowledgeItem::query()
            ->whereNull('embedding')
            ->limit($limit)
            ->get();

        if ($items->isEmpty()) {
            $this->info('No knowledge_items found with null embedding.');

            return self::SUCCESS;
        }

        $this->info('Re-embedding knowledge_items: '.$items->count().' item(s).');

        foreach ($items as $item) {
            // Memastikan observer jalan saat encoding ulang.
            $item->embedding = null;
            $item->save();
        }

        $this->info('Done.');

        return self::SUCCESS;
    }
}

