<?php

namespace App\Observers;

use App\Models\KnowledgeItem;
use App\Models\Product;

class ProductObserver
{
    public function saved(Product $product): void
    {
        $product->loadMissing('category');

        KnowledgeItem::syncFromProduct($product);
    }

    public function deleted(Product $product): void
    {
        KnowledgeItem::query()
            ->where('title', "product:{$product->id}")
            ->delete();
    }
}
