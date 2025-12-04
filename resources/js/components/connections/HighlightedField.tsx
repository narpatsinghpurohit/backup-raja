import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface HighlightedFieldProps {
  children: React.ReactNode;
  helpText: string;
  className?: string;
}

export function HighlightedField({ children, helpText, className }: HighlightedFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative rounded-md border-2 border-blue-200 bg-blue-50/50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
        <div className="absolute -right-2 -top-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
                  <Info className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{helpText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {children}
      </div>
      <p className="text-xs text-muted-foreground">💡 {helpText}</p>
    </div>
  );
}
