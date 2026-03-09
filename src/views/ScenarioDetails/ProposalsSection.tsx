import { useState, useEffect, useRef } from 'react';
import { Settings, ChevronDown, MoreHorizontal } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CurrencyCell } from '@/components/shared/CurrencyCell';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { useAppContext } from '@/context/AppContext';
import type { Proposal } from '@/types/domain';

interface Props {
  proposals: Proposal[];
  scenarioId: string;
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground p-0.5 rounded">
                    <ChevronDown size={13} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuItem>Edit Proposal</DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Edit Plan Fees</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem>Administration Fees</DropdownMenuItem>
                      <DropdownMenuItem>Adviser Fees</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem>Insurance Review</DropdownMenuItem>
                  <DropdownMenuItem>Replacement Advice</DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>View Plan Summary &amp; PDS</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem>Plan Summary</DropdownMenuItem>
                      <DropdownMenuItem>PDS Document</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
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

interface RenameModalProps {
  open: boolean;
  currentLabel: string;
  onConfirm: (name: string) => void;
  onClose: () => void;
}

function RenameModal({ open, currentLabel, onConfirm, onClose }: RenameModalProps) {
  const [value, setValue] = useState(currentLabel);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(currentLabel);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, currentLabel]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim()) onConfirm(value.trim());
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-teal-700 text-white">
          <span className="text-sm font-semibold">Rename Proposal</span>
          <DialogClose asChild>
            <button className="text-white/80 hover:text-white text-lg leading-none" onClick={onClose}>
              ×
            </button>
          </DialogClose>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4">
          <label className="block text-sm font-medium mb-1.5" htmlFor="proposal-name">
            Proposal name
          </label>
          <input
            ref={inputRef}
            id="proposal-name"
            type="text"
            className="w-full border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-teal-700 hover:bg-teal-800 text-white"
              disabled={!value.trim()}
            >
              Rename
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProposalsSection({ proposals, scenarioId }: Props) {
  const { dispatch } = useAppContext();
  const [activeTab, setActiveTab] = useState(proposals[0]?.id ?? '');
  const [renameOpen, setRenameOpen] = useState(false);

  // Keep activeTab valid when proposals list changes (e.g., after delete)
  useEffect(() => {
    if (proposals.length === 0) {
      setActiveTab('');
    } else if (!proposals.find((p) => p.id === activeTab)) {
      setActiveTab(proposals[0].id);
    }
  }, [proposals, activeTab]);

  if (proposals.length === 0) return null;

  const activeProposal = proposals.find((p) => p.id === activeTab) ?? proposals[0];

  function handleRename(newLabel: string) {
    dispatch({ type: 'RENAME_PROPOSAL', scenarioId, proposalId: activeProposal.id, label: newLabel });
    setRenameOpen(false);
  }

  function handleDelete() {
    if (confirm(`Delete proposal "${activeProposal.label}"?`)) {
      dispatch({ type: 'DELETE_PROPOSAL', scenarioId, proposalId: activeProposal.id });
    }
  }

  function handleCopy() {
    const base = activeProposal.label;
    const existingCopies = proposals.filter((p) =>
      p.label.match(new RegExp(`^Copy of \\d+ ${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))
    ).length;
    const newLabel = `Copy of ${existingCopies + 1} ${base}`;
    dispatch({ type: 'COPY_PROPOSAL', scenarioId, proposalId: activeProposal.id, newLabel });
  }

  return (
    <>
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center border-b border-border bg-gray-50">
              <TabsList className="flex-1 justify-start rounded-none border-0 bg-transparent h-auto p-1 gap-1 flex-wrap">
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

              {/* Per-proposal actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="shrink-0 mr-1 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-gray-200 transition-colors"
                    title="Proposal actions"
                  >
                    <MoreHorizontal size={15} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                    Rename proposal
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={handleDelete}
                  >
                    Delete proposal
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCopy}>
                    Copy proposal
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    Combine proposals
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {proposals.map((p) => (
              <TabsContent key={p.id} value={p.id} className="mt-0">
                <ProposalTable proposal={p} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      <RenameModal
        open={renameOpen}
        currentLabel={activeProposal.label}
        onConfirm={handleRename}
        onClose={() => setRenameOpen(false)}
      />
    </>
  );
}
