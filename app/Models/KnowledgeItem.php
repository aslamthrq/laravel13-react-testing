<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KnowledgeItem extends Model
{
    protected $fillable = [
        'title',
        'content',
        'embedding',
    ];

    protected function casts(): array
    {
        return [
            'embedding' => 'array',
        ];
    }

    public static function syncFromCategory(Category $category): void
    {
        $content = trim(implode("\n", [
            "Kategori: {$category->name}",
            $category->description ? "Deskripsi: {$category->description}" : null,
        ]));

        self::query()->updateOrCreate(
            ['title' => "category:{$category->id}"],
            ['content' => $content],
        );
    }

    public static function syncFromProduct(Product $product): void
    {
        // Nama kategori dipakai agar user bisa tanya berdasarkan kategori.
        $categoryName = $product->category?->name;

        $content = trim(implode("\n", [
            "Produk: {$product->name}",
            $categoryName ? "Kategori: {$categoryName}" : null,
            $product->sku ? "SKU: {$product->sku}" : null,
            "Harga: {$product->price}",
            "Stok: {$product->stock}",
            'Aktif di POS: '.($product->is_active ? 'Ya' : 'Tidak'),
        ]));

        self::query()->updateOrCreate(
            ['title' => "product:{$product->id}"],
            ['content' => $content],
        );
    }
}
