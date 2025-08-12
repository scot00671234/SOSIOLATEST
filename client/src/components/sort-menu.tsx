import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SortMenuProps {
  currentSort: 'hot' | 'new';
  onSortChange: (sort: 'hot' | 'new') => void;
  className?: string;
}

export default function SortMenu({ currentSort, onSortChange, className }: SortMenuProps) {
  return (
    <div className={cn("flex items-center gap-1 mb-4", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSortChange('hot')}
        className={cn(
          "text-xs font-medium transition-colors px-3 py-1.5 h-auto",
          currentSort === 'hot'
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
        data-testid="sort-hot"
      >
        Hot
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSortChange('new')}
        className={cn(
          "text-xs font-medium transition-colors px-3 py-1.5 h-auto",
          currentSort === 'new'
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
        data-testid="sort-new"
      >
        New
      </Button>
    </div>
  );
}