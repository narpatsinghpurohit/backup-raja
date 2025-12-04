import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TechnologyConfig, getPathFieldsForType } from '@/config/connection-types';
import { TechnologyIcon } from './TechnologyIcon';
import { HighlightedField } from './HighlightedField';
import { FolderPickerButton } from './FolderPickerButton';
import { ArrowLeft } from 'lucide-react';
import type { GoogleDriveFolder } from '@/types/google-drive';

interface CredentialFormProps {
  technology: TechnologyConfig;
  formData: {
    name: string;
    credentials: Record<string, string>;
  };
  errors: Record<string, string | undefined>;
  processing: boolean;
  onBack: () => void;
  onNameChange: (name: string) => void;
  onCredentialChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isDuplicateMode?: boolean;
  connectionId?: number; // For folder picker when duplicating Google Drive
}

export function CredentialForm({
  technology,
  formData,
  errors,
  processing,
  onBack,
  onNameChange,
  onCredentialChange,
  onSubmit,
  onCancel,
  isDuplicateMode = false,
  connectionId,
}: CredentialFormProps) {
  const pathFields = isDuplicateMode ? getPathFieldsForType(technology.type) : [];
  const highlightedFieldNames = pathFields.map((f) => f.field);
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(null);

  const handleFolderSelect = (folder: GoogleDriveFolder | null) => {
    if (folder) {
      onCredentialChange('folder_id', folder.id);
      setSelectedFolderPath(folder.path || `/${folder.name}`);
    } else {
      onCredentialChange('folder_id', '');
      setSelectedFolderPath(null);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {isDuplicateMode ? 'Back' : 'Back to technologies'}
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <TechnologyIcon type={technology.type} size="lg" showBackground />
            <CardTitle>{technology.name} Connection</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Connection Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder={`My ${technology.name} Connection`}
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            {renderCredentialFields(
              technology.type,
              formData.credentials,
              errors,
              onCredentialChange,
              highlightedFieldNames,
              pathFields,
              isDuplicateMode,
              connectionId,
              handleFolderSelect,
              selectedFolderPath
            )}

            {errors.error && <p className="text-sm text-red-500">{errors.error}</p>}
            {errors.credentials && <p className="text-sm text-red-500">{errors.credentials}</p>}

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={processing}>
                {processing ? 'Creating...' : 'Create Connection'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


function renderCredentialFields(
  type: string,
  credentials: Record<string, string>,
  errors: Record<string, string | undefined>,
  onChange: (field: string, value: string) => void,
  highlightedFieldNames: string[] = [],
  pathFields: Array<{ field: string; label: string; helpText: string }> = [],
  isDuplicateMode: boolean = false,
  connectionId?: number,
  onFolderSelect?: (folder: GoogleDriveFolder | null) => void,
  selectedFolderPath?: string | null
) {
  const shouldHighlight = (fieldName: string) => highlightedFieldNames.includes(fieldName);
  const getHelpText = (fieldName: string) =>
    pathFields.find((f) => f.field === fieldName)?.helpText || '';

  const wrapIfHighlighted = (fieldName: string, content: React.ReactNode) => {
    if (shouldHighlight(fieldName)) {
      return <HighlightedField helpText={getHelpText(fieldName)}>{content}</HighlightedField>;
    }
    return content;
  };
  if (type === 's3' || type === 's3_destination') {
    return (
      <>
        <div>
          <Label htmlFor="access_key">Access Key</Label>
          <Input
            id="access_key"
            value={credentials.access_key || ''}
            onChange={(e) => onChange('access_key', e.target.value)}
            required
          />
          {errors['credentials.access_key'] && (
            <p className="mt-1 text-sm text-red-500">{errors['credentials.access_key']}</p>
          )}
        </div>
        <div>
          <Label htmlFor="secret_key">Secret Key</Label>
          <Input
            id="secret_key"
            type="password"
            value={credentials.secret_key || ''}
            onChange={(e) => onChange('secret_key', e.target.value)}
            required
          />
          {errors['credentials.secret_key'] && (
            <p className="mt-1 text-sm text-red-500">{errors['credentials.secret_key']}</p>
          )}
        </div>
        <div>
          <Label htmlFor="region">Region</Label>
          <Input
            id="region"
            value={credentials.region || ''}
            onChange={(e) => onChange('region', e.target.value)}
            placeholder="us-east-1"
            required
          />
          {errors['credentials.region'] && (
            <p className="mt-1 text-sm text-red-500">{errors['credentials.region']}</p>
          )}
        </div>
        {wrapIfHighlighted(
          'bucket',
          <div>
            <Label htmlFor="bucket">Bucket Name</Label>
            <Input
              id="bucket"
              value={credentials.bucket || ''}
              onChange={(e) => onChange('bucket', e.target.value)}
              required
            />
            {errors['credentials.bucket'] && (
              <p className="mt-1 text-sm text-red-500">{errors['credentials.bucket']}</p>
            )}
          </div>
        )}
      </>
    );
  }

  if (type === 'mongodb') {
    return (
      <>
        <div>
          <Label htmlFor="uri">Connection URI</Label>
          <Input
            id="uri"
            value={credentials.uri || ''}
            onChange={(e) => onChange('uri', e.target.value)}
            placeholder="mongodb://user:pass@host:27017"
            required
          />
          {errors['credentials.uri'] && (
            <p className="mt-1 text-sm text-red-500">{errors['credentials.uri']}</p>
          )}
        </div>
        {wrapIfHighlighted(
          'database',
          <div>
            <Label htmlFor="database">Database Name</Label>
            <Input
              id="database"
              value={credentials.database || ''}
              onChange={(e) => onChange('database', e.target.value)}
              required
            />
            {errors['credentials.database'] && (
              <p className="mt-1 text-sm text-red-500">{errors['credentials.database']}</p>
            )}
          </div>
        )}
      </>
    );
  }

  if (type === 'google_drive') {
    return (
      <>
        <div>
          <Label htmlFor="access_token">Access Token</Label>
          <Input
            id="access_token"
            value={credentials.access_token || ''}
            onChange={(e) => onChange('access_token', e.target.value)}
            required
          />
          {errors['credentials.access_token'] && (
            <p className="mt-1 text-sm text-red-500">{errors['credentials.access_token']}</p>
          )}
        </div>
        <div>
          <Label htmlFor="refresh_token">Refresh Token</Label>
          <Input
            id="refresh_token"
            value={credentials.refresh_token || ''}
            onChange={(e) => onChange('refresh_token', e.target.value)}
          />
        </div>
        {wrapIfHighlighted(
          'folder_id',
          <div>
            <Label htmlFor="folder_id">Backup Folder (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="folder_id"
                value={credentials.folder_id || ''}
                onChange={(e) => onChange('folder_id', e.target.value)}
                placeholder="Leave empty to use root folder"
                className="flex-1"
              />
              {isDuplicateMode && connectionId && onFolderSelect && (
                <FolderPickerButton
                  onFolderSelect={onFolderSelect}
                  currentFolderId={credentials.folder_id}
                  connectionId={connectionId}
                />
              )}
            </div>
            {selectedFolderPath && (
              <p className="mt-1 text-sm text-green-600">
                ✓ Selected: {selectedFolderPath}
              </p>
            )}
            {!selectedFolderPath && credentials.folder_id && (
              <p className="mt-1 text-xs text-muted-foreground">
                Current folder ID: {credentials.folder_id}
              </p>
            )}
          </div>
        )}
      </>
    );
  }

  if (type === 'local_storage') {
    return (
      <>
        <div>
          <Label htmlFor="disk">Storage Disk</Label>
          <Select
            value={credentials.disk || 'local'}
            onValueChange={(value) => onChange('disk', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">Local (storage/app)</SelectItem>
              <SelectItem value="public">Public (storage/app/public)</SelectItem>
            </SelectContent>
          </Select>
          {errors['credentials.disk'] && (
            <p className="mt-1 text-sm text-red-500">{errors['credentials.disk']}</p>
          )}
        </div>
        {wrapIfHighlighted(
          'path',
          <div>
            <Label htmlFor="path">Storage Path</Label>
            <Input
              id="path"
              value={credentials.path || ''}
              onChange={(e) => onChange('path', e.target.value)}
              placeholder="backups"
              required
            />
            {!highlightedFieldNames.includes('path') && (
              <p className="mt-1 text-xs text-muted-foreground">
                Path relative to the storage disk (e.g., "backups" or "backups/mongodb")
              </p>
            )}
            {errors['credentials.path'] && (
              <p className="mt-1 text-sm text-red-500">{errors['credentials.path']}</p>
            )}
          </div>
        )}
      </>
    );
  }

  return null;
}
