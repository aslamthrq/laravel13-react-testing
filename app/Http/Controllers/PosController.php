<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePosSaleRequest;
use App\Models\KnowledgeItem;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function index(): Response
    {
        $products = Product::query()
            ->with('category:id,name')
            ->where('is_active', true)
            ->where('stock', '>', 0)
            ->orderBy('name')
            ->get()
            ->map(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'sku' => $p->sku,
                'price' => (float) $p->price,
                'stock' => $p->stock,
                'category' => $p->category ? [
                    'id' => $p->category->id,
                    'name' => $p->category->name,
                ] : null,
            ]);

        return Inertia::render('pos/index', [
            'products' => $products,
        ]);
    }

    public function store(StorePosSaleRequest $request): RedirectResponse
    {
        $userId = $request->user()?->id;
        $rows = collect($request->validated('items'))
            ->groupBy('product_id')
            ->map(fn ($group) => [
                'product_id' => (int) $group->first()['product_id'],
                'quantity' => (int) $group->sum('quantity'),
            ])
            ->values();

        $sale = DB::transaction(function () use ($rows, $userId) {
            $productIds = $rows->pluck('product_id')->all();
            $products = Product::query()
                ->whereIn('id', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $lines = [];
            $subtotal = 0;

            foreach ($rows as $row) {
                $product = $products->get($row['product_id']);

                if (! $product || ! $product->is_active) {
                    throw ValidationException::withMessages([
                        'items' => 'Salah satu produk tidak tersedia.',
                    ]);
                }

                if ($product->stock < $row['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => "Stok tidak cukup untuk \"{$product->name}\" (tersisa {$product->stock}).",
                    ]);
                }

                $unit = (float) $product->price;
                $lineTotal = round($unit * $row['quantity'], 2);
                $subtotal += $lineTotal;

                $lines[] = [
                    'product' => $product,
                    'quantity' => $row['quantity'],
                    'unit_price' => $unit,
                    'line_total' => $lineTotal,
                ];
            }

            $tempInvoice = 'PND-'.str_replace('.', '', uniqid('', true));

            $sale = Sale::query()->create([
                'invoice_number' => $tempInvoice,
                'user_id' => $userId,
                'subtotal' => $subtotal,
                'grand_total' => $subtotal,
            ]);

            foreach ($lines as $line) {
                /** @var Product $product */
                $product = $line['product'];

                SaleItem::query()->create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'line_total' => $line['line_total'],
                ]);

                $product->decrement('stock', $line['quantity']);

                // Sync konten knowledge_items agar pertanyaan stok berbasis data terbaru.
                // (decrement() tidak memicu model events, jadi kita sinkronkan manual)
                $product->refresh();
                $product->loadMissing('category:id,name');
                KnowledgeItem::syncFromProduct($product);
            }

            $sale->update([
                'invoice_number' => 'INV-'.now()->format('Ymd').'-'.str_pad((string) $sale->id, 6, '0', STR_PAD_LEFT),
            ]);

            return $sale->fresh();
        });

        return redirect()->route('pos.index')
            ->with('success', "Transaksi berhasil. Invoice: {$sale->invoice_number}");
    }
}
