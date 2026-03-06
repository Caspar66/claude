import { AlertTriangle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { CurrencyCell } from '@/components/shared/CurrencyCell';
import { cn } from '@/lib/utils';
import type { Platform } from '@/types/domain';

interface Props {
  platform: Platform;
  ownerSplit?: string;
}

export function PlatformRow({ platform, ownerSplit }: Props) {
  const navigate = useNavigate();
  const { scenarioId } = useParams<{ scenarioId: string }>();

  return (
    <tr
      className={cn(
        'border-b border-border last:border-0 hover:bg-slate-50 transition-colors',
        platform.hasWarning && 'bg-amber-50'
      )}
    >
      <td className="pl-8 pr-3 py-2 text-sm">
        <div className="flex items-center gap-2">
          {platform.hasWarning && (
            <AlertTriangle size={13} className="text-amber-500 shrink-0" />
          )}
          <button
            className={cn(
              'hover:underline text-left',
              platform.hasWarning ? 'text-red-600' : 'text-blue-600'
            )}
            onClick={() => navigate(`/scenarios/${scenarioId}/plan/${platform.id}/edit`)}
          >
            {platform.name} ({platform.accountNumber})
          </button>
          {platform.hasWarning && (
            <Badge variant="warning" className="text-xs px-1.5 py-0">!</Badge>
          )}
        </div>
        {ownerSplit && (
          <div className="text-xs text-muted-foreground mt-0.5 pl-5">{ownerSplit}</div>
        )}
      </td>
      <td className="px-3 py-2 text-sm text-muted-foreground">{platform.type}</td>
      <td className="px-3 py-2 text-sm text-right">
        <CurrencyCell value={platform.balance} />
      </td>
    </tr>
  );
}
