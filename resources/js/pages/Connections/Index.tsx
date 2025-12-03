import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit } from 'lucide-react';

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
  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this connection?')) {
      router.delete(`/connections/${id}`);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      s3: 'S3 Source',
      mongodb: 'MongoDB',
      google_drive: 'Google Drive',
      s3_destination: 'S3 Destination',
    };
    return labels[type] || type;
  };

  return (
    <AppLayout>
      <Head title="Connections" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
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
                      onClick={() => handleDelete(connection.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
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
