import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TerminalLog from '@/components/TerminalLog';
import { Pause, Play, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BackupSchedule {
  id: number;
  name: string;
}

interface BackupOperation {
  id: number;
  status: string;
  source_connection: { name: string; type: string };
  destination_connection: { name: string; type: string };
  backup_schedule: BackupSchedule | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  archive_size: number | null;
  archive_path: string | null;
  error_message: string | null;
  logs: Array<{
    id: number;
    level: string;
    message: string;
    created_at: string;
  }>;
}

interface Props {
  backup: BackupOperation;
}

export default function Show({ backup: initialBackup }: Props) {
  const [backup, setBackup] = useState(initialBackup);

  const handlePause = () => {
    router.post(`/backups/${backup.id}/pause`);
  };

  const handleResume = () => {
    router.post(`/backups/${backup.id}/resume`);
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this backup?')) {
      router.post(`/backups/${backup.id}/cancel`);
    }
  };

  // Poll for backup status updates
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/backups/${backup.id}/status`);
        const data = await response.json();
        setBackup((prev) => ({ ...prev, ...data }));
      } catch (error) {
        console.error('Failed to fetch backup status:', error);
      }
    };

    // Only poll if backup is in a non-final state
    if (['pending', 'running', 'paused'].includes(backup.status)) {
      const interval = setInterval(pollStatus, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [backup.id, backup.status]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'secondary',
      running: 'default',
      completed: 'success',
      failed: 'destructive',
      paused: 'warning',
      cancelled: 'secondary',
    };
    return colors[status] || 'secondary';
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <AppLayout>
      <Head title={`Backup #${backup.id}`} />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Backup Operation #{backup.id}</h1>
            <div className="flex gap-2">
              {backup.status === 'running' && (
                <>
                  <Button onClick={handlePause} variant="outline">
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                  <Button onClick={handleCancel} variant="destructive">
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              )}
              {backup.status === 'paused' && (
                <>
                  <Button onClick={handleResume}>
                    <Play className="mr-2 h-4 w-4" />
                    Resume
                  </Button>
                  <Button onClick={handleCancel} variant="destructive">
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Backup Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={getStatusColor(backup.status) as any}>{backup.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source:</span>
                  <span>
                    {backup.source_connection.name} ({backup.source_connection.type})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destination:</span>
                  <span>
                    {backup.destination_connection.name} ({backup.destination_connection.type})
                  </span>
                </div>
                {backup.backup_schedule && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Triggered by:</span>
                    <Link href={`/schedules/${backup.backup_schedule.id}`} className="text-primary hover:underline">
                      {backup.backup_schedule.name}
                    </Link>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Archive Size:</span>
                  <span>{formatBytes(backup.archive_size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(backup.created_at).toLocaleString()}</span>
                </div>
                {backup.started_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Started:</span>
                    <span>{new Date(backup.started_at).toLocaleString()}</span>
                  </div>
                )}
                {backup.completed_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed:</span>
                    <span>{new Date(backup.completed_at).toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {backup.error_message && (
              <Card className="border-red-500">
                <CardHeader>
                  <CardTitle className="text-red-500">Error</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{backup.error_message}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <TerminalLog operationId={backup.id} operationType="backup" initialLogs={backup.logs} />
        </div>
      </div>
    </AppLayout>
  );
}
