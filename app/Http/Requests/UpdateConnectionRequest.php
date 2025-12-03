<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateConnectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'name' => ['sometimes', 'string', 'max:255'],
            'type' => ['sometimes', 'in:s3,mongodb,google_drive,s3_destination'],
            'credentials' => ['sometimes', 'array'],
        ];

        // Add type-specific validation rules if credentials are being updated
        if ($this->has('credentials')) {
            // Get type from request or from the existing connection
            $type = $this->input('type');
            if (!$type && $this->route('connection')) {
                $type = $this->route('connection')->type;
            }
            
            if (in_array($type, ['s3', 's3_destination'])) {
                $rules['credentials.access_key'] = ['required', 'string'];
                $rules['credentials.secret_key'] = ['required', 'string'];
                $rules['credentials.region'] = ['required', 'string'];
                $rules['credentials.bucket'] = ['required', 'string'];
            } elseif ($type === 'mongodb') {
                $rules['credentials.uri'] = ['required', 'string'];
                $rules['credentials.database'] = ['required', 'string'];
            } elseif ($type === 'google_drive') {
                $rules['credentials.access_token'] = ['required', 'string'];
                $rules['credentials.refresh_token'] = ['nullable', 'string'];
                $rules['credentials.folder_id'] = ['nullable', 'string'];
            }
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'credentials.access_key.required' => 'The access key is required.',
            'credentials.secret_key.required' => 'The secret key is required.',
            'credentials.region.required' => 'The region is required.',
            'credentials.bucket.required' => 'The bucket name is required.',
            'credentials.uri.required' => 'The connection URI is required.',
            'credentials.database.required' => 'The database name is required.',
            'credentials.access_token.required' => 'The access token is required.',
        ];
    }
}
