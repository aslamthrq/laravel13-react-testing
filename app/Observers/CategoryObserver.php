<?php

namespace App\Observers;

use App\Models\Category;
use App\Models\KnowledgeItem;

class CategoryObserver
{
    public function saved(Category $category): void
    {
        KnowledgeItem::syncFromCategory($category);
    }

    public function deleted(Category $category): void
    {
        KnowledgeItem::query()
            ->where('title', "category:{$category->id}")
            ->delete();
    }
}
