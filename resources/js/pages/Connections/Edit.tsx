import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy } from 'lucide-react';
import { useState } from 'react';
import { FolderPickerButton } from '@/components/connections/FolderPickerButton';
import { LocalStorageFolderPickerButton } from '@/components/connections/LocalStorageFolderPickerButton';
import type { GoogleDriveFolder } from '@/types/google-drive';
import type { LocalStorageFolder } from '@/types/local-storage';

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
  'credentials.disk'?: string;
  'credentials.path'?: string;
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
      disk: connection.credentials?.disk || 'local',
      path: connection.credentials?.path || 'backups',
    },
  });
  const [updateCredentials, setUpdateCredentials] = useState(false);
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(null);
  const [folderChanged, setFolderChanged] = useState(false);
  const [selectedLocalPath, setSelectedLocalPath] = useState<string | null>(null);
  const [pathChanged, setPathChanged] = useState(false);

  const handleFolderSelect = (folder: GoogleDriveFolder | null) => {
    if (folder) {
      handleCredentialChange('folder_id', folder.id);
      setSelectedFolderPath(folder.path || `/${folder.name}`);
    } else {
      handleCredentialChange('folder_id', '');
      setSelectedFolderPath(null);
    }
  };

  const handleLocalFolderSelect = (folder: LocalStorageFolder | null) => {
    if (folder) {
      const path = folder.path.startsWith('/') ? folder.path.slice(1) : folder.path;
      handleCredentialChange('path', path);
      setSelectedLocalPath(folder.path);
    } else {
      handleCredentialChange('path', '');
      setSelectedLocalPath(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    const payload: Record<string, unknown> = {
      name: formData.name,
    };

    // Handle Google Drive folder-only updates
    if (connection.type === 'google_drive' && folderChanged && !updateCredentials) {
      payload.credentials = {
        folder_id: formData.credentials.folder_id,
        // Empty tokens signal folder-only update to backend
        access_token: '',
        refresh_token: '',
      };
      payload.type = connection.type;
    }
    // Handle Local Storage path-only updates
    else if (connection.type === 'local_storage' && pathChanged && !updateCredentials) {
      payload.credentials = {
        disk: formData.credentials.disk,
        path: formData.credentials.path,
      };
      payload.type = connection.type;
    }
    // Only include credentials if user wants to update them
    else if (updateCredentials) {
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
      } else if (connection.type === 'local_storage') {
        filteredCredentials = {
          disk: formData.credentials.disk,
          path: formData.credentials.path,
        };
      }
      payload.credentials = filteredCredentials;
      payload.type = connection.type;
    }

    router.put(`/connections/${connection.id}`, payload as any, {
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
      local_storage: 'Local Storage',
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
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Edit Connection</CardTitle>
                  <p className="text-sm text-muted-foreground">Type: {getTypeLabel(connection.type)}</p>
                </div>
                <Link href={`/connections/${connection.id}/duplicate`}>
                  <Button variant="outline" size="sm">
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </Button>
                </Link>
              </div>
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

                {/* Google Drive folder selection - always visible for Google Drive connections */}
                {connection.type === 'google_drive' && (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <Label htmlFor="folder_id" className="text-base font-medium">Backup Folder</Label>
                    <p className="mb-3 text-sm text-muted-foreground">
                      Select where backups will be stored in your Google Drive
                    </p>
                    <div className="flex gap-2">
                      <Input
                        id="folder_id"
                        value={formData.credentials.folder_id}
                        onChange={(e) => {
                          handleCredentialChange('folder_id', e.target.value);
                          setSelectedFolderPath(null);
                          setFolderChanged(true);
                        }}
                        placeholder="Leave empty to use root folder"
                        className="flex-1"
                      />
                      <FolderPickerButton
                        onFolderSelect={(folder) => {
                          handleFolderSelect(folder);
                          setFolderChanged(true);
                        }}
                        currentFolderId={formData.credentials.folder_id}
                        connectionId={connection.id}
                      />
                    </div>
                    {selectedFolderPath && (
                      <p className="mt-1 text-sm text-green-600">
                        ✓ Selected: {selectedFolderPath}
                      </p>
                    )}
                    {!selectedFolderPath && formData.credentials.folder_id && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Current folder ID: {formData.credentials.folder_id}
                      </p>
                    )}
                  </div>
                )}

                {/* Local Storage path selection - always visible for Local Storage connections */}
                {connection.type === 'local_storage' && (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <Label htmlFor="storage_disk" className="text-base font-medium">Storage Location</Label>
                    <p className="mb-3 text-sm text-muted-foreground">
                      Select where backups will be stored on the server
                    </p>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="storage_disk" className="text-sm">Storage Disk</Label>
                        <Select
                          value={formData.credentials.disk}
                          onValueChange={(value) => {
                            handleCredentialChange('disk', value);
                            setPathChanged(true);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="local">Local (storage/app)</SelectItem>
                            <SelectItem value="public">Public (storage/app/public)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="storage_path" className="text-sm">Storage Path</Label>
                        <div className="flex gap-2">
                          <Input
                            id="storage_path"
                            value={formData.credentials.path}
                            onChange={(e) => {
                              handleCredentialChange('path', e.target.value);
                              setSelectedLocalPath(null);
                              setPathChanged(true);
                            }}
                            placeholder="backups"
                            className="flex-1"
                          />
                          <LocalStorageFolderPickerButton
                            disk={formData.credentials.disk}
                            onFolderSelect={(folder) => {
                              handleLocalFolderSelect(folder);
                              setPathChanged(true);
                            }}
                            currentPath={formData.credentials.path}
                          />
                        </div>
                        {selectedLocalPath && (
                          <p className="mt-1 text-sm text-green-600">
                            ✓ Selected: {selectedLocalPath}
                          </p>
                        )}
                        {!selectedLocalPath && formData.credentials.path && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Current path: {formData.credentials.path}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="updateCredentials"
                    checked={updateCredentials}
                    onChange={(e) => setUpdateCredentials(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="updateCredentials">
                    {connection.type === 'google_drive' ? 'Update OAuth tokens' : 'Update credentials'}
                  </Label>
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
                      </>
                    )}

                    {connection.type === 'local_storage' && (
                      <>
                        <div>
                          <Label htmlFor="disk">Storage Disk</Label>
                          <select
                            id="disk"
                            value={formData.credentials.disk}
                            onChange={(e) => handleCredentialChange('disk', e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            required
                          >
                            <option value="local">Local (storage/app)</option>
                            <option value="public">Public (storage/app/public)</option>
                          </select>
                          {errors['credentials.disk'] && <p className="text-sm text-red-500">{errors['credentials.disk']}</p>}
                        </div>
                        <div>
                          <Label htmlFor="path">Storage Path</Label>
                          <Input
                            id="path"
                            value={formData.credentials.path}
                            onChange={(e) => handleCredentialChange('path', e.target.value)}
                            placeholder="backups"
                            required
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Path relative to the storage disk (e.g., "backups" or "backups/mongodb")
                          </p>
                          {errors['credentials.path'] && <p className="text-sm text-red-500">{errors['credentials.path']}</p>}
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
