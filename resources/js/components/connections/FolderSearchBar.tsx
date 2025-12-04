import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useCallback } from 'react';

interface FolderSearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  loading: boolean;
}

export function FolderSearchBar({ onSearch, onClear, loading }: FolderSearchBarProps) {
  const [value, setValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');

  // Debounce the search value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  // Trigger search when debounced value changes
  useEffect(() => {
    if (debouncedValue.trim()) {
      onSearch(debouncedValue.trim());
    } else if (debouncedValue === '' && value === '') {
      onClear();
    }
  }, [debouncedValue, onSearch, onClear, value]);

  const handleClear = useCallback(() => {
    setValue('');
    setDebouncedValue('');
    onClear();
  }, [onClear]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search folders..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9 pr-9"
      />
      {loading ? (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : value ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
          onClick={handleClear}
        >
          <X className="h-3 w-3" />
        </Button>
      ) : null}
    </div>
  );
}
