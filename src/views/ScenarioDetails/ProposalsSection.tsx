import { Settings, ChevronDown } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CurrencyCell } from '@/components/shared/CurrencyCell';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { Proposal } from '@/types/domain';

interface Props {
  proposals: Proposal[];
}

function ProposalTable({ proposal }: { proposal: Proposal }) {
  if (proposal.rows.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        No rows in this proposal yet.
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b border-border">
        <tr>
          <th className="w-8" />
          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Owner</th>
          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Proposal Type</th>
          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">From</th>
          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">To</th>
          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Type</th>
          <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Balance</th>
        </tr>
      </thead>
      <tbody>
        {proposal.rows.map((row) => (
          <tr key={row.id} className="border-b border-border last:border-0 hover:bg-slate-50">
            <td className="pl-2 py-2">
              <button className="text-muted-foreground hover:text-foreground">
                <ChevronDown size={13} />
              </button>
            </td>
            <td className="px-3 py-2">{row.owner}</td>
            <td className="px-3 py-2">
              <span className="text-blue-600 hover:underline cursor-pointer">{row.proposalType}</span>
            </td>
            <td className="px-3 py-2 text-sm">
              {row.fromPlatform.name}
              <div className="text-xs text-muted-foreground">({row.fromPlatform.accountNumber})</div>
            </td>
            <td className="px-3 py-2 text-sm">
              {row.toPlatform.name}
              <div className="text-xs text-muted-foreground">({row.toPlatform.accountNumber})</div>
            </td>
            <td className="px-3 py-2">{row.fromPlatform.type}</td>
            <td className="px-3 py-2 text-right">
              <CurrencyCell value={row.balance} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ProposalsSection({ proposals }: Props) {
  if (proposals.length === 0) return null;

  return (
    <section className="mb-4">
      <div className="flex items-center justify-between px-4 py-2 bg-teal-700 text-white rounded-t">
        <span className="text-sm font-semibold flex items-center gap-2">
          <Settings size={14} />
          Proposals
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
          >
            Add Proposal
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
              >
                Recommend and Acquire <ChevronDown size={12} className="ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Recommend</DropdownMenuItem>
              <DropdownMenuItem>Acquire</DropdownMenuItem>
              <DropdownMenuItem>Recommend &amp; Acquire</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="border border-border border-t-0 rounded-b overflow-hidden">
        <Tabs defaultValue={proposals[0]?.id}>
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-gray-50 h-auto p-1 gap-1 flex-wrap">
            {proposals.map((p) => (
              <TabsTrigger
                key={p.id}
                value={p.id}
                className="max-w-[180px] truncate text-xs data-[state=active]:bg-teal-700 data-[state=active]:text-white"
                title={p.label}
              >
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {proposals.map((p) => (
            <TabsContent key={p.id} value={p.id} className="mt-0">
              <ProposalTable proposal={p} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
