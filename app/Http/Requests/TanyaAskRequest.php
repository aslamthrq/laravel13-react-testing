<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TanyaAskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'message' => ['required', 'string', 'max:8000'],
            'conversation_id' => ['nullable', 'string', 'uuid'],
        ];
    }
}
