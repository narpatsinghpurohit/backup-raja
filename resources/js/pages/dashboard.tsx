import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, HardDrive, Activity, Plus } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface BackupOperation {
  id: number;
  status: string;
  source_connection: { name: string };
  destination_connection: { name: string };
  created_at: string;
}

interface Stats {
  total_backups: number;
  successful_backups: number;
  failed_backups: number;
  total_connections: number;
}

interface Props {
  connections: number;
  recentBackups: BackupOperation[];
  stats: Stats;
}

export default function Dashboard({ connections, recentBackups, stats }: Props) {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_backups}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Successful</CardTitle>
                            <Activity className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.successful_backups}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Failed</CardTitle>
                            <Activity className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.failed_backups}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Connections</CardTitle>
                            <Database className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_connections}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Link href="/backups/create">
                                <Button className="w-full">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create New Backup
                                </Button>
                            </Link>
                            <Link href="/connections/create">
                                <Button variant="outline" className="w-full">
                                    <Database className="mr-2 h-4 w-4" />
                                    Add Connection
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Recent Backups</CardTitle>
                                <Link href="/backups">
                                    <Button variant="ghost" size="sm">View All</Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {recentBackups.map((backup) => (
                                    <Link key={backup.id} href={`/backups/${backup.id}`}>
                                        <div className="flex items-center justify-between rounded-lg border p-2 hover:bg-accent">
                                            <div className="text-sm">
                                                <div className="font-medium">
                                                    {backup.source_connection.name} → {backup.destination_connection.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(backup.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                            <Badge variant={getStatusColor(backup.status) as any} className="text-xs">
                                                {backup.status}
                                            </Badge>
                                        </div>
                                    </Link>
                                ))}
                                {recentBackups.length === 0 && (
                                    <p className="py-4 text-center text-sm text-muted-foreground">
                                        No backups yet
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
