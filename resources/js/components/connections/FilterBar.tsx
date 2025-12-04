import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CONNECTION_TECHNOLOGIES, ConnectionCategory } from '@/config/connection-types';
import { Search } from 'lucide-react';

interface FilterBarProps {
  selectedCategory: ConnectionCategory | 'all';
  selectedTechnology: string | 'all';
  searchQuery: string;
  onCategoryChange: (category: ConnectionCategory | 'all') => void;
  onTechnologyChange: (type: string | 'all') => void;
  onSearchChange: (query: string) => void;
}

export function FilterBar({
  selectedCategory,
  selectedTechnology,
  searchQuery,
  onCategoryChange,
  onTechnologyChange,
  onSearchChange,
}: FilterBarProps) {
  // Get unique technologies for the dropdown
  const uniqueTechnologies = CONNECTION_TECHNOLOGIES.reduce(
    (acc, tech) => {
      if (!acc.find((t) => t.name === tech.name)) {
        acc.push(tech);
      }
      return acc;
    },
    [] as typeof CONNECTION_TECHNOLOGIES
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search connections..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Category:</span>
          <ToggleGroup
            type="single"
            value={selectedCategory}
            onValueChange={(value) => {
              if (value) onCategoryChange(value as ConnectionCategory | 'all');
            }}
          >
            <ToggleGroupItem value="all" aria-label="All">
              All
            </ToggleGroupItem>
            <ToggleGroupItem value="source" aria-label="Sources">
              Sources
            </ToggleGroupItem>
            <ToggleGroupItem value="destination" aria-label="Destinations">
              Destinations
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Technology:</span>
          <Select value={selectedTechnology} onValueChange={onTechnologyChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All technologies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All technologies</SelectItem>
              {uniqueTechnologies.map((tech) => (
                <SelectItem key={tech.type} value={tech.type}>
                  {tech.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
