import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getTypeLabel } from '@/config/connection-types';

interface BackupOperation {
  id: number;
  status: string;
  source_connection: { name: string; type: string };
  destination_connection: { name: string; type: string };
  created_at: string;
  archive_size: number | null;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface PaginatedBackups {
  data: BackupOperation[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  links: PaginationLink[];
}

interface Connection {
  id: number;
  name: string;
  type: string;
}

interface Stats {
  total: number;
  successful: number;
  failed: number;
  running: number;
}

interface Filters {
  status?: string;
  source_connection_id?: string;
  destination_connection_id?: string;
}

interface Props {
  backups: PaginatedBackups;
  stats: Stats;
  filters: Filters;
  sources: Connection[];
  destinations: Connection[];
}

export default function Index({ backups, stats, filters, sources, destinations }: Props) {
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

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const handleFilterChange = (key: string, value: string) => {
    const actualValue = value === 'all' ? undefined : value;
    const newFilters = { ...filters, [key]: actualValue };
    // Remove empty values
    Object.keys(newFilters).forEach(k => {
      if (!newFilters[k as keyof Filters]) delete newFilters[k as keyof Filters];
    });
    router.get('/backups', newFilters, { preserveState: true, preserveScroll: true });
  };

  const clearFilters = () => {
    router.get('/backups', {}, { preserveState: true, preserveScroll: true });
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  return (
    <AppLayout>
      <Head title="Backups" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Backup Operations</h1>
            <Link href="/backups/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Backup
              </Button>
            </Link>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Successful</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Running</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="min-w-[150px]">
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-[180px]">
                  <Select
                    value={filters.source_connection_id || 'all'}
                    onValueChange={(value) => handleFilterChange('source_connection_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      {sources.map((source) => (
                        <SelectItem key={source.id} value={source.id.toString()}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-[180px]">
                  <Select
                    value={filters.destination_connection_id || 'all'}
                    onValueChange={(value) => handleFilterChange('destination_connection_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Destinations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Destinations</SelectItem>
                      {destinations.map((dest) => (
                        <SelectItem key={dest.id} value={dest.id.toString()}>
                          {dest.name}
                        </SelectItem>
                      ))}
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
                <CardTitle>Backups</CardTitle>
                {backups.total > 0 && (
                  <span className="text-sm text-muted-foreground">
                    Showing {backups.from}-{backups.to} of {backups.total}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backups.data.map((backup) => (
                  <Link key={backup.id} href={`/backups/${backup.id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent">
                      <div>
                        <div className="font-medium">
                          {backup.source_connection.name} → {backup.destination_connection.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getTypeLabel(backup.source_connection.type)} → {getTypeLabel(backup.destination_connection.type)} • {new Date(backup.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                          {formatBytes(backup.archive_size)}
                        </div>
                        <Badge variant={getStatusColor(backup.status) as any}>
                          {backup.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {backups.data.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">
                  {hasActiveFilters
                    ? 'No backups match your filters.'
                    : 'No backup operations found. Create your first backup to get started.'}
                </p>
              )}

              {/* Pagination */}
              {backups.last_page > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={backups.current_page === 1}
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      params.set('page', (backups.current_page - 1).toString());
                      router.get(`/backups?${params.toString()}`, {}, { preserveState: true });
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {backups.links.slice(1, -1).map((link, index) => (
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
                    disabled={backups.current_page === backups.last_page}
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      params.set('page', (backups.current_page + 1).toString());
                      router.get(`/backups?${params.toString()}`, {}, { preserveState: true });
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
