import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Connection {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
  last_validated_at: string | null;
  created_at: string;
}

interface Props {
  connections: Connection[];
}

export default function Index({ connections }: Props) {
  const { flash } = usePage<any>().props;
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    if (flash?.success || flash?.error) {
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?\n\nThis will fail if there are active backup operations using this connection.`)) {
      router.delete(`/connections/${id}`, {
        onError: (errors) => {
          if (errors.error) {
            alert(`Failed to delete connection:\n\n${errors.error}`);
          } else {
            alert('Failed to delete connection. Please try again.');
          }
        },
      });
    }
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
      <Head title="Connections" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Flash Messages */}
          {showFlash && flash?.success && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
              <CheckCircle2 className="h-5 w-5" />
              <p>{flash.success}</p>
              <button onClick={() => setShowFlash(false)} className="ml-auto">×</button>
            </div>
          )}
          
          {showFlash && flash?.error && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
              <AlertCircle className="h-5 w-5" />
              <p>{flash.error}</p>
              <button onClick={() => setShowFlash(false)} className="ml-auto">×</button>
            </div>
          )}

          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Connections</h1>
            <Link href="/connections/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Connection
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connections.map((connection) => (
              <Card key={connection.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{connection.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {getTypeLabel(connection.type)}
                      </p>
                    </div>
                    <Badge variant={connection.is_active ? 'default' : 'destructive'}>
                      {connection.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Link href={`/connections/${connection.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(connection.id, connection.name)}
                      title="Delete connection (only if no backup operations exist)"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                  {!connection.is_active && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      This connection is inactive and won't be used for new backups
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {connections.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No connections found. Create your first connection to get started.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
