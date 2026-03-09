import { useState } from 'react';
import { AlertTriangle, ChevronDown, Star } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CurrencyCell } from '@/components/shared/CurrencyCell';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import type { Platform } from '@/types/domain';

interface Props {
  platform: Platform;
  ownerSplit?: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}
        />
      ))}
    </div>
  );
}

function PlanResearchModal({
  platform,
  open,
  onClose,
}: {
  platform: Platform;
  open: boolean;
  onClose: () => void;
}) {
  const research = platform.research;

  const statusDotColor =
    research?.statusColor === 'red'
      ? 'bg-red-500'
      : research?.statusColor === 'amber'
        ? 'bg-amber-500'
        : 'bg-green-500';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-teal-700 text-white">
          <span className="text-sm font-semibold">Plan Research Summary</span>
          <DialogClose asChild>
            <button className="text-white/80 hover:text-white text-lg leading-none" onClick={onClose}>
              ×
            </button>
          </DialogClose>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <h3 className="text-base font-semibold mb-2">{platform.name}</h3>

          {research ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <StarRating rating={research.rating} />
                {research.statusColor && (
                  <span className={cn('inline-block w-3 h-3 rounded-full', statusDotColor)} />
                )}
              </div>

              {research.productUrl && (
                <a
                  href={research.productUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline text-sm block mb-3"
                >
                  {platform.name}
                </a>
              )}

              <p className="text-sm text-foreground mb-4">{research.description}</p>

              {research.documents.length > 0 && (
                <div className="flex flex-wrap gap-x-1 gap-y-1 text-sm">
                  {research.documents.map((doc, i) => (
                    <span key={i}>
                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {doc.label}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">{doc.label}</span>
                      )}
                      {i < research.documents.length - 1 && (
                        <span className="text-muted-foreground">, </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No research available for this product.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border">
          <Button variant="outline" size="sm">
            Report
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PlatformRow({ platform, ownerSplit }: Props) {
  const navigate = useNavigate();
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const { dispatch } = useAppContext();
  const [researchOpen, setResearchOpen] = useState(false);

  function handleRemove() {
    if (confirm(`Remove "${platform.name} (${platform.accountNumber})" from this scenario?`)) {
      dispatch({ type: 'DELETE_PLATFORM', scenarioId: scenarioId!, platformId: platform.id });
    }
  }

  return (
    <>
      <tr
        className={cn(
          'border-b border-border last:border-0 hover:bg-slate-50 transition-colors',
          platform.hasWarning && 'bg-amber-50'
        )}
      >
        <td className="pl-3 pr-3 py-2 text-sm">
          <div className="flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground p-0.5 rounded shrink-0">
                  <ChevronDown size={13} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem
                  onClick={() => navigate(`/scenarios/${scenarioId}/plan/${platform.id}/edit`)}
                >
                  Edit Existing Plan
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate(`/scenarios/${scenarioId}/plan/${platform.id}/fees`)}
                >
                  Edit Plan Fees
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setResearchOpen(true)}>
                  View Plan Research
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={handleRemove}
                >
                  Remove Plan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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

      <PlanResearchModal
        platform={platform}
        open={researchOpen}
        onClose={() => setResearchOpen(false)}
      />
    </>
  );
}
