<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\KnowledgeItem;
use App\Models\Product;
use Illuminate\Database\Seeder;

class KnowledgeItemSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            [
                'title' => 'Ringkasan modul aplikasi toko',
                'content' => 'Aplikasi ini punya Dashboard (ringkasan kategori, produk, stok menipis, penjualan hari ini), Master Kategori untuk mengelompokkan produk, Master Produk untuk SKU/harga/stok/status aktif, dan POS untuk menjual barang dan mengurangi stok otomatis. Menu navigasi ada di sidebar.',
            ],
            [
                'title' => 'Cara menggunakan POS',
                'content' => 'Buka menu POS. Pilih produk yang aktif dan masih ada stok. Tambah ke keranjang, sesuaikan jumlah, lalu klik Proses pembayaran. Sistem membuat invoice, menyimpan penjualan, dan mengurangi stok. Produk nonaktif atau stok nol tidak muncul di katalog POS.',
            ],
            [
                'title' => 'Master kategori dan produk',
                'content' => 'Kategori harus ada sebelum menambah produk. Produk wajib punya kategori, nama, harga, dan stok. SKU opsional. Centang produk aktif agar muncul di POS. Hapus kategori ditolak jika masih ada produk di kategori tersebut.',
            ],
        ];

        foreach ($items as $row) {
            KnowledgeItem::query()->updateOrCreate(
                ['title' => $row['title']],
                ['content' => $row['content']],
            );
        }

        // Ingest data nyata dari database agar Tanya bisa menjawab kondisi sistem.
        Category::query()->orderBy('name')->get()->each(function (Category $c) {
            KnowledgeItem::syncFromCategory($c);
        });

        Product::query()
            ->with('category')
            ->orderByDesc('id')
            ->get()
            ->each(function (Product $p) {
                KnowledgeItem::syncFromProduct($p);
            });
    }
}
