import { Card, CardContent } from '@/components/ui/card';
import { TechnologyConfig } from '@/config/connection-types';
import { TechnologyIcon } from './TechnologyIcon';
import { cn } from '@/lib/utils';

interface TechnologyCardProps {
  technology: TechnologyConfig;
  selected?: boolean;
  onClick: () => void;
}

export function TechnologyCard({ technology, selected = false, onClick }: TechnologyCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:border-primary hover:shadow-md',
        selected && 'border-primary ring-2 ring-primary ring-offset-2'
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center p-6 text-center">
        <TechnologyIcon type={technology.type} size="lg" showBackground />
        <h3 className="mt-3 font-semibold">{technology.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{technology.description}</p>
      </CardContent>
    </Card>
  );
}
