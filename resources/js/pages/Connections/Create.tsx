import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState } from 'react';
import { ConnectionCategory, TechnologyConfig } from '@/config/connection-types';
import { CategoryStep } from '@/components/connections/CategoryStep';
import { TechnologyGrid } from '@/components/connections/TechnologyGrid';
import { CredentialForm } from '@/components/connections/CredentialForm';
import { GoogleDriveOAuthButton } from '@/components/connections/GoogleDriveOAuthButton';

type Step = 'category' | 'technology' | 'form' | 'google-oauth';

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
  'credentials.disk'?: string;
  'credentials.path'?: string;
  error?: string;
}

interface Props {
  googleOAuthConfigured?: boolean;
}

export default function Create({ googleOAuthConfigured = false }: Props) {
  const [step, setStep] = useState<Step>('category');
  const [useManualGoogleDrive, setUseManualGoogleDrive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ConnectionCategory | null>(null);
  const [selectedTechnology, setSelectedTechnology] = useState<TechnologyConfig | null>(null);
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
      disk: 'local',
      path: 'backups',
    } as Record<string, string>,
  });

  const handleCategorySelect = (category: ConnectionCategory) => {
    setSelectedCategory(category);
    setStep('technology');
  };

  const handleTechnologySelect = (technology: TechnologyConfig) => {
    setSelectedTechnology(technology);
    // For Google Drive, show OAuth button unless user chose manual setup
    if (technology.type === 'google_drive' && !useManualGoogleDrive) {
      setStep('google-oauth');
    } else {
      setStep('form');
    }
  };

  const handleBackToCategory = () => {
    setStep('category');
    setSelectedCategory(null);
  };

  const handleBackToTechnology = () => {
    setStep('technology');
  };


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
    if (!selectedTechnology) return;

    setProcessing(true);
    setErrors({});

    // Filter credentials based on connection type
    let filteredCredentials: Record<string, string> = {};
    const type = selectedTechnology.type;

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
        refresh_token: formData.credentials.refresh_token,
        folder_id: formData.credentials.folder_id,
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
        type: selectedTechnology.type,
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

  return (
    <AppLayout>
      <Head title="Create Connection" />

      <div className="py-12">
        <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
          {step === 'category' && <CategoryStep onSelect={handleCategorySelect} />}

          {step === 'technology' && selectedCategory && (
            <TechnologyGrid
              category={selectedCategory}
              onSelect={handleTechnologySelect}
              onBack={handleBackToCategory}
            />
          )}

          {step === 'google-oauth' && selectedTechnology && (
            <div className="space-y-6">
              <button
                onClick={handleBackToTechnology}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to technologies
              </button>
              <GoogleDriveOAuthButton
                isConfigured={googleOAuthConfigured}
                onManualSetup={() => {
                  setUseManualGoogleDrive(true);
                  setStep('form');
                }}
              />
            </div>
          )}

          {step === 'form' && selectedTechnology && (
            <CredentialForm
              technology={selectedTechnology}
              formData={formData}
              errors={errors as Record<string, string>}
              processing={processing}
              onBack={handleBackToTechnology}
              onNameChange={handleNameChange}
              onCredentialChange={handleCredentialChange}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
