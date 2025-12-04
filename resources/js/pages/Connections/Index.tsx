import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FilterBar } from '@/components/connections/FilterBar';
import { TechnologyIcon } from '@/components/connections/TechnologyIcon';
import {
  ConnectionCategory,
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

interface Props {
  connections: Connection[];
}

export default function Index({ connections }: Props) {
  const { flash } = usePage<any>().props;
  const [showFlash, setShowFlash] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ConnectionCategory | 'all'>('all');
  const [selectedTechnology, setSelectedTechnology] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (flash?.success || flash?.error) {
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  const filteredConnections = useMemo(() => {
    return connections.filter((connection) => {
      // Filter by search query
      if (searchQuery && !connection.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Filter by category
      if (selectedCategory !== 'all') {
        const category = getCategoryForType(connection.type);
        if (category !== selectedCategory) {
          return false;
        }
      }


      // Filter by technology
      if (selectedTechnology !== 'all') {
        // Handle matching by technology name (e.g., both s3 and s3_destination match "Amazon S3")
        const tech = getTechnologyByType(connection.type);
        const selectedTech = getTechnologyByType(selectedTechnology);
        if (tech?.name !== selectedTech?.name) {
          return false;
        }
      }

      return true;
    });
  }, [connections, searchQuery, selectedCategory, selectedTechnology]);

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
    setSelectedCategory('all');
    setSelectedTechnology('all');
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedCategory !== 'all' || selectedTechnology !== 'all' || searchQuery !== '';

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

          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Connections</h1>
            <Link href="/connections/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Connection
              </Button>
            </Link>
          </div>

          <div className="mb-6">
            <FilterBar
              selectedCategory={selectedCategory}
              selectedTechnology={selectedTechnology}
              searchQuery={searchQuery}
              onCategoryChange={setSelectedCategory}
              onTechnologyChange={setSelectedTechnology}
              onSearchChange={setSearchQuery}
            />
          </div>

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
                    <div className="flex gap-2">
                      <Link href={`/connections/${connection.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
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

          {filteredConnections.length === 0 && connections.length > 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No connections match your filters.</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          )}

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
    </AppLayout>
  );
}
