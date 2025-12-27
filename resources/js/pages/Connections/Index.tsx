import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, CheckCircle2, AlertCircle, X, Copy, Search, LayoutGrid, List } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { TechnologyIcon } from '@/components/connections/TechnologyIcon';
import {
  ConnectionCategory,
  CONNECTION_TECHNOLOGIES,
  getCategoryForType,
  getTechnologyByType,
} from '@/config/connection-types';

interface Connection {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
  last_validated_at: string | null;
  created_at: string;
}

interface Filters {
  tab: 'source' | 'destination';
  search: string;
  tech: string;
  view: 'grid' | 'list';
}

interface Props {
  connections: Connection[];
  filters: Filters;
}

export default function Index({ connections, filters }: Props) {
  const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
  const hasFlash = Boolean(flash?.success || flash?.error);
  const [showFlash, setShowFlash] = useState(hasFlash);

  // Use filters from URL (passed by backend)
  const activeTab = filters.tab;
  const searchQuery = filters.search;
  const selectedTechnology = filters.tech;
  const viewMode = filters.view;

  // Get unique technologies for the active tab
  const technologiesForTab = useMemo(() => {
    return CONNECTION_TECHNOLOGIES.filter((t) => t.category === activeTab).reduce(
      (acc, tech) => {
        if (!acc.find((t) => t.name === tech.name)) {
          acc.push(tech);
        }
        return acc;
      },
      [] as typeof CONNECTION_TECHNOLOGIES
    );
  }, [activeTab]);

  // Use a ref to track flash changes and sync with timer
  useEffect(() => {
    if (hasFlash) {
      const timer = setTimeout(() => setShowFlash(false), 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [hasFlash]);

  const filteredConnections = useMemo(() => {
    return connections.filter((connection) => {
      // Filter by tab (category)
      const category = getCategoryForType(connection.type);
      if (category !== activeTab) {
        return false;
      }

      // Filter by search query
      if (searchQuery && !connection.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Filter by technology
      if (selectedTechnology !== 'all') {
        const tech = getTechnologyByType(connection.type);
        const selectedTech = getTechnologyByType(selectedTechnology);
        if (tech?.name !== selectedTech?.name) {
          return false;
        }
      }

      return true;
    });
  }, [connections, activeTab, searchQuery, selectedTechnology]);

  // Update URL with filters
  const updateFilters = (newFilters: Partial<Filters>) => {
    const params = {
      tab: newFilters.tab ?? activeTab,
      search: newFilters.search ?? searchQuery,
      tech: newFilters.tech ?? selectedTechnology,
      view: newFilters.view ?? viewMode,
    };

    // Clean up empty/default values
    const cleanParams: Record<string, string> = {};
    if (params.tab !== 'source') cleanParams.tab = params.tab;
    if (params.search) cleanParams.search = params.search;
    if (params.tech !== 'all') cleanParams.tech = params.tech;
    if (params.view !== 'grid') cleanParams.view = params.view;

    router.get('/connections', cleanParams, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };

  const handleTabChange = (tab: 'source' | 'destination') => {
    // Reset tech filter when switching tabs (different technologies per tab)
    updateFilters({ tab, tech: 'all' });
  };

  const handleDelete = (id: number, name: string) => {
    if (
      confirm(
        `Are you sure you want to delete "${name}"?\n\nThis will fail if there are active backup operations using this connection.`
      )
    ) {
      router.delete(`/connections/${id}`, {
        onError: (errors) => {
          if (errors.error) {
            alert(`Failed to delete connection:\n\n${errors.error}`);
          } else {
            alert('Failed to delete connection. Please try again.');
          }
        },
      });
    }
  };

  const clearFilters = () => {
    updateFilters({ search: '', tech: 'all' });
  };

  // Count connections per tab for the badge
  const sourceCount = connections.filter((c) => getCategoryForType(c.type) === 'source').length;
  const destCount = connections.filter((c) => getCategoryForType(c.type) === 'destination').length;

  return (
    <AppLayout>
      <Head title="Connections" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Flash Messages */}
          {showFlash && flash?.success && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
              <CheckCircle2 className="h-5 w-5" />
              <p>{flash.success}</p>
              <button onClick={() => setShowFlash(false)} className="ml-auto">
                ×
              </button>
            </div>
          )}

          {showFlash && flash?.error && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
              <AlertCircle className="h-5 w-5" />
              <p>{flash.error}</p>
              <button onClick={() => setShowFlash(false)} className="ml-auto">
                ×
              </button>
            </div>
          )}

          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Connections</h1>
            <Link href="/connections/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Connection
              </Button>
            </Link>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-border">
            <div className="flex gap-6">
              <button
                onClick={() => handleTabChange('source')}
                className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'source'
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Sources
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {sourceCount}
                </span>
              </button>
              <button
                onClick={() => handleTabChange('destination')}
                className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'destination'
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Destinations
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {destCount}
                </span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`Search ${activeTab === 'source' ? 'sources' : 'destinations'}...`}
                value={searchQuery}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="pl-10"
              />
            </div>
            <Select value={selectedTechnology} onValueChange={(value) => updateFilters({ tech: value })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All technologies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All technologies</SelectItem>
                {technologiesForTab.map((tech) => (
                  <SelectItem key={tech.type} value={tech.type}>
                    {tech.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex rounded-md border border-border">
              <button
                onClick={() => updateFilters({ view: 'grid' })}
                className={`p-2 transition-colors ${viewMode === 'grid'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => updateFilters({ view: 'list' })}
                className={`p-2 transition-colors ${viewMode === 'list'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredConnections.map((connection) => {
                const technology = getTechnologyByType(connection.type);
                return (
                  <Card key={connection.id}>
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <TechnologyIcon type={connection.type} size="md" showBackground />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="truncate">{connection.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {technology?.name || connection.type}
                          </p>
                        </div>
                        <Badge variant={connection.is_active ? 'default' : 'destructive'}>
                          {connection.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/connections/${connection.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </Link>
                        <Link href={`/connections/${connection.id}/duplicate`}>
                          <Button variant="outline" size="sm">
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(connection.id, connection.name)}
                          title="Delete connection (only if no backup operations exist)"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                      {!connection.is_active && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          This connection is inactive and won't be used for new backups
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredConnections.map((connection) => {
                    const technology = getTechnologyByType(connection.type);
                    return (
                      <tr key={connection.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <TechnologyIcon type={connection.type} size="sm" showBackground />
                            <span className="font-medium">{connection.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {technology?.name || connection.type}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={connection.is_active ? 'default' : 'destructive'}>
                            {connection.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Link href={`/connections/${connection.id}/edit`}>
                              <Button variant="outline" size="sm" title="Edit">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/connections/${connection.id}/duplicate`}>
                              <Button variant="outline" size="sm" title="Duplicate">
                                <Copy className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(connection.id, connection.name)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State: No matches */}
          {filteredConnections.length === 0 && connections.length > 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No {activeTab === 'source' ? 'sources' : 'destinations'} match your filters.
                </p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Empty State: No connections at all */}
          {connections.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No connections found. Create your first connection to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout >
  );
}
