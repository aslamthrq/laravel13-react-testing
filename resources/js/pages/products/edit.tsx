import { Form, Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

type CategoryOption = { id: number; name: string };

type Product = {
    id: number;
    category_id: number;
    name: string;
    sku: string | null;
    price: number;
    stock: number;
    is_active: boolean;
};

export default function ProductsEdit({
    product,
    categories,
}: {
    product: Product;
    categories: CategoryOption[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Produk', href: '/products' },
        { title: 'Ubah', href: `/products/${product.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Ubah produk — ${product.name}`} />

            <div className="mx-auto flex max-w-lg flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Ubah produk
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Perbarui harga, stok, atau status penjualan.
                    </p>
                </div>

                <Form
                    action={`/products/${product.id}`}
                    method="post"
                    options={{ preserveScroll: true }}
                    className="space-y-6 rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border"
                >
                    {({ errors, processing }) => (
                        <>
                            <input
                                type="hidden"
                                name="_method"
                                value="put"
                            />
                            <div className="grid gap-2">
                                <Label htmlFor="category_id">Kategori</Label>
                                <select
                                    id="category_id"
                                    name="category_id"
                                    required
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                    defaultValue={product.category_id}
                                >
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.category_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama produk</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    defaultValue={product.name}
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="sku">SKU</Label>
                                <Input
                                    id="sku"
                                    name="sku"
                                    defaultValue={product.sku ?? undefined}
                                />
                                <InputError message={errors.sku} />
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="price">Harga jual</Label>
                                    <Input
                                        id="price"
                                        name="price"
                                        type="number"
                                        min={0}
                                        step={1}
                                        required
                                        defaultValue={product.price}
                                    />
                                    <InputError message={errors.price} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="stock">Stok</Label>
                                    <Input
                                        id="stock"
                                        name="stock"
                                        type="number"
                                        min={0}
                                        step={1}
                                        required
                                        defaultValue={product.stock}
                                    />
                                    <InputError message={errors.stock} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    id="is_active"
                                    name="is_active"
                                    type="checkbox"
                                    value="1"
                                    defaultChecked={product.is_active}
                                    className="border-input text-primary focus-visible:ring-ring size-4 rounded border shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                />
                                <Label
                                    htmlFor="is_active"
                                    className="font-normal"
                                >
                                    Produk aktif (tampil di POS)
                                </Label>
                            </div>
                            <InputError message={errors.is_active} />
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    Simpan perubahan
                                </Button>
                                <Button variant="secondary" asChild>
                                    <Link href="/products">Batal</Link>
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
