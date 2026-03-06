import { useState } from 'react';
import { ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { PlatformRow } from './PlatformRow';
import { cn } from '@/lib/utils';
import type { Entity, EntityOwner } from '@/types/domain';

interface EntityGroupProps {
  label: EntityOwner;
  entity: Entity;
}

function EntityGroup({ label, entity }: EntityGroupProps) {
  const [open, setOpen] = useState(true);

  const totalBalance = entity.platforms.reduce((sum, p) => sum + p.balance, 0);

  return (
    <tbody>
      {/* Group header row */}
      <tr className="bg-gray-50 border-b border-border">
        <td colSpan={3} className="px-3 py-1.5">
          <button
            className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-teal-700 transition-colors"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {label}
          </button>
        </td>
      </tr>

      {open &&
        entity.platforms.map((platform) => (
          <PlatformRow
            key={platform.id}
            platform={platform}
            ownerSplit={
              entity.owner === 'Joint' && entity.ownershipSplit
                ? `Partner ${entity.ownershipSplit.partner}% / Client ${entity.ownershipSplit.client}%`
                : undefined
            }
          />
        ))}

      {/* Group total */}
      {open && (
        <tr className="border-b border-border bg-gray-50/60">
          <td className="pl-8 pr-3 py-1.5 text-xs text-muted-foreground">{label} Total</td>
          <td />
          <td className="px-3 py-1.5 text-xs text-right font-medium tabular-nums">
            {new Intl.NumberFormat('en-AU', {
              style: 'currency',
              currency: 'AUD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(totalBalance)}
          </td>
        </tr>
      )}
    </tbody>
  );
}

interface Props {
  entities: Entity[];
}

export function CurrentSituationSection({ entities }: Props) {
  const groups: EntityOwner[] = ['Client', 'Partner', 'Joint'];

  return (
    <section className="mb-4">
      <div className="flex items-center justify-between px-4 py-2 bg-teal-700 text-white rounded-t">
        <span className="text-sm font-semibold flex items-center gap-2">
          <Settings size={14} />
          Current Situation
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
            >
              Add Existing <ChevronDown size={11} className="ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Super</DropdownMenuItem>
            <DropdownMenuItem>Pension</DropdownMenuItem>
            <DropdownMenuItem>Investment</DropdownMenuItem>
            <DropdownMenuItem>SMSF</DropdownMenuItem>
            <DropdownMenuItem>Insurance</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="border border-border border-t-0 rounded-b overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Platform</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Type</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Account Balance</th>
            </tr>
          </thead>

          {groups.map((owner) => {
            const entity = entities.find((e) => e.owner === owner);
            if (!entity) return null;
            return <EntityGroup key={owner} label={owner} entity={entity} />;
          })}
        </table>
      </div>
    </section>
  );
}
