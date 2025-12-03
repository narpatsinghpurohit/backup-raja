<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreConnectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:s3,mongodb,google_drive,s3_destination,local_storage'],
            'credentials' => ['required', 'array'],
        ];

        // Add type-specific validation rules
        $type = $this->input('type');
        
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
        } elseif ($type === 'local_storage') {
            $rules['credentials.disk'] = ['required', 'string', 'in:local,public'];
            $rules['credentials.path'] = ['required', 'string'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'name.required' => 'The connection name is required.',
            'type.required' => 'Please select a connection type.',
            'type.in' => 'Invalid connection type selected.',
            'credentials.required' => 'Connection credentials are required.',
            'credentials.access_key.required' => 'The access key is required.',
            'credentials.secret_key.required' => 'The secret key is required.',
            'credentials.region.required' => 'The region is required.',
            'credentials.bucket.required' => 'The bucket name is required.',
            'credentials.uri.required' => 'The connection URI is required.',
            'credentials.database.required' => 'The database name is required.',
            'credentials.access_token.required' => 'The access token is required.',
            'credentials.disk.required' => 'The storage disk is required.',
            'credentials.disk.in' => 'The storage disk must be either local or public.',
            'credentials.path.required' => 'The storage path is required.',
        ];
    }
}
