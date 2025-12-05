import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { getTypeLabel } from '@/config/connection-types';

interface Connection {
    id: number;
    name: string;
    type: string;
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
    schedules: Schedule[];
}

export default function Index({ schedules }: Props) {
    const getStatusColor = (status: string | null) => {
        if (!status) return 'secondary';
        const colors: Record<string, string> = {
            completed: 'success',
            failed: 'destructive',
        };
        return colors[status] || 'secondary';
    };

    const getFrequencyLabel = (preset: string) => {
        const labels: Record<string, string> = {
            hourly: 'Every hour',
            daily: 'Daily',
            weekly: 'Weekly',
            monthly: 'Monthly',
            custom: 'Custom',
        };
        return labels[preset] || preset;
    };


    const handleToggle = (schedule: Schedule) => {
        router.post(`/schedules/${schedule.id}/toggle`, {}, { preserveScroll: true });
    };

    const handleDelete = (schedule: Schedule) => {
        if (confirm(`Are you sure you want to delete "${schedule.name}"?`)) {
            router.delete(`/schedules/${schedule.id}`);
        }
    };

    return (
        <AppLayout>
            <Head title="Schedules" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-3xl font-bold">Backup Schedules</h1>
                        <Link href="/schedules/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                New Schedule
                            </Button>
                        </Link>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Schedules</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {schedules.map((schedule) => (
                                    <div
                                        key={schedule.id}
                                        className="flex items-center justify-between rounded-lg border p-4"
                                    >
                                        <div className="flex-1">
                                            <Link href={`/schedules/${schedule.id}`}>
                                                <div className="font-medium hover:underline">
                                                    {schedule.name}
                                                </div>
                                            </Link>
                                            <div className="text-sm text-muted-foreground">
                                                {schedule.source_connection.name} →{' '}
                                                {schedule.destination_connection.name}
                                            </div>
                                            <div className="mt-1 text-sm text-muted-foreground">
                                                {getFrequencyLabel(schedule.frequency_preset)}
                                                {schedule.frequency_preset === 'custom' &&
                                                    ` (${schedule.cron_expression})`}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right text-sm">
                                                <div className="text-muted-foreground">
                                                    Last run:{' '}
                                                    {schedule.last_run_at
                                                        ? new Date(schedule.last_run_at).toLocaleString()
                                                        : 'Never'}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    Next run:{' '}
                                                    {schedule.next_run_at
                                                        ? new Date(schedule.next_run_at).toLocaleString()
                                                        : 'N/A'}
                                                </div>
                                            </div>

                                            {schedule.last_run_status && (
                                                <Badge variant={getStatusColor(schedule.last_run_status) as any}>
                                                    {schedule.last_run_status}
                                                </Badge>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={schedule.is_active}
                                                    onCheckedChange={() => handleToggle(schedule)}
                                                />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Link href={`/schedules/${schedule.id}`}>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/schedules/${schedule.id}/edit`}>
                                                    <Button variant="outline" size="sm">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(schedule)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {schedules.length === 0 && (
                                <p className="py-8 text-center text-muted-foreground">
                                    No schedules found. Create your first schedule to automate backups.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
