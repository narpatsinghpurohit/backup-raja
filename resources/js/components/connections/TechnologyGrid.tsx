import { Button } from '@/components/ui/button';
import {
  ConnectionCategory,
  getTechnologiesByCategory,
  TechnologyConfig,
} from '@/config/connection-types';
import { TechnologyCard } from './TechnologyCard';
import { ArrowLeft } from 'lucide-react';

interface TechnologyGridProps {
  category: ConnectionCategory;
  onSelect: (technology: TechnologyConfig) => void;
  onBack: () => void;
}

export function TechnologyGrid({ category, onSelect, onBack }: TechnologyGridProps) {
  const technologies = getTechnologiesByCategory(category);
  const title = category === 'source' ? 'Select a Data Source' : 'Select a Backup Destination';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h2 className="text-2xl font-semibold">{title}</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {technologies.map((technology) => (
          <TechnologyCard
            key={technology.type}
            technology={technology}
            onClick={() => onSelect(technology)}
          />
        ))}
      </div>
    </div>
  );
}
