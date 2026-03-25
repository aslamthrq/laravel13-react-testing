import { Form, Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

type Category = {
    id: number;
    name: string;
    description: string | null;
};

export default function CategoriesEdit({ category }: { category: Category }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Kategori', href: '/categories' },
        {
            title: 'Ubah',
            href: `/categories/${category.id}/edit`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Ubah kategori — ${category.name}`} />

            <div className="mx-auto flex max-w-lg flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Ubah kategori
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Perbarui nama atau deskripsi kategori.
                    </p>
                </div>

                <Form
                    action={`/categories/${category.id}`}
                    method="post"
                    options={{
                        preserveScroll: true,
                    }}
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
                                <Label htmlFor="name">Nama kategori</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    defaultValue={category.name}
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={4}
                                    defaultValue={
                                        category.description ?? undefined
                                    }
                                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <InputError message={errors.description} />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    Simpan perubahan
                                </Button>
                                <Button variant="secondary" asChild>
                                    <Link href="/categories">Batal</Link>
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
