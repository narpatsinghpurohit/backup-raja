import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Plus, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, X, Check, ChevronsUpDown } from 'lucide-react';
import { getTypeLabel } from '@/config/connection-types';
import { cn } from '@/lib/utils';

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

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedSchedules {
    data: Schedule[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

interface Filters {
    status?: string;
    source_connection_id?: string;
    destination_connection_id?: string;
    last_run_status?: string;
}

interface Props {
    schedules: PaginatedSchedules;
    sources: Connection[];
    destinations: Connection[];
    filters: Filters;
}


export default function Index({ schedules, sources, destinations, filters }: Props) {
    const [sourceOpen, setSourceOpen] = useState(false);
    const [destOpen, setDestOpen] = useState(false);

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

    const handleFilterChange = (key: string, value: string) => {
        const actualValue = value === 'all' ? undefined : value;
        const newFilters = { ...filters, [key]: actualValue };
        Object.keys(newFilters).forEach((k) => {
            if (!newFilters[k as keyof Filters]) delete newFilters[k as keyof Filters];
        });
        router.get('/schedules', newFilters, { preserveState: true, preserveScroll: true });
    };

    const clearFilters = () => {
        router.get('/schedules', {}, { preserveState: true, preserveScroll: true });
    };

    const hasActiveFilters = Object.values(filters).some((v) => v);

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

                    {/* Filters */}
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="min-w-[150px]">
                                    <Label className="mb-2 block text-sm font-medium">Status</Label>
                                    <Select
                                        value={filters.status || 'all'}
                                        onValueChange={(value) => handleFilterChange('status', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="paused">Paused</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="min-w-[200px]">
                                    <Label className="mb-2 block text-sm font-medium">Source</Label>
                                    <Popover open={sourceOpen} onOpenChange={setSourceOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={sourceOpen}
                                                className="w-full justify-between"
                                            >
                                                {filters.source_connection_id
                                                    ? sources.find((s) => s.id.toString() === filters.source_connection_id)?.name
                                                    : 'All Sources'}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[200px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search sources..." />
                                                <CommandList>
                                                    <CommandEmpty>No source found.</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem
                                                            value="all"
                                                            onSelect={() => {
                                                                handleFilterChange('source_connection_id', 'all');
                                                                setSourceOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4',
                                                                    !filters.source_connection_id ? 'opacity-100' : 'opacity-0'
                                                                )}
                                                            />
                                                            All Sources
                                                        </CommandItem>
                                                        {sources.map((source) => (
                                                            <CommandItem
                                                                key={source.id}
                                                                value={source.name}
                                                                onSelect={() => {
                                                                    handleFilterChange('source_connection_id', source.id.toString());
                                                                    setSourceOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        'mr-2 h-4 w-4',
                                                                        filters.source_connection_id === source.id.toString()
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0'
                                                                    )}
                                                                />
                                                                {source.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="min-w-[200px]">
                                    <Label className="mb-2 block text-sm font-medium">Destination</Label>
                                    <Popover open={destOpen} onOpenChange={setDestOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={destOpen}
                                                className="w-full justify-between"
                                            >
                                                {filters.destination_connection_id
                                                    ? destinations.find((d) => d.id.toString() === filters.destination_connection_id)
                                                          ?.name
                                                    : 'All Destinations'}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[200px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search destinations..." />
                                                <CommandList>
                                                    <CommandEmpty>No destination found.</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem
                                                            value="all"
                                                            onSelect={() => {
                                                                handleFilterChange('destination_connection_id', 'all');
                                                                setDestOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4',
                                                                    !filters.destination_connection_id ? 'opacity-100' : 'opacity-0'
                                                                )}
                                                            />
                                                            All Destinations
                                                        </CommandItem>
                                                        {destinations.map((dest) => (
                                                            <CommandItem
                                                                key={dest.id}
                                                                value={dest.name}
                                                                onSelect={() => {
                                                                    handleFilterChange('destination_connection_id', dest.id.toString());
                                                                    setDestOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        'mr-2 h-4 w-4',
                                                                        filters.destination_connection_id === dest.id.toString()
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0'
                                                                    )}
                                                                />
                                                                {dest.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="min-w-[150px]">
                                    <Label className="mb-2 block text-sm font-medium">Last Run</Label>
                                    <Select
                                        value={filters.last_run_status || 'all'}
                                        onValueChange={(value) => handleFilterChange('last_run_status', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Results" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Results</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="failed">Failed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {hasActiveFilters && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                                        <X className="h-4 w-4" />
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>


                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Schedules</CardTitle>
                                {schedules.total > 0 && (
                                    <span className="text-sm text-muted-foreground">
                                        Showing {schedules.from}-{schedules.to} of {schedules.total}
                                    </span>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {schedules.data.map((schedule) => (
                                    <div
                                        key={schedule.id}
                                        className="flex items-center justify-between rounded-lg border p-4"
                                    >
                                        <div className="flex-1">
                                            <Link href={`/schedules/${schedule.id}`}>
                                                <div className="font-medium hover:underline">{schedule.name}</div>
                                            </Link>
                                            <div className="text-sm text-muted-foreground">
                                                {schedule.source_connection.name} → {schedule.destination_connection.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {getTypeLabel(schedule.source_connection.type)} →{' '}
                                                {getTypeLabel(schedule.destination_connection.type)}
                                            </div>
                                            <div className="mt-1 text-sm text-muted-foreground">
                                                {getFrequencyLabel(schedule.frequency_preset)}
                                                {schedule.frequency_preset === 'custom' && ` (${schedule.cron_expression})`}
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
                                                <Button variant="outline" size="sm" onClick={() => handleDelete(schedule)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {schedules.data.length === 0 && (
                                <p className="py-8 text-center text-muted-foreground">
                                    {hasActiveFilters
                                        ? 'No schedules match your filters.'
                                        : 'No schedules found. Create your first schedule to automate backups.'}
                                </p>
                            )}

                            {/* Pagination */}
                            {schedules.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={schedules.current_page === 1}
                                        onClick={() => {
                                            const params = new URLSearchParams(window.location.search);
                                            params.set('page', (schedules.current_page - 1).toString());
                                            router.get(`/schedules?${params.toString()}`, {}, { preserveState: true });
                                        }}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        {schedules.links.slice(1, -1).map((link, index) => (
                                            <Button
                                                key={index}
                                                variant={link.active ? 'default' : 'outline'}
                                                size="sm"
                                                className="min-w-[40px]"
                                                disabled={!link.url}
                                                onClick={() => {
                                                    if (link.url) {
                                                        router.visit(link.url, { preserveState: true });
                                                    }
                                                }}
                                            >
                                                {link.label}
                                            </Button>
                                        ))}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={schedules.current_page === schedules.last_page}
                                        onClick={() => {
                                            const params = new URLSearchParams(window.location.search);
                                            params.set('page', (schedules.current_page + 1).toString());
                                            router.get(`/schedules?${params.toString()}`, {}, { preserveState: true });
                                        }}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
