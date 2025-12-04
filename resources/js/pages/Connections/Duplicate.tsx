import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { getTechnologyByType } from '@/config/connection-types';
import { TechnologyIcon } from '@/components/connections/TechnologyIcon';
import { CredentialForm } from '@/components/connections/CredentialForm';
import { setConnectionId } from '@/services/google-drive-api';

interface BaseConnection {
  id: number;
  name: string;
  type: string;
  credentials: Record<string, string>;
}

interface Props {
  baseConnection: BaseConnection;
}

interface FormErrors extends Record<string, string | undefined> {
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
  'credentials.disk'?: string;
  'credentials.path'?: string;
  error?: string;
}

export default function Duplicate({ baseConnection }: Props) {
  const technology = getTechnologyByType(baseConnection.type);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    name: `${baseConnection.name} (Copy)`,
    credentials: { ...baseConnection.credentials },
  });

  // Set connection ID for folder picker API calls (uses original connection's tokens)
  useEffect(() => {
    if (baseConnection.type === 'google_drive') {
      setConnectionId(baseConnection.id);
    }
    return () => setConnectionId(null);
  }, [baseConnection.id, baseConnection.type]);

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({ ...prev, name }));
  };

  const handleCredentialChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      credentials: { ...prev.credentials, [field]: value },
    }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    // Filter credentials based on connection type (same logic as Create)
    let filteredCredentials: Record<string, string> = {};
    const type = baseConnection.type;

    if (type === 's3' || type === 's3_destination') {
      filteredCredentials = {
        access_key: formData.credentials.access_key,
        secret_key: formData.credentials.secret_key,
        region: formData.credentials.region,
        bucket: formData.credentials.bucket,
      };
    } else if (type === 'mongodb') {
      filteredCredentials = {
        uri: formData.credentials.uri,
        database: formData.credentials.database,
      };
    } else if (type === 'google_drive') {
      filteredCredentials = {
        access_token: formData.credentials.access_token,
        refresh_token: formData.credentials.refresh_token || '',
        folder_id: formData.credentials.folder_id || '',
      };
    } else if (type === 'local_storage') {
      filteredCredentials = {
        disk: formData.credentials.disk,
        path: formData.credentials.path,
      };
    }

    router.post(
      '/connections',
      {
        name: formData.name,
        type: baseConnection.type,
        credentials: filteredCredentials,
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

  const handleCancel = () => {
    window.history.back();
  };

  if (!technology) {
    return (
      <AppLayout>
        <Head title="Duplicate Connection" />
        <div className="py-12">
          <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Unknown connection type</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Head title="Duplicate Connection" />

      <div className="py-12">
        <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
          <div className="mb-6">
            <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <TechnologyIcon type={baseConnection.type} size="md" showBackground />
                  <div>
                    <CardTitle>Duplicate {technology.name} Connection</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Duplicating from: <span className="font-medium">{baseConnection.name}</span>
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          <CredentialForm
            technology={technology}
            formData={formData}
            errors={errors}
            processing={processing}
            onBack={handleCancel}
            onNameChange={handleNameChange}
            onCredentialChange={handleCredentialChange}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isDuplicateMode={true}
            connectionId={baseConnection.type === 'google_drive' ? baseConnection.id : undefined}
          />
        </div>
      </div>
    </AppLayout>
  );
}
