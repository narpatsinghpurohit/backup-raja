import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

interface FormErrors {
  name?: string;
  type?: string;
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

export default function Create() {
  const [selectedType, setSelectedType] = useState<string>('s3');
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    name: '',
    credentials: {
      access_key: '',
      secret_key: '',
      region: '',
      bucket: '',
      uri: '',
      database: '',
      access_token: '',
      refresh_token: '',
      folder_id: '',
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});
    
    // Filter credentials based on connection type
    let filteredCredentials: Record<string, string> = {};
    if (selectedType === 's3' || selectedType === 's3_destination') {
      filteredCredentials = {
        access_key: formData.credentials.access_key,
        secret_key: formData.credentials.secret_key,
        region: formData.credentials.region,
        bucket: formData.credentials.bucket,
      };
    } else if (selectedType === 'mongodb') {
      filteredCredentials = {
        uri: formData.credentials.uri,
        database: formData.credentials.database,
      };
    } else if (selectedType === 'google_drive') {
      filteredCredentials = {
        access_token: formData.credentials.access_token,
        refresh_token: formData.credentials.refresh_token,
        folder_id: formData.credentials.folder_id,
      };
    }
    
    router.post('/connections', {
      name: formData.name,
      type: selectedType,
      credentials: filteredCredentials,
    }, {
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

  const updateCredentials = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      credentials: { ...prev.credentials, [field]: value }
    }));
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
  };

  return (
    <AppLayout>
      <Head title="Create Connection" />

      <div className="py-12">
        <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Create New Connection</CardTitle>
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

                <div>
                  <Label htmlFor="type">Connection Type</Label>
                  <Select value={selectedType} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="s3">S3 Source</SelectItem>
                      <SelectItem value="s3_destination">S3 Destination</SelectItem>
                      <SelectItem value="mongodb">MongoDB</SelectItem>
                      <SelectItem value="google_drive">Google Drive</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
                </div>

                {(selectedType === 's3' || selectedType === 's3_destination') && (
                  <>
                    <div>
                      <Label htmlFor="access_key">Access Key</Label>
                      <Input
                        id="access_key"
                        value={formData.credentials.access_key}
                        onChange={(e) => updateCredentials('access_key', e.target.value)}
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
                        onChange={(e) => updateCredentials('secret_key', e.target.value)}
                        required
                      />
                      {errors['credentials.secret_key'] && <p className="text-sm text-red-500">{errors['credentials.secret_key']}</p>}
                    </div>
                    <div>
                      <Label htmlFor="region">Region</Label>
                      <Input
                        id="region"
                        value={formData.credentials.region}
                        onChange={(e) => updateCredentials('region', e.target.value)}
                        required
                      />
                      {errors['credentials.region'] && <p className="text-sm text-red-500">{errors['credentials.region']}</p>}
                    </div>
                    <div>
                      <Label htmlFor="bucket">Bucket Name</Label>
                      <Input
                        id="bucket"
                        value={formData.credentials.bucket}
                        onChange={(e) => updateCredentials('bucket', e.target.value)}
                        required
                      />
                      {errors['credentials.bucket'] && <p className="text-sm text-red-500">{errors['credentials.bucket']}</p>}
                    </div>
                  </>
                )}

                {selectedType === 'mongodb' && (
                  <>
                    <div>
                      <Label htmlFor="uri">Connection URI</Label>
                      <Input
                        id="uri"
                        value={formData.credentials.uri}
                        onChange={(e) => updateCredentials('uri', e.target.value)}
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
                        onChange={(e) => updateCredentials('database', e.target.value)}
                        required
                      />
                      {errors['credentials.database'] && <p className="text-sm text-red-500">{errors['credentials.database']}</p>}
                    </div>
                  </>
                )}

                {selectedType === 'google_drive' && (
                  <>
                    <div>
                      <Label htmlFor="access_token">Access Token</Label>
                      <Input
                        id="access_token"
                        value={formData.credentials.access_token}
                        onChange={(e) => updateCredentials('access_token', e.target.value)}
                        required
                      />
                      {errors['credentials.access_token'] && <p className="text-sm text-red-500">{errors['credentials.access_token']}</p>}
                    </div>
                    <div>
                      <Label htmlFor="refresh_token">Refresh Token</Label>
                      <Input
                        id="refresh_token"
                        value={formData.credentials.refresh_token}
                        onChange={(e) => updateCredentials('refresh_token', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="folder_id">Folder ID (Optional)</Label>
                      <Input
                        id="folder_id"
                        value={formData.credentials.folder_id}
                        onChange={(e) => updateCredentials('folder_id', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {errors.error && <p className="text-sm text-red-500">{errors.error}</p>}
                {errors.credentials && <p className="text-sm text-red-500">{errors.credentials}</p>}

                <div className="flex gap-2">
                  <Button type="submit" disabled={processing}>
                    Create Connection
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
