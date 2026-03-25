import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

type CategoryRow = {
    id: number;
    name: string;
    description: string | null;
    products_count: number;
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
    { title: 'Kategori', href: '/categories' },
];

export default function CategoriesIndex({
    categories,
}: {
    categories: LaravelPaginator<CategoryRow>;
}) {
    const destroy = (id: number, name: string) => {
        if (
            !confirm(
                `Hapus kategori "${name}"? Pastikan tidak ada produk yang terhubung.`,
            )
        ) {
            return;
        }
        router.delete(`/categories/${id}`, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Master kategori" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Master kategori
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Kelompokkan produk agar mudah dicari di POS.
                        </p>
                    </div>
                    <Button asChild className="gap-2 self-start sm:self-auto">
                        <Link href="/categories/create" prefetch>
                            <Plus className="size-4" />
                            Tambah kategori
                        </Link>
                    </Button>
                </div>

                <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                    <CardHeader>
                        <CardTitle>Daftar kategori</CardTitle>
                        <CardDescription>
                            Total {categories.total} kategori
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full min-w-[480px] text-left text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            Nama
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Deskripsi
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Produk
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="text-muted-foreground px-4 py-8 text-center"
                                            >
                                                Belum ada kategori.
                                            </td>
                                        </tr>
                                    ) : (
                                        categories.data.map((c) => (
                                            <tr
                                                key={c.id}
                                                className="border-t"
                                            >
                                                <td className="px-4 py-3 font-medium">
                                                    {c.name}
                                                </td>
                                                <td className="text-muted-foreground max-w-xs truncate px-4 py-3">
                                                    {c.description ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    {c.products_count}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/categories/${c.id}/edit`}
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
                                                                    c.id,
                                                                    c.name,
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

                        {categories.last_page > 1 ? (
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-muted-foreground text-sm">
                                    Halaman {categories.current_page} dari{' '}
                                    {categories.last_page}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!categories.prev_page_url}
                                        asChild={!!categories.prev_page_url}
                                    >
                                        {categories.prev_page_url ? (
                                            <Link
                                                href={categories.prev_page_url}
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
                                        disabled={!categories.next_page_url}
                                        asChild={!!categories.next_page_url}
                                    >
                                        {categories.next_page_url ? (
                                            <Link
                                                href={categories.next_page_url}
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
