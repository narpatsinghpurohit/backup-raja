import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowDown, Database, Server, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BackupOperation {
  id: number;
  source_connection: { id: number; name: string; type: string };
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
  database?: string;
  is_match?: boolean;
}

interface Props {
  backup: BackupOperation;
  destinations: Connection[];
  sourceDatabase: string | null;
}

export default function Create({ backup, destinations, sourceDatabase }: Props) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');

  // Find the destination that matches the source database (backend tells us via is_match)
  const findMatchingDestination = (): string => {
    // First try is_match from backend
    const match = destinations.find((d) => d.is_match);
    if (match) return match.id.toString();

    // Fallback: try to match by database name
    if (sourceDatabase) {
      const matchByDb = destinations.find((d) => d.database === sourceDatabase);
      if (matchByDb) return matchByDb.id.toString();
    }

    return '';
  };

  const { data, setData, post, processing, errors } = useForm({
    destination_connection_id: findMatchingDestination(),
    config: {
      bucket: '',
      prefix: '',
      uri: '',
      database: sourceDatabase || '', // Pre-fill with source database name
    },
  });

  // Update destination if it wasn't auto-selected initially
  useEffect(() => {
    if (!data.destination_connection_id && destinations.length > 0) {
      const match = findMatchingDestination();
      if (match) {
        setData('destination_connection_id', match);
      }
    }
  }, [destinations]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Show confirmation dialog instead of submitting directly
    setShowConfirmDialog(true);
    setConfirmationInput('');
  };

  const handleConfirmedSubmit = () => {
    setShowConfirmDialog(false);
    post(`/backups/${backup.id}/restore`);
  };

  const selectedDestination = destinations.find(
    (d) => d.id.toString() === data.destination_connection_id
  );

  const isMongoMigration = selectedDestination?.type === 'mongodb';
  const targetDatabase = data.config.database || sourceDatabase;
  const isDatabaseRename = isMongoMigration && sourceDatabase && targetDatabase && sourceDatabase !== targetDatabase;

  // For confirmation, user must type the target database name
  const confirmationRequired = targetDatabase || '';
  const isConfirmationValid = confirmationInput === confirmationRequired;

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
                          {dest.is_match && (
                            <span className="ml-2 text-green-600">✓ matches</span>
                          )}
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
                        placeholder="Enter database name"
                      />
                      {isDatabaseRename && (
                        <p className="mt-1 text-xs text-green-600">
                          ✓ Database will be renamed from <span className="font-mono">{sourceDatabase}</span> to <span className="font-mono">{targetDatabase}</span>
                        </p>
                      )}
                    </div>

                    {/* Migration Preview Card */}
                    {sourceDatabase && selectedDestination && (
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
                  <Button
                    type="submit"
                    disabled={processing || !data.destination_connection_id || (isMongoMigration && !data.config.database)}
                  >
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

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Migration
            </DialogTitle>
            <DialogDescription className="pt-2">
              This action will <strong>create or overwrite</strong> the database on the target cluster.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-md bg-muted p-3 text-sm">
              <p><strong>Source:</strong> {backup.source_connection.name} / {sourceDatabase}</p>
              <p><strong>Destination:</strong> {selectedDestination?.name} / {targetDatabase}</p>
            </div>

            <div>
              <Label htmlFor="confirm-database" className="text-sm">
                Type <span className="font-mono font-bold text-red-600">{confirmationRequired}</span> to confirm:
              </Label>
              <Input
                id="confirm-database"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={confirmationRequired}
                className="mt-2"
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmedSubmit}
              disabled={!isConfirmationValid || processing}
            >
              {processing ? 'Migrating...' : 'Confirm Migration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
