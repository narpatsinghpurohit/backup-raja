import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pencil, Trash2 } from 'lucide-react';

interface Connection {
    id: number;
    name: string;
    type: string;
}

interface BackupOperation {
    id: number;
    status: string;
    created_at: string;
    completed_at: string | null;
    source_connection: Connection;
    destination_connection: Connection;
}

interface Schedule {
    id: number;
    name: string;
    source_connection: Connection;
    destination_connection: Connection;
    frequency_preset: string;
    cron_expression: string;
    is_active: boolean;
    last_run_at: string | null;
    next_run_at: string | null;
    last_run_status: string | null;
    success_count: number;
    failure_count: number;
}

interface Props {
    schedule: Schedule;
    recentRuns: BackupOperation[];
}

export default function Show({ schedule, recentRuns }: Props) {
    const getStatusColor = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
        const colors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            pending: 'secondary',
            running: 'default',
            completed: 'default',
            failed: 'destructive',
            paused: 'secondary',
            cancelled: 'secondary',
        };
        return colors[status] || 'secondary';
    };

    const getFrequencyLabel = (preset: string) => {
        const labels: Record<string, string> = {
            hourly: 'Every hour',
            daily: 'Daily at midnight',
            weekly: 'Weekly on Sunday at midnight',
            monthly: 'Monthly on the 1st at midnight',
            custom: 'Custom',
        };
        return labels[preset] || preset;
    };


    const handleRunNow = () => {
        router.post(`/schedules/${schedule.id}/run`);
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${schedule.name}"?`)) {
            router.delete(`/schedules/${schedule.id}`);
        }
    };

    const calculateDuration = (start: string, end: string | null) => {
        if (!end) return 'In progress';
        const startDate = new Date(start);
        const endDate = new Date(end);
        const seconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ${minutes % 60}m`;
    };

    return (
        <AppLayout>
            <Head title={`Schedule: ${schedule.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-3xl font-bold">{schedule.name}</h1>
                        <div className="flex gap-2">
                            <Button onClick={handleRunNow} disabled={!schedule.is_active}>
                                <Play className="mr-2 h-4 w-4" />
                                Run Now
                            </Button>
                            <Link href={`/schedules/${schedule.id}/edit`}>
                                <Button variant="outline">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                            <Button variant="destructive" onClick={handleDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    </div>

                    <div className="mb-6 grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Schedule Configuration</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status:</span>
                                    <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                                        {schedule.is_active ? 'Active' : 'Paused'}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Source:</span>
                                    <span>{schedule.source_connection.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Destination:</span>
                                    <span>{schedule.destination_connection.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Frequency:</span>
                                    <span>{getFrequencyLabel(schedule.frequency_preset)}</span>
                                </div>
                                {schedule.frequency_preset === 'custom' && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Cron:</span>
                                        <span className="font-mono">{schedule.cron_expression}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Next Run:</span>
                                    <span>
                                        {schedule.next_run_at
                                            ? new Date(schedule.next_run_at).toLocaleString()
                                            : 'N/A'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Statistics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Successful Runs:</span>
                                    <span className="font-bold text-green-600">{schedule.success_count}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Failed Runs:</span>
                                    <span className="font-bold text-red-600">{schedule.failure_count}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Last Run:</span>
                                    <span>
                                        {schedule.last_run_at
                                            ? new Date(schedule.last_run_at).toLocaleString()
                                            : 'Never'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Last Status:</span>
                                    {schedule.last_run_status ? (
                                        <Badge variant={getStatusColor(schedule.last_run_status)}>
                                            {schedule.last_run_status}
                                        </Badge>
                                    ) : (
                                        <span>N/A</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Runs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentRuns.map((run) => (
                                    <Link key={run.id} href={`/backups/${run.id}`}>
                                        <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent">
                                            <div>
                                                <div className="font-medium">Backup #{run.id}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {new Date(run.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-sm text-muted-foreground">
                                                    Duration: {calculateDuration(run.created_at, run.completed_at)}
                                                </div>
                                                <Badge variant={getStatusColor(run.status)}>
                                                    {run.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {recentRuns.length === 0 && (
                                <p className="py-8 text-center text-muted-foreground">
                                    No backup runs yet. Click "Run Now" to trigger a backup.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
