import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { formatIdr } from '@/lib/format-money';
import { dashboard } from '@/routes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

type ProductRow = {
    id: number;
    name: string;
    sku: string | null;
    price: number;
    stock: number;
    is_active: boolean;
    category: { id: number; name: string } | null;
};

/** Matches Laravel `LengthAwarePaginator::toArray()` JSON shape for Inertia. */
type LaravelPaginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
    { title: 'Produk', href: '/products' },
];

export default function ProductsIndex({
    products,
}: {
    products: LaravelPaginator<ProductRow>;
}) {
    const destroy = (id: number, name: string) => {
        if (!confirm(`Hapus produk "${name}"?`)) {
            return;
        }
        router.delete(`/products/${id}`, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Master produk" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Master produk
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Harga, stok, dan status aktif untuk penjualan di POS.
                        </p>
                    </div>
                    <Button asChild className="gap-2 self-start sm:self-auto">
                        <Link href="/products/create" prefetch>
                            <Plus className="size-4" />
                            Tambah produk
                        </Link>
                    </Button>
                </div>

                <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                    <CardHeader>
                        <CardTitle>Daftar produk</CardTitle>
                        <CardDescription>
                            Total {products.total} produk
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full min-w-[640px] text-left text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            Produk
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Kategori
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            SKU
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Harga
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Stok
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="text-muted-foreground px-4 py-8 text-center"
                                            >
                                                Belum ada produk. Buat kategori
                                                terlebih dahulu.
                                            </td>
                                        </tr>
                                    ) : (
                                        products.data.map((p) => (
                                            <tr
                                                key={p.id}
                                                className="border-t"
                                            >
                                                <td className="px-4 py-3 font-medium">
                                                    {p.name}
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3">
                                                    {p.category?.name ?? '—'}
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3 font-mono text-xs">
                                                    {p.sku ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    {formatIdr(p.price)}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    {p.stock}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {p.is_active ? (
                                                        <Badge>Aktif</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            Nonaktif
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/products/${p.id}/edit`}
                                                                prefetch
                                                            >
                                                                <Pencil className="size-4" />
                                                                <span className="sr-only">
                                                                    Ubah
                                                                </span>
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                            type="button"
                                                            onClick={() =>
                                                                destroy(
                                                                    p.id,
                                                                    p.name,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="size-4" />
                                                            <span className="sr-only">
                                                                Hapus
                                                            </span>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {products.last_page > 1 ? (
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-muted-foreground text-sm">
                                    Halaman {products.current_page} dari{' '}
                                    {products.last_page}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!products.prev_page_url}
                                        asChild={!!products.prev_page_url}
                                    >
                                        {products.prev_page_url ? (
                                            <Link
                                                href={products.prev_page_url}
                                                preserveScroll
                                            >
                                                Sebelumnya
                                            </Link>
                                        ) : (
                                            <span>Sebelumnya</span>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!products.next_page_url}
                                        asChild={!!products.next_page_url}
                                    >
                                        {products.next_page_url ? (
                                            <Link
                                                href={products.next_page_url}
                                                preserveScroll
                                            >
                                                Berikutnya
                                            </Link>
                                        ) : (
                                            <span>Berikutnya</span>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
