import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { getTypeLabel } from '@/config/connection-types';

interface BackupOperation {
  id: number;
  status: string;
  source_connection: { name: string; type: string };
  destination_connection: { name: string; type: string };
  created_at: string;
  archive_size: number | null;
}


interface Stats {
  total: number;
  successful: number;
  failed: number;
  running: number;
}

interface Props {
  backups: BackupOperation[];
  stats: Stats;
}

export default function Index({ backups, stats }: Props) {
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
      <Head title="Backups" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Backup Operations</h1>
            <Link href="/backups/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Backup
              </Button>
            </Link>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Successful</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Running</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Backups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backups.map((backup) => (
                  <Link key={backup.id} href={`/backups/${backup.id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent">
                      <div>
                        <div className="font-medium">
                          {backup.source_connection.name} → {backup.destination_connection.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getTypeLabel(backup.source_connection.type)} → {getTypeLabel(backup.destination_connection.type)} • {new Date(backup.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                          {formatBytes(backup.archive_size)}
                        </div>
                        <Badge variant={getStatusColor(backup.status) as any}>
                          {backup.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {backups.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">
                  No backup operations found. Create your first backup to get started.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
