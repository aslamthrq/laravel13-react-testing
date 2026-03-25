<?php

namespace Tests\Feature;

use App\Ai\Agents\TanyaAssistant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TanyaTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_visit_tanya(): void
    {
        $this->get(route('tanya.index'))
            ->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_tanya_page(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->get(route('tanya.index'))
            ->assertOk();
    }

    public function test_ask_endpoint_returns_fake_agent_response(): void
    {
        TanyaAssistant::fake(['Ini jawaban uji coba.']);

        $user = User::factory()->create();
        $this->actingAs($user);

        $this->postJson(route('tanya.ask'), [
            'message' => 'Halo',
        ])
            ->assertOk()
            ->assertJson([
                'reply' => 'Ini jawaban uji coba.',
            ]);
    }
}
