import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Connection {
  id: number;
  name: string;
  type: string;
}

interface Props {
  sources: Connection[];
  destinations: Connection[];
}

export default function Create({ sources, destinations }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    source_connection_id: '',
    destination_connection_id: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/backups');
  };

  return (
    <AppLayout>
      <Head title="Create Backup" />

      <div className="py-12">
        <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Create New Backup</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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

                {errors.error && <p className="text-sm text-red-500">{errors.error}</p>}

                <div className="flex gap-2">
                  <Button type="submit" disabled={processing}>
                    Start Backup
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
