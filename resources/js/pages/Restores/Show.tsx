import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TerminalLog from '@/components/TerminalLog';

interface RestoreOperation {
  id: number;
  status: string;
  backup_operation: {
    id: number;
    source_connection: { name: string };
  };
  destination_connection: { name: string; type: string };
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  logs: Array<{
    id: number;
    level: string;
    message: string;
    created_at: string;
  }>;
}

interface Props {
  restore: RestoreOperation;
}

export default function Show({ restore }: Props) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'secondary',
      running: 'default',
      completed: 'success',
      failed: 'destructive',
      cancelled: 'secondary',
    };
    return colors[status] || 'secondary';
  };

  return (
    <AppLayout>
      <Head title={`Restore #${restore.id}`} />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Restore Operation #{restore.id}</h1>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Restore Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={getStatusColor(restore.status) as any}>{restore.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source Backup:</span>
                  <span>#{restore.backup_operation.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Source:</span>
                  <span>{restore.backup_operation.source_connection.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Restore Destination:</span>
                  <span>
                    {restore.destination_connection.name} ({restore.destination_connection.type})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(restore.created_at).toLocaleString()}</span>
                </div>
                {restore.started_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Started:</span>
                    <span>{new Date(restore.started_at).toLocaleString()}</span>
                  </div>
                )}
                {restore.completed_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed:</span>
                    <span>{new Date(restore.completed_at).toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {restore.error_message && (
              <Card className="border-red-500">
                <CardHeader>
                  <CardTitle className="text-red-500">Error</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{restore.error_message}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <TerminalLog operationId={restore.id} operationType="restore" initialLogs={restore.logs} />
        </div>
      </div>
    </AppLayout>
  );
}
