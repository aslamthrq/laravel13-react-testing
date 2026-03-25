import { usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function FlashMessages() {
    const { flash } = usePage().props;

    if (!flash?.success && !flash?.error) {
        return null;
    }

    return (
        <div className="mx-4 mt-4 space-y-3 md:mx-0">
            {flash.success ? (
                <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-50">
                    <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" />
                    <AlertTitle>Berhasil</AlertTitle>
                    <AlertDescription>{flash.success}</AlertDescription>
                </Alert>
            ) : null}
            {flash.error ? (
                <Alert variant="destructive">
                    <AlertCircle />
                    <AlertTitle>Perhatian</AlertTitle>
                    <AlertDescription>{flash.error}</AlertDescription>
                </Alert>
            ) : null}
        </div>
    );
}
