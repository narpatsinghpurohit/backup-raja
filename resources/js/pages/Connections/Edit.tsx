import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface Connection {
  id: number;
  name: string;
  type: string;
  credentials: Record<string, string>;
}

interface Props {
  connection: Connection;
}

interface FormErrors {
  name?: string;
  credentials?: string;
  'credentials.access_key'?: string;
  'credentials.secret_key'?: string;
  'credentials.region'?: string;
  'credentials.bucket'?: string;
  'credentials.uri'?: string;
  'credentials.database'?: string;
  'credentials.access_token'?: string;
  error?: string;
}

export default function Edit({ connection }: Props) {
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    name: connection.name,
    credentials: {
      access_key: connection.credentials?.access_key || '',
      secret_key: '', // Don't pre-fill secrets for security
      region: connection.credentials?.region || '',
      bucket: connection.credentials?.bucket || '',
      uri: connection.credentials?.uri || '',
      database: connection.credentials?.database || '',
      access_token: '', // Don't pre-fill tokens for security
      refresh_token: '',
      folder_id: connection.credentials?.folder_id || '',
    },
  });
  const [updateCredentials, setUpdateCredentials] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    const payload: Record<string, unknown> = {
      name: formData.name,
    };

    // Only include credentials if user wants to update them
    if (updateCredentials) {
      let filteredCredentials: Record<string, string> = {};
      if (connection.type === 's3' || connection.type === 's3_destination') {
        filteredCredentials = {
          access_key: formData.credentials.access_key,
          secret_key: formData.credentials.secret_key,
          region: formData.credentials.region,
          bucket: formData.credentials.bucket,
        };
      } else if (connection.type === 'mongodb') {
        filteredCredentials = {
          uri: formData.credentials.uri,
          database: formData.credentials.database,
        };
      } else if (connection.type === 'google_drive') {
        filteredCredentials = {
          access_token: formData.credentials.access_token,
          refresh_token: formData.credentials.refresh_token,
          folder_id: formData.credentials.folder_id,
        };
      }
      payload.credentials = filteredCredentials;
      payload.type = connection.type;
    }

    router.put(`/connections/${connection.id}`, payload, {
      preserveScroll: true,
      onError: (errors) => {
        setErrors(errors as FormErrors);
        setProcessing(false);
      },
      onSuccess: () => {
        setProcessing(false);
      },
    });
  };

  const handleCredentialChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      credentials: { ...prev.credentials, [field]: value }
    }));
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      s3: 'S3 Source',
      mongodb: 'MongoDB',
      google_drive: 'Google Drive',
      s3_destination: 'S3 Destination',
    };
    return labels[type] || type;
  };

  return (
    <AppLayout>
      <Head title="Edit Connection" />

      <div className="py-12">
        <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Edit Connection</CardTitle>
              <p className="text-sm text-muted-foreground">Type: {getTypeLabel(connection.type)}</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Connection Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="updateCredentials"
                    checked={updateCredentials}
                    onChange={(e) => setUpdateCredentials(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="updateCredentials">Update credentials</Label>
                </div>

                {updateCredentials && (
                  <>
                    {(connection.type === 's3' || connection.type === 's3_destination') && (
                      <>
                        <div>
                          <Label htmlFor="access_key">Access Key</Label>
                          <Input
                            id="access_key"
                            value={formData.credentials.access_key}
                            onChange={(e) => handleCredentialChange('access_key', e.target.value)}
                            required
                          />
                          {errors['credentials.access_key'] && <p className="text-sm text-red-500">{errors['credentials.access_key']}</p>}
                        </div>
                        <div>
                          <Label htmlFor="secret_key">Secret Key</Label>
                          <Input
                            id="secret_key"
                            type="password"
                            value={formData.credentials.secret_key}
                            onChange={(e) => handleCredentialChange('secret_key', e.target.value)}
                            required
                          />
                          {errors['credentials.secret_key'] && <p className="text-sm text-red-500">{errors['credentials.secret_key']}</p>}
                        </div>
                        <div>
                          <Label htmlFor="region">Region</Label>
                          <Input
                            id="region"
                            value={formData.credentials.region}
                            onChange={(e) => handleCredentialChange('region', e.target.value)}
                            required
                          />
                          {errors['credentials.region'] && <p className="text-sm text-red-500">{errors['credentials.region']}</p>}
                        </div>
                        <div>
                          <Label htmlFor="bucket">Bucket Name</Label>
                          <Input
                            id="bucket"
                            value={formData.credentials.bucket}
                            onChange={(e) => handleCredentialChange('bucket', e.target.value)}
                            required
                          />
                          {errors['credentials.bucket'] && <p className="text-sm text-red-500">{errors['credentials.bucket']}</p>}
                        </div>
                      </>
                    )}

                    {connection.type === 'mongodb' && (
                      <>
                        <div>
                          <Label htmlFor="uri">Connection URI</Label>
                          <Input
                            id="uri"
                            value={formData.credentials.uri}
                            onChange={(e) => handleCredentialChange('uri', e.target.value)}
                            placeholder="mongodb://user:pass@host:27017"
                            required
                          />
                          {errors['credentials.uri'] && <p className="text-sm text-red-500">{errors['credentials.uri']}</p>}
                        </div>
                        <div>
                          <Label htmlFor="database">Database Name</Label>
                          <Input
                            id="database"
                            value={formData.credentials.database}
                            onChange={(e) => handleCredentialChange('database', e.target.value)}
                            required
                          />
                          {errors['credentials.database'] && <p className="text-sm text-red-500">{errors['credentials.database']}</p>}
                        </div>
                      </>
                    )}

                    {connection.type === 'google_drive' && (
                      <>
                        <div>
                          <Label htmlFor="access_token">Access Token</Label>
                          <Input
                            id="access_token"
                            value={formData.credentials.access_token}
                            onChange={(e) => handleCredentialChange('access_token', e.target.value)}
                            required
                          />
                          {errors['credentials.access_token'] && <p className="text-sm text-red-500">{errors['credentials.access_token']}</p>}
                        </div>
                        <div>
                          <Label htmlFor="refresh_token">Refresh Token</Label>
                          <Input
                            id="refresh_token"
                            value={formData.credentials.refresh_token}
                            onChange={(e) => handleCredentialChange('refresh_token', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="folder_id">Folder ID (Optional)</Label>
                          <Input
                            id="folder_id"
                            value={formData.credentials.folder_id}
                            onChange={(e) => handleCredentialChange('folder_id', e.target.value)}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

                {errors.error && <p className="text-sm text-red-500">{errors.error}</p>}
                {errors.credentials && <p className="text-sm text-red-500">{errors.credentials}</p>}

                <div className="flex gap-2">
                  <Button type="submit" disabled={processing}>
                    {processing ? 'Updating...' : 'Update Connection'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => window.history.back()}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
