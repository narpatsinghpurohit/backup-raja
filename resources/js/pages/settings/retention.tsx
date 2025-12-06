import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Trash2, Shield } from 'lucide-react';
import { useState } from 'react';

interface BackupOperation {
    id: number;
    source_connection: { name: string };
    destination_connection: { name: string };
    created_at: string;
    archive_size: number | null;
}

interface Props {
    settings: {
        retention_count: string | null;
        retention_days: string | null;
    };
    expiredBackups: BackupOperation[];
    expiredCount: number;
}

export default function Retention({ settings, expiredBackups, expiredCount }: Props) {
    const [isRunningCleanup, setIsRunningCleanup] = useState(false);

    const { data, setData, put, processing } = useForm({
        retention_count: settings.retention_count || '',
        retention_days: settings.retention_days || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/settings/retention');
    };

    const handleRunCleanup = () => {
        if (confirm(`Are you sure you want to delete ${expiredCount} backup(s)? This action cannot be undone.`)) {
            setIsRunningCleanup(true);
            router.post('/settings/cleanup', {}, {
                onFinish: () => setIsRunningCleanup(false),
            });
        }
    };

    const formatBytes = (bytes: number | null) => {
        if (!bytes) return 'N/A';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    };

    return (
        <AppLayout>
            <Head title="Retention Settings" />
            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold">Retention Settings</h1>
                        <p className="text-muted-foreground mt-1">
                            Configure global backup retention policies and manage cleanup
                        </p>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Global Retention Policy</CardTitle>
                                <CardDescription>
                                    These settings apply to backups without a schedule-specific retention policy
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <Label htmlFor="retention_count">Keep Last N Backups</Label>
                                            <Input
                                                id="retention_count"
                                                type="number"
                                                min="1"
                                                value={data.retention_count}
                                                onChange={(e) => setData('retention_count', e.target.value)}
                                                placeholder="e.g., 10"
                                            />
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Leave empty to disable count-based retention
                                            </p>
                                        </div>
                                        <div>
                                            <Label htmlFor="retention_days">Keep for X Days</Label>
                                            <Input
                                                id="retention_days"
                                                type="number"
                                                min="1"
                                                value={data.retention_days}
                                                onChange={(e) => setData('retention_days', e.target.value)}
                                                placeholder="e.g., 30"
                                            />
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Leave empty to disable time-based retention
                                            </p>
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={processing}>
                                        Save Settings
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Trash2 className="h-5 w-5" />
                                    Cleanup Preview
                                </CardTitle>
                                <CardDescription>
                                    Backups that will be deleted based on current retention policies
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {expiredCount > 0 ? (
                                    <>
                                        <div className="mb-4 flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-md">
                                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                            <span className="text-sm text-yellow-800 dark:text-yellow-200">
                                                {expiredCount} backup(s) eligible for deletion
                                            </span>
                                        </div>
                                        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                                            {expiredBackups.slice(0, 10).map((backup) => (
                                                <div key={backup.id} className="flex items-center justify-between p-2 border rounded">
                                                    <div>
                                                        <span className="font-medium">#{backup.id}</span>
                                                        <span className="text-muted-foreground ml-2">
                                                            {backup.source_connection.name} → {backup.destination_connection.name}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {formatBytes(backup.archive_size)} • {new Date(backup.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ))}
                                            {expiredCount > 10 && (
                                                <p className="text-sm text-muted-foreground text-center py-2">
                                                    ... and {expiredCount - 10} more
                                                </p>
                                            )}
                                        </div>
                                        <Button variant="destructive" onClick={handleRunCleanup} disabled={isRunningCleanup}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {isRunningCleanup ? 'Running Cleanup...' : `Delete ${expiredCount} Backup(s)`}
                                        </Button>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
                                        <Shield className="h-5 w-5 text-green-600" />
                                        <span className="text-sm text-green-800 dark:text-green-200">
                                            No backups eligible for deletion
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
