<?php

namespace App\Http\Controllers;

use App\Ai\Agents\TanyaAssistant;
use App\Http\Requests\TanyaAskRequest;
use App\Models\KnowledgeItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class TanyaController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('tanya/index', [
            'conversationId' => $request->session()->get('tanya_conversation_id'),
        ]);
    }

    public function ask(TanyaAskRequest $request): JsonResponse
    {
        $user = $request->user();
        $message = $request->validated('message');
        $conversationId = $request->validated('conversation_id')
            ?? $request->session()->get('tanya_conversation_id');

        $agent = new TanyaAssistant;

        $prompt = $message;

        try {
            // Agar benar-benar memanfaatkan vector, controller lebih dulu mencari dokumen
            // paling relevan dari `knowledge_items` dan menyisipkannya ke prompt.
            if (Schema::getConnection()->getDriverName() === 'pgsql') {
                $matches = KnowledgeItem::query()
                    ->whereNotNull('embedding')
                    ->whereVectorSimilarTo('embedding', $message, minSimilarity: 0.4)
                    ->limit(12)
                    ->get();

                // Jika embeddings belum terisi (atau vector search tidak menemukan),
                // fallback ke pencarian string biasa supaya pengguna tetap mendapat
                // jawaban berbasis database yang ada.
                if ($matches->isEmpty()) {
                    $like = '%'.$message.'%';

                    $matches = KnowledgeItem::query()
                        ->where('title', 'ilike', $like)
                        ->orWhere('content', 'ilike', $like)
                        ->limit(12)
                        ->get();
                }

                if ($matches->isNotEmpty()) {
                    $context = $matches
                        ->map(fn (KnowledgeItem $item) => "Title: {$item->title}\n{$item->content}")
                        ->join("\n\n---\n\n");

                    $prompt = $message."\n\nDATA TERKAIT (hasil pencarian vector):\n".$context;
                }
            }

            if (is_string($conversationId) && $conversationId !== '') {
                $response = $agent->continue($conversationId, as: $user)->prompt($prompt);
            } else {
                $response = $agent->forUser($user)->prompt($prompt);
            }
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Maaf, layanan AI tidak dapat menjawab saat ini. Pastikan `OPENAI_API_KEY` (atau provider lain di config/ai.php) sudah benar, lalu coba lagi.',
            ], 503);
        }

        if ($response->conversationId) {
            $request->session()->put('tanya_conversation_id', $response->conversationId);
        }

        return response()->json([
            'reply' => (string) $response,
            'conversation_id' => $response->conversationId,
        ]);
    }

    public function reset(Request $request): RedirectResponse
    {
        $request->session()->forget('tanya_conversation_id');

        return redirect()->route('tanya.index')
            ->with('success', 'Percakapan baru dimulai.');
    }
}
