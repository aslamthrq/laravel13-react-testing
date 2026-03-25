import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Package,
    Receipt,
    Tags,
    TrendingUp,
    Warehouse,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { formatIdr } from '@/lib/format-money';
import { dashboard } from '@/routes';
import * as categoriesRoutes from '@/routes/categories';
import * as posRoutes from '@/routes/pos';
import * as productsRoutes from '@/routes/products';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
];

type RecentSale = {
    id: number;
    invoice_number: string;
    grand_total: number;
    created_at: string;
    cashier?: string | null;
};

type Stats = {
    categories: number;
    products: number;
    active_products: number;
    low_stock: number;
    sales_today: number;
    revenue_today: number;
};

export default function DashboardPage({
    stats,
    recentSales,
}: {
    stats: Stats;
    recentSales: RecentSale[];
}) {
    const statCards = [
        {
            title: 'Kategori',
            value: stats.categories,
            description: 'Master kategori',
            icon: Tags,
            href: categoriesRoutes.index(),
        },
        {
            title: 'Produk aktif',
            value: stats.active_products,
            description: `Dari ${stats.products} total produk`,
            icon: Package,
            href: productsRoutes.index(),
        },
        {
            title: 'Stok menipis',
            value: stats.low_stock,
            description: 'Di bawah 10 unit',
            icon: Warehouse,
            href: productsRoutes.index(),
        },
        {
            title: 'Penjualan hari ini',
            value: stats.sales_today,
            description: formatIdr(stats.revenue_today),
            icon: Receipt,
            href: posRoutes.index(),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Ringkasan toko
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Pantau kategori, produk, stok, dan penjualan dalam
                            satu layar.
                        </p>
                    </div>
                    <Button asChild className="gap-2 self-start md:self-auto">
                        <Link href={posRoutes.index()} prefetch>
                            <TrendingUp className="size-4" />
                            Buka POS
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((card) => (
                        <Card
                            key={card.title}
                            className="border-sidebar-border/70 shadow-sm dark:border-sidebar-border"
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {card.title}
                                </CardTitle>
                                <card.icon className="text-muted-foreground size-4" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold tabular-nums">
                                    {card.value}
                                </div>
                                <CardDescription className="mt-1">
                                    {card.description}
                                </CardDescription>
                                <Button
                                    variant="link"
                                    className="mt-2 h-auto px-0"
                                    asChild
                                >
                                    <Link href={card.href} prefetch>
                                        Kelola
                                        <ArrowRight className="ml-1 size-3" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                    <CardHeader>
                        <CardTitle>Transaksi terbaru</CardTitle>
                        <CardDescription>
                            Delapan penjualan terakhir dari POS
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentSales.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                Belum ada penjualan. Mulai dari halaman POS.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[520px] text-left text-sm">
                                    <thead>
                                        <tr className="text-muted-foreground border-b">
                                            <th className="pb-2 font-medium">
                                                Invoice
                                            </th>
                                            <th className="pb-2 font-medium">
                                                Kasir
                                            </th>
                                            <th className="pb-2 font-medium">
                                                Waktu
                                            </th>
                                            <th className="pb-2 text-right font-medium">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentSales.map((sale) => (
                                            <tr
                                                key={sale.id}
                                                className="border-b border-border/60 last:border-0"
                                            >
                                                <td className="py-2.5 font-mono text-xs">
                                                    {sale.invoice_number}
                                                </td>
                                                <td className="py-2.5">
                                                    {sale.cashier ?? '—'}
                                                </td>
                                                <td className="text-muted-foreground py-2.5">
                                                    {new Date(
                                                        sale.created_at,
                                                    ).toLocaleString('id-ID', {
                                                        dateStyle: 'short',
                                                        timeStyle: 'short',
                                                    })}
                                                </td>
                                                <td className="py-2.5 text-right font-medium tabular-nums">
                                                    {formatIdr(sale.grand_total)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
