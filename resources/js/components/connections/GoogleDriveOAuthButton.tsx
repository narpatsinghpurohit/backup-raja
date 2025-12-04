import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HardDrive, ExternalLink } from 'lucide-react';

interface GoogleDriveOAuthButtonProps {
  onManualSetup: () => void;
  isConfigured: boolean;
}

export function GoogleDriveOAuthButton({ onManualSetup, isConfigured }: GoogleDriveOAuthButtonProps) {
  if (!isConfigured) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
        <CardContent className="p-6 text-center">
          <HardDrive className="mx-auto h-12 w-12 text-yellow-600" />
          <h3 className="mt-4 font-semibold">Google OAuth Not Configured</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The administrator needs to configure Google OAuth credentials.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            You can still use manual setup with your own tokens.
          </p>
          <Button variant="outline" className="mt-4" onClick={onManualSetup}>
            Use Manual Setup
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500">
          <HardDrive className="h-8 w-8 text-white" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Connect Google Drive</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Click below to authorize Backup Raja to access your Google Drive.
          You'll be redirected to Google to grant permission.
        </p>
        <a href="/oauth/google/redirect">
          <Button className="mt-4 gap-2">
            <ExternalLink className="h-4 w-4" />
            Connect Google Drive
          </Button>
        </a>
        <p className="mt-4 text-xs text-muted-foreground">
          Or{' '}
          <button onClick={onManualSetup} className="text-primary underline hover:no-underline">
            use manual setup
          </button>{' '}
          if OAuth doesn't work
        </p>
      </CardContent>
    </Card>
  );
}
