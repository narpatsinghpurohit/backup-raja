import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface Connection {
    id: number;
    name: string;
    type: string;
}

interface Props {
    sources: Connection[];
    destinations: Connection[];
}

const frequencyOptions = [
    { value: 'hourly', label: 'Every hour', description: 'Runs at the start of every hour' },
    { value: 'daily', label: 'Daily', description: 'Runs daily at midnight' },
    { value: 'weekly', label: 'Weekly', description: 'Runs every Sunday at midnight' },
    { value: 'monthly', label: 'Monthly', description: 'Runs on the 1st of every month at midnight' },
    { value: 'custom', label: 'Custom', description: 'Define your own cron expression' },
];

export default function Create({ sources, destinations }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        source_connection_id: '',
        destination_connection_id: '',
        frequency_preset: 'daily',
        cron_expression: '',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/schedules');
    };

    const selectedFrequency = frequencyOptions.find((f) => f.value === data.frequency_preset);


    return (
        <AppLayout>
            <Head title="Create Schedule" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create New Schedule</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Schedule Name</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g., Daily MongoDB Backup"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500">{errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="source">Source Connection</Label>
                                    <Select
                                        value={data.source_connection_id}
                                        onValueChange={(value) => setData('source_connection_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select source" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sources.map((source) => (
                                                <SelectItem key={source.id} value={source.id.toString()}>
                                                    {source.name} ({source.type})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.source_connection_id && (
                                        <p className="text-sm text-red-500">{errors.source_connection_id}</p>
                                    )}
                                </div>

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

                                <div>
                                    <Label htmlFor="frequency">Frequency</Label>
                                    <Select
                                        value={data.frequency_preset}
                                        onValueChange={(value) => setData('frequency_preset', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {frequencyOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectedFrequency && (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {selectedFrequency.description}
                                        </p>
                                    )}
                                    {errors.frequency_preset && (
                                        <p className="text-sm text-red-500">{errors.frequency_preset}</p>
                                    )}
                                </div>

                                {data.frequency_preset === 'custom' && (
                                    <div>
                                        <Label htmlFor="cron_expression">Cron Expression</Label>
                                        <Input
                                            id="cron_expression"
                                            value={data.cron_expression}
                                            onChange={(e) => setData('cron_expression', e.target.value)}
                                            placeholder="e.g., 0 2 * * * (daily at 2 AM)"
                                        />
                                        {errors.cron_expression && (
                                            <p className="text-sm text-red-500">{errors.cron_expression}</p>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', checked)}
                                    />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>

                                <div className="flex gap-2">
                                    <Button type="submit" disabled={processing}>
                                        Create Schedule
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
