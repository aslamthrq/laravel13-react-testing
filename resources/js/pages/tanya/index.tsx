import { Form, Head, Link } from '@inertiajs/react';
import { Loader2, MessageCircleQuestion, SendHorizontal } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import * as tanyaRoutes from '@/routes/tanya';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';

type ChatMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
};

function sanitizeReply(text: string): string {
    // Hilangkan penanda Markdown yang umum dari output model (mis. **teks**).
    let out = text;

    // Konversi bullet yang memakai '*' menjadi bullet normal.
    out = out.replace(/^\s*\*\s+/gm, '• ');

    // Hapus bold/italic marker.
    out = out.replace(/\*\*(.*?)\*\*/gs, '$1');
    out = out.replace(/__(.*?)__/gs, '$1');
    out = out.replace(/\*(.*?)\*/gs, '$1');
    out = out.replace(/_(.*?)_/gs, '$1');

    return out;
}

function readXsrfToken(): string {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
    { title: 'Tanya', href: tanyaRoutes.index() },
];

export default function TanyaPage({
    conversationId: initialConversationId,
}: {
    conversationId?: string | null;
}) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [conversationId, setConversationId] = useState<string | null>(
        initialConversationId ?? null,
    );
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setConversationId(initialConversationId ?? null);
    }, [initialConversationId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, sending]);

    const send = useCallback(async () => {
        const text = input.trim();
        if (!text || sending) {
            return;
        }

        setError(null);
        setInput('');
        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: text,
        };
        setMessages((m) => [...m, userMsg]);
        setSending(true);

        try {
            const res = await fetch(tanyaRoutes.ask.url(), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': readXsrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    message: text,
                    conversation_id: conversationId,
                }),
            });

            const data = (await res.json()) as {
                reply?: string;
                conversation_id?: string | null;
                message?: string;
            };

            if (!res.ok) {
                setError(
                    data.message ??
                        'Permintaan gagal. Periksa koneksi atau kunci API AI.',
                );
                return;
            }

            if (data.conversation_id) {
                setConversationId(data.conversation_id);
            }

            setMessages((m) => [
                ...m,
                {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: sanitizeReply(data.reply ?? ''),
                },
            ]);
        } catch {
            setError('Tidak dapat menghubungi server.');
        } finally {
            setSending(false);
        }
    }, [conversationId, input, sending]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tanya" />

            <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                            <MessageCircleQuestion className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Tanya
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Tanya apa saja tentang aplikasi atau topik umum.
                                Dengan PostgreSQL + pgvector, jawaban soal fitur
                                toko diperkaya dari basis pengetahuan internal (
                                <a
                                    className="text-primary underline-offset-4 hover:underline"
                                    href="https://laravel.com/docs/13.x/ai-sdk"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Laravel AI SDK
                                </a>
                                ).
                            </p>
                        </div>
                    </div>
                    <Form
                        {...tanyaRoutes.reset.form.post()}
                        className="shrink-0"
                    >
                        {({ processing }) => (
                            <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                                disabled={processing}
                            >
                                Percakapan baru
                            </Button>
                        )}
                    </Form>
                </div>

                <Card className="border-sidebar-border/70 flex min-h-[420px] flex-col dark:border-sidebar-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Percakapan</CardTitle>
                        <CardDescription>
                            Butuh{' '}
                            <code className="text-xs">OPENAI_API_KEY</code> di{' '}
                            <code className="text-xs">.env</code> (atau provider
                            lain di <code className="text-xs">config/ai.php</code>
                            ).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-3">
                        <div className="bg-muted/30 flex max-h-[min(52vh,420px)] min-h-[200px] flex-1 flex-col gap-3 overflow-y-auto rounded-lg border p-3">
                            {messages.length === 0 && !sending ? (
                                <p className="text-muted-foreground m-auto max-w-sm text-center text-sm">
                                    Contoh: &quot;Bagaimana cara pakai
                                    POS?&quot; atau &quot;Apa bedanya master
                                    kategori dan produk?&quot;
                                </p>
                            ) : null}
                            {messages.map((m) => (
                                <div
                                    key={m.id}
                                    className={
                                        m.role === 'user'
                                            ? 'ml-8 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground'
                                            : 'mr-8 rounded-lg border bg-card px-3 py-2 text-sm whitespace-pre-wrap'
                                    }
                                >
                                    {m.content}
                                </div>
                            ))}
                            {sending ? (
                                <div className="text-muted-foreground mr-8 flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
                                    <Loader2 className="size-4 animate-spin" />
                                    Menunggu balasan…
                                </div>
                            ) : null}
                            <div ref={bottomRef} />
                        </div>

                        {error ? (
                            <p className="text-destructive text-sm">{error}</p>
                        ) : null}

                        <form
                            className="flex gap-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                void send();
                            }}
                        >
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Tulis pertanyaan…"
                                disabled={sending}
                                autoComplete="off"
                                className="flex-1"
                            />
                            <Button type="submit" disabled={sending}>
                                <SendHorizontal className="size-4" />
                                <span className="sr-only">Kirim</span>
                            </Button>
                        </form>

                        <p className="text-muted-foreground text-xs">
                            <Link
                                href={dashboard()}
                                className="text-primary underline-offset-4 hover:underline"
                            >
                                Kembali ke dashboard
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
