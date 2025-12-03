import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BackupOperation {
  id: number;
  source_connection: { name: string; type: string };
  created_at: string;
  archive_size: number;
}

interface Connection {
  id: number;
  name: string;
  type: string;
}

interface Props {
  backup: BackupOperation;
  destinations: Connection[];
}

export default function Create({ backup, destinations }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    destination_connection_id: '',
    config: {
      bucket: '',
      prefix: '',
      uri: '',
      database: '',
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(`/backups/${backup.id}/restore`);
  };

  const selectedDestination = destinations.find(
    (d) => d.id.toString() === data.destination_connection_id
  );

  return (
    <AppLayout>
      <Head title="Restore Backup" />

      <div className="py-12">
        <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Restore Backup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 rounded-lg bg-muted p-4">
                <h3 className="font-semibold">Backup Details</h3>
                <p className="text-sm text-muted-foreground">
                  Source: {backup.source_connection.name} ({backup.source_connection.type})
                </p>
                <p className="text-sm text-muted-foreground">
                  Created: {new Date(backup.created_at).toLocaleString()}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="destination">Destination Connection</Label>
                  <Select
                    value={data.destination_connection_id}
                    onValueChange={(value) => setData('destination_connection_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.map((dest) => (
                        <SelectItem key={dest.id} value={dest.id.toString()}>
                          {dest.name} ({dest.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.destination_connection_id && (
                    <p className="text-sm text-red-500">{errors.destination_connection_id}</p>
                  )}
                </div>

                {selectedDestination?.type === 's3_destination' && (
                  <>
                    <div>
                      <Label htmlFor="bucket">Target Bucket (Optional)</Label>
                      <Input
                        id="bucket"
                        value={data.config.bucket}
                        onChange={(e) =>
                          setData('config', { ...data.config, bucket: e.target.value })
                        }
                        placeholder="Leave empty to use default"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prefix">Prefix (Optional)</Label>
                      <Input
                        id="prefix"
                        value={data.config.prefix}
                        onChange={(e) =>
                          setData('config', { ...data.config, prefix: e.target.value })
                        }
                        placeholder="e.g., restored/"
                      />
                    </div>
                  </>
                )}

                {selectedDestination?.type === 'mongodb' && (
                  <>
                    <div>
                      <Label htmlFor="uri">Target URI (Optional)</Label>
                      <Input
                        id="uri"
                        value={data.config.uri}
                        onChange={(e) => setData('config', { ...data.config, uri: e.target.value })}
                        placeholder="Leave empty to use default"
                      />
                    </div>
                    <div>
                      <Label htmlFor="database">Target Database (Optional)</Label>
                      <Input
                        id="database"
                        value={data.config.database}
                        onChange={(e) =>
                          setData('config', { ...data.config, database: e.target.value })
                        }
                        placeholder="Leave empty to use default"
                      />
                    </div>
                  </>
                )}

                {errors.error && <p className="text-sm text-red-500">{errors.error}</p>}

                <div className="flex gap-2">
                  <Button type="submit" disabled={processing}>
                    Start Restore
                  </Button>
                  <Button type="button" variant="outline" onClick={() => window.history.back()}>
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
