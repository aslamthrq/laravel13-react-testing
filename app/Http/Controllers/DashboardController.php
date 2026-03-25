<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $today = now()->startOfDay();

        $recentSales = Sale::query()
            ->with('user:id,name')
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (Sale $sale) => [
                'id' => $sale->id,
                'invoice_number' => $sale->invoice_number,
                'grand_total' => (float) $sale->grand_total,
                'created_at' => $sale->created_at->toIso8601String(),
                'cashier' => $sale->user?->name,
            ]);

        return Inertia::render('dashboard', [
            'stats' => [
                'categories' => Category::query()->count(),
                'products' => Product::query()->count(),
                'active_products' => Product::query()->where('is_active', true)->count(),
                'low_stock' => Product::query()->where('stock', '<', 10)->where('is_active', true)->count(),
                'sales_today' => Sale::query()->where('created_at', '>=', $today)->count(),
                'revenue_today' => (float) Sale::query()->where('created_at', '>=', $today)->sum('grand_total'),
            ],
            'recentSales' => $recentSales,
        ]);
    }
}
