import { Card, CardContent } from '@/components/ui/card';
import { ConnectionCategory } from '@/config/connection-types';
import { Database, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryStepProps {
  onSelect: (category: ConnectionCategory) => void;
}

const categories = [
  {
    id: 'source' as ConnectionCategory,
    title: 'Data Source',
    description: 'Connect to a database or storage to backup from',
    icon: Database,
    color: 'bg-blue-500',
  },
  {
    id: 'destination' as ConnectionCategory,
    title: 'Backup Destination',
    description: 'Where to store your backups',
    icon: HardDrive,
    color: 'bg-green-500',
  },
];

export function CategoryStep({ onSelect }: CategoryStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">What would you like to connect?</h2>
        <p className="mt-2 text-muted-foreground">
          Choose whether you're adding a data source or a backup destination
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
            onClick={() => onSelect(category.id)}
          >
            <CardContent className="flex flex-col items-center p-8 text-center">
              <div
                className={cn(
                  'flex h-16 w-16 items-center justify-center rounded-xl',
                  category.color
                )}
              >
                <category.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">{category.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
