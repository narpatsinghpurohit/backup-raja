import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, HardDrive } from 'lucide-react';
import { useState } from 'react';
import { FolderPickerButton } from '@/components/connections/FolderPickerButton';
import type { GoogleDriveFolder } from '@/types/google-drive';

interface Props {
  suggestedName: string;
  email: string;
}

interface FormErrors {
  name?: string;
  'credentials.folder_id'?: string;
  error?: string;
}

export default function CreateGoogleDrive({ suggestedName, email }: Props) {
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    name: suggestedName,
    folder_id: '',
  });
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(null);

  const handleFolderSelect = (folder: GoogleDriveFolder | null) => {
    if (folder) {
      setFormData((prev) => ({ ...prev, folder_id: folder.id }));
      setSelectedFolderPath(folder.path || `/${folder.name}`);
    } else {
      setFormData((prev) => ({ ...prev, folder_id: '' }));
      setSelectedFolderPath(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    router.post(
      '/connections',
      {
        name: formData.name,
        type: 'google_drive',
        credentials: {
          folder_id: formData.folder_id,
        },
      },
      {
        preserveScroll: true,
        onError: (errors) => {
          setErrors(errors as FormErrors);
          setProcessing(false);
        },
        onSuccess: () => {
          setProcessing(false);
        },
      }
    );
  };

  return (
    <AppLayout>
      <Head title="Create Google Drive Connection" />

      <div className="py-12">
        <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
          <div className="mb-6">
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
              <CardContent className="flex items-center gap-4 p-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">
                    Google Drive Connected!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Authenticated as {email}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
                  <HardDrive className="h-5 w-5 text-white" />
                </div>
                <CardTitle>Google Drive Connection</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Connection Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="folder_id">Backup Folder (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="folder_id"
                      value={formData.folder_id}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, folder_id: e.target.value }));
                        setSelectedFolderPath(null);
                      }}
                      placeholder="Leave empty to use root folder"
                      className="flex-1"
                    />
                    <FolderPickerButton
                      onFolderSelect={handleFolderSelect}
                      currentFolderId={formData.folder_id}
                    />
                  </div>
                  {selectedFolderPath && (
                    <p className="mt-1 text-sm text-green-600">
                      ✓ Selected: {selectedFolderPath}
                    </p>
                  )}
                  {!selectedFolderPath && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Click "Browse" to select a folder, or paste a folder ID manually
                    </p>
                  )}
                  {errors['credentials.folder_id'] && (
                    <p className="mt-1 text-sm text-red-500">{errors['credentials.folder_id']}</p>
                  )}
                </div>

                {errors.error && <p className="text-sm text-red-500">{errors.error}</p>}

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={processing}>
                    {processing ? 'Creating...' : 'Create Connection'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
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
