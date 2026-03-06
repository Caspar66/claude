import { ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  column: string;
  currentColumn: string;
  direction: 'asc' | 'desc';
  onSort: (col: string) => void;
  className?: string;
}

export function SortableColumnHeader({ label, column, currentColumn, direction, onSort, className }: Props) {
  const isActive = currentColumn === column;
  return (
    <th
      className={cn(
        'px-3 py-2 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none whitespace-nowrap hover:text-foreground',
        className
      )}
      onClick={() => onSort(column)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
        ) : (
          <ChevronsUpDown size={12} className="opacity-40" />
        )}
      </span>
    </th>
  );
}
