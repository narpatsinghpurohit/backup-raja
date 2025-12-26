import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, Database, Server, AlertTriangle } from 'lucide-react';

interface BackupOperation {
  id: number;
  source_connection: { name: string; type: string };
  created_at: string;
  archive_size: number;
  metadata?: {
    source_database?: string;
    collections_count?: number;
  };
}

interface Connection {
  id: number;
  name: string;
  type: string;
  credentials?: {
    database?: string;
  };
}

interface Props {
  backup: BackupOperation;
  destinations: Connection[];
  sourceDatabase: string | null;
}

export default function Create({ backup, destinations, sourceDatabase }: Props) {
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

  const isMongoMigration = selectedDestination?.type === 'mongodb';
  const targetDatabase = data.config.database || selectedDestination?.credentials?.database || sourceDatabase;
  const isDatabaseRename = isMongoMigration && sourceDatabase && targetDatabase && sourceDatabase !== targetDatabase;

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

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
                {sourceDatabase && (
                  <p className="text-sm text-muted-foreground">
                    Database: <span className="font-mono font-medium">{sourceDatabase}</span>
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Size: {formatBytes(backup.archive_size)}
                </p>
                {backup.metadata?.collections_count && (
                  <p className="text-sm text-muted-foreground">
                    Collections: {backup.metadata.collections_count}
                  </p>
                )}
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
                        placeholder="Leave empty to use connection default"
                      />
                    </div>
                    <div>
                      <Label htmlFor="database">Target Database Name</Label>
                      <Input
                        id="database"
                        value={data.config.database}
                        onChange={(e) =>
                          setData('config', { ...data.config, database: e.target.value })
                        }
                        placeholder={sourceDatabase || 'Enter new database name'}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Leave empty to keep the same name ({sourceDatabase})
                      </p>
                    </div>

                    {/* Migration Preview Card */}
                    {sourceDatabase && (
                      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
                        <h4 className="mb-3 flex items-center gap-2 font-semibold text-blue-900 dark:text-blue-100">
                          <Database className="h-4 w-4" />
                          Migration Preview
                        </h4>

                        <div className="space-y-3">
                          {/* Source */}
                          <div className="rounded-md bg-white p-3 dark:bg-gray-800">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Server className="h-4 w-4" />
                              <span>Source (from backup)</span>
                            </div>
                            <div className="mt-1 font-mono text-sm font-medium">
                              {backup.source_connection.name} / <span className="text-blue-600 dark:text-blue-400">{sourceDatabase}</span>
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="flex justify-center">
                            <ArrowDown className="h-5 w-5 text-blue-500" />
                          </div>

                          {/* Destination */}
                          <div className="rounded-md bg-white p-3 dark:bg-gray-800">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Server className="h-4 w-4" />
                              <span>Destination (restore to)</span>
                            </div>
                            <div className="mt-1 font-mono text-sm font-medium">
                              {selectedDestination.name} / <span className={isDatabaseRename ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}>
                                {targetDatabase}
                              </span>
                              {isDatabaseRename && (
                                <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
                                  RENAMED
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Warning */}
                        <div className="mt-3 flex items-start gap-2 rounded-md bg-yellow-100 p-2 text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                          <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                          <span>
                            This will create or overwrite the database <strong>{targetDatabase}</strong> on the target cluster.
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {(errors as Record<string, string>).error && <p className="text-sm text-red-500">{(errors as Record<string, string>).error}</p>}

                <div className="flex gap-2">
                  <Button type="submit" disabled={processing}>
                    {isMongoMigration ? 'Start Migration' : 'Start Restore'}
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
