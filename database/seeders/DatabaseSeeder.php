<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $makanan = Category::query()->create([
            'name' => 'Makanan',
            'description' => 'Camilan dan hidangan',
        ]);

        $minuman = Category::query()->create([
            'name' => 'Minuman',
            'description' => 'Kopi, teh, dan lainnya',
        ]);

        $samples = [
            ['category_id' => $makanan->id, 'name' => 'Nasi goreng', 'sku' => 'MK-001', 'price' => 25000, 'stock' => 40],
            ['category_id' => $makanan->id, 'name' => 'Mie goreng', 'sku' => 'MK-002', 'price' => 22000, 'stock' => 35],
            ['category_id' => $minuman->id, 'name' => 'Kopi hitam', 'sku' => 'MN-001', 'price' => 12000, 'stock' => 60],
            ['category_id' => $minuman->id, 'name' => 'Teh manis', 'sku' => 'MN-002', 'price' => 8000, 'stock' => 80],
        ];

        foreach ($samples as $row) {
            Product::query()->create([...$row, 'is_active' => true]);
        }

        $this->call(KnowledgeItemSeeder::class);
    }
}
