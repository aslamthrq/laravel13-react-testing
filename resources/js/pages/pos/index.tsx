import { Head, Link, router, usePage } from '@inertiajs/react';
import { Minus, Plus, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { formatIdr } from '@/lib/format-money';
import { dashboard } from '@/routes';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';

type ProductRow = {
    id: number;
    name: string;
    sku: string | null;
    price: number;
    stock: number;
    category: { id: number; name: string } | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
    { title: 'POS', href: '/pos' },
];

export default function PosIndex({ products }: { products: ProductRow[] }) {
    const { errors } = usePage().props;
    const [query, setQuery] = useState('');
    const [cart, setCart] = useState<Record<number, number>>({});
    const [processing, setProcessing] = useState(false);

    const productById = useMemo(() => {
        const m = new Map<number, ProductRow>();
        products.forEach((p) => m.set(p.id, p));
        return m;
    }, [products]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) {
            return products;
        }
        return products.filter((p) => {
            const inName = p.name.toLowerCase().includes(q);
            const inSku = p.sku?.toLowerCase().includes(q);
            const inCat = p.category?.name.toLowerCase().includes(q);
            return inName || inSku || inCat;
        });
    }, [products, query]);

    const lines = useMemo(() => {
        return Object.entries(cart)
            .filter(([, qty]) => qty > 0)
            .map(([id, quantity]) => {
                const p = productById.get(Number(id));
                if (!p) {
                    return null;
                }
                return {
                    product: p,
                    quantity,
                    lineTotal: p.price * quantity,
                };
            })
            .filter(Boolean) as {
            product: ProductRow;
            quantity: number;
            lineTotal: number;
        }[];
    }, [cart, productById]);

    const grandTotal = lines.reduce((s, l) => s + l.lineTotal, 0);

    const setQty = (product: ProductRow, next: number) => {
        setCart((prev) => {
            const copy = { ...prev };
            if (next <= 0) {
                delete copy[product.id];
            } else {
                copy[product.id] = Math.min(next, product.stock);
            }
            return copy;
        });
    };

    const addOne = (product: ProductRow) => {
        const current = cart[product.id] ?? 0;
        setQty(product, current + 1);
    };

    const checkout = () => {
        const items = lines.map((l) => ({
            product_id: l.product.id,
            quantity: l.quantity,
        }));
        router.post(
            '/pos',
            { items },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => setCart({}),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="POS penjualan" />

            <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start">
                <div className="flex min-w-0 flex-1 flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                POS penjualan
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Tambahkan item ke keranjang lalu proses pembayaran.
                            </p>
                        </div>
                        <Button variant="outline" asChild size="sm">
                            <Link href="/products" prefetch>
                                Kelola produk
                            </Link>
                        </Button>
                    </div>

                    <div className="relative max-w-md">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Cari nama, SKU, atau kategori…"
                            className="pl-9"
                        />
                    </div>

                    {products.length === 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Belum ada produk siap jual</CardTitle>
                                <CardDescription>
                                    Tambahkan produk aktif dengan stok lebih
                                    dari nol.
                                </CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button asChild>
                                    <Link href="/products/create">
                                        Tambah produk
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {filtered.map((p) => {
                                const inCart = cart[p.id] ?? 0;
                                return (
                                    <Card
                                        key={p.id}
                                        className="border-sidebar-border/70 flex flex-col dark:border-sidebar-border"
                                    >
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base leading-snug">
                                                {p.name}
                                            </CardTitle>
                                            <CardDescription>
                                                {p.category?.name ?? 'Tanpa kategori'}
                                                {p.sku ? ` · ${p.sku}` : ''}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex flex-1 flex-col gap-3 pb-3">
                                            <p className="text-lg font-semibold tabular-nums">
                                                {formatIdr(p.price)}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                Stok: {p.stock}
                                            </p>
                                            {inCart > 0 ? (
                                                <div className="mt-auto flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="shrink-0"
                                                        onClick={() =>
                                                            setQty(
                                                                p,
                                                                inCart - 1,
                                                            )
                                                        }
                                                    >
                                                        <Minus className="size-4" />
                                                    </Button>
                                                    <span className="min-w-[2ch] text-center text-sm font-medium tabular-nums">
                                                        {inCart}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="shrink-0"
                                                        disabled={
                                                            inCart >= p.stock
                                                        }
                                                        onClick={() =>
                                                            addOne(p)
                                                        }
                                                    >
                                                        <Plus className="size-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    className="mt-auto w-full"
                                                    onClick={() => addOne(p)}
                                                    disabled={p.stock < 1}
                                                >
                                                    Tambah
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {filtered.length === 0 && products.length > 0 ? (
                        <p className="text-muted-foreground text-sm">
                            Tidak ada produk yang cocok dengan pencarian.
                        </p>
                    ) : null}
                </div>

                <Card className="border-sidebar-border/70 w-full shrink-0 lg:sticky lg:top-4 lg:w-96 dark:border-sidebar-border">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="size-5" />
                            <CardTitle>Keranjang</CardTitle>
                        </div>
                        <CardDescription>
                            {lines.length} jenis barang ·{' '}
                            {formatIdr(grandTotal)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <InputError message={errors?.items} />
                        {lines.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                Keranjang kosong. Pilih produk di sebelah kiri.
                            </p>
                        ) : (
                            <ul className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
                                {lines.map((l) => (
                                    <li
                                        key={l.product.id}
                                        className="flex gap-2 border-b border-border/60 pb-3 last:border-0"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {l.product.name}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                {formatIdr(l.product.price)} ×{' '}
                                                {l.quantity}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-sm font-semibold tabular-nums">
                                                {formatIdr(l.lineTotal)}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground size-8"
                                                onClick={() =>
                                                    setQty(l.product, 0)
                                                }
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 border-t pt-4">
                        <div className="flex w-full items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total</span>
                            <span className="text-lg font-bold tabular-nums">
                                {formatIdr(grandTotal)}
                            </span>
                        </div>
                        <Button
                            type="button"
                            className="w-full"
                            disabled={lines.length === 0 || processing}
                            onClick={checkout}
                        >
                            {processing ? 'Memproses…' : 'Proses pembayaran'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}
