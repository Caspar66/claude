import { useState, useEffect, useRef } from 'react';
import { Settings, ChevronDown, MoreHorizontal, AlertTriangle, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { isPlanReviewProposal } from '@/types/domain';
import type {
  Proposal,
  PlanReviewProposal,
  EntityOwner,
  EntityPlanReview,
  PlanReviewEntry,
  Recommendation,
} from '@/types/domain';
import { formatCurrency } from '@/lib/utils';

interface Props {
  proposals: Array<Proposal | PlanReviewProposal>;
  scenarioId: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getProposedBalance(entry: PlanReviewEntry): number {
  if (entry.recommendation === 'Hold') return entry.platform.balance;
  if (entry.recommendation === 'Close') return 0;
  return entry.proposedBalance;
}

// ── Standard Proposal Table ───────────────────────────────────────────────────

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

// ── Multi-Entity Plan Review Table ────────────────────────────────────────────

interface EntityRowProps {
  entityReview: EntityPlanReview;
  proposalId: string;
  scenarioId: string;
}

function EntityReviewRow({ entityReview, proposalId, scenarioId }: EntityRowProps) {
  const [expanded, setExpanded] = useState(true);
  const navigate = useNavigate();
  const { owner, entries } = entityReview;

  const hasWarning = entries.some((e) => e.platform.hasWarning);

  // From = all platforms (current)
  const fromPlatforms = entries.map((e) => ({
    name: e.platform.name,
    accountNumber: e.platform.accountNumber,
    type: e.platform.type as string,
    balance: e.platform.balance,
    hasWarning: e.platform.hasWarning,
  }));

  // To = platforms that aren't closed + unallocated
  const toPlatforms: Array<{ name: string; type: string; balance: number; hasWarning?: boolean }> = [];
  let unallocated = 0;
  for (const e of entries) {
    if (e.recommendation === 'Close') {
      unallocated += e.platform.balance;
    } else {
      toPlatforms.push({
        name: e.platform.name,
        type: e.platform.type,
        balance: getProposedBalance(e),
        hasWarning: e.platform.hasWarning,
      });
    }
  }
  if (unallocated > 0) {
    toPlatforms.push({ name: 'Unallocated', type: '', balance: unallocated });
  }

  return (
    <>
      {/* Entity header row */}
      <tr className="border-b border-border bg-gray-50/50">
        <td className="pl-2 py-1.5">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronDown
              size={13}
              className={`transition-transform ${expanded ? '' : '-rotate-90'}`}
            />
          </button>
        </td>
        <td className="px-3 py-1.5 text-sm font-medium">{owner}</td>
        <td className="px-3 py-1.5">
          <button
            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
            onClick={() =>
              navigate(
                `/scenarios/${scenarioId}/proposals/plan-review/${proposalId}?entity=${owner}`
              )
            }
          >
            Plan Review
            {hasWarning && <AlertTriangle size={13} className="text-amber-500" />}
          </button>
        </td>
        <td colSpan={4} />
      </tr>

      {/* From rows */}
      {expanded &&
        fromPlatforms.map((p, i) => (
          <tr key={`from-${i}`} className="border-b border-border last:border-0 hover:bg-slate-50">
            <td colSpan={2} />
            <td />
            <td className="px-2 py-1.5 text-xs font-medium text-muted-foreground w-10">
              {i === 0 ? 'From' : ''}
            </td>
            <td className="px-3 py-1.5 text-sm">{p.name}</td>
            <td className="px-3 py-1.5 text-sm text-muted-foreground">{p.type}</td>
            <td className="px-3 py-1.5 text-right text-sm">
              <span className="flex items-center justify-end gap-1">
                {formatCurrency(p.balance)}
                {p.hasWarning && <AlertTriangle size={12} className="text-amber-500" />}
              </span>
            </td>
          </tr>
        ))}

      {/* To rows */}
      {expanded &&
        toPlatforms.map((p, i) => (
          <tr key={`to-${i}`} className="border-b border-border last:border-0 hover:bg-slate-50">
            <td colSpan={2} />
            <td />
            <td className="px-2 py-1.5 text-xs font-medium text-muted-foreground w-10">
              {i === 0 ? 'To' : ''}
            </td>
            <td className="px-3 py-1.5 text-sm">{p.name}</td>
            <td className="px-3 py-1.5 text-sm text-muted-foreground">{p.type}</td>
            <td className="px-3 py-1.5 text-right text-sm">
              <span className="flex items-center justify-end gap-1">
                {formatCurrency(p.balance)}
                {p.hasWarning && <AlertTriangle size={12} className="text-amber-500" />}
              </span>
            </td>
          </tr>
        ))}
    </>
  );
}

function MultiEntityPlanReviewTable({
  proposal,
  scenarioId,
}: {
  proposal: PlanReviewProposal;
  scenarioId: string;
}) {
  const { entityReviews } = proposal;
  if (!entityReviews) return null;

  return (
    <div>
      {/* Sub-header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-gray-50">
        <div className="flex gap-6 text-xs font-semibold text-muted-foreground">
          <span className="w-8" />
          <span className="w-24">Owner</span>
          <span>Proposal Type</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              Recommend and Acquire <ChevronDown size={12} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Recommend</DropdownMenuItem>
            <DropdownMenuItem>Acquire</DropdownMenuItem>
            <DropdownMenuItem>Recommend &amp; Acquire</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <table className="w-full text-sm">
        <colgroup>
          <col className="w-8" />
          <col className="w-28" />
          <col className="w-36" />
          <col className="w-12" />
          <col />
          <col className="w-28" />
          <col className="w-32" />
        </colgroup>
        <tbody>
          {entityReviews.map((er) => (
            <EntityReviewRow
              key={er.owner}
              entityReview={er}
              proposalId={proposal.id}
              scenarioId={scenarioId}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Single-Entity Plan Review Summary ─────────────────────────────────────────

function PlanReviewSummary({
  proposal,
  scenarioId,
}: {
  proposal: PlanReviewProposal;
  scenarioId: string;
}) {
  const navigate = useNavigate();

  // Multi-entity: delegate
  if (proposal.entityReviews) {
    return <MultiEntityPlanReviewTable proposal={proposal} scenarioId={scenarioId} />;
  }

  const currentTotal = proposal.entries.reduce((s, e) => s + e.platform.balance, 0);
  const proposedTotal = proposal.entries.reduce((s, e) => s + e.proposedBalance, 0);
  const unallocated = proposal.entries
    .filter((e) => e.recommendation === 'Close')
    .reduce((s, e) => s + e.platform.balance, 0);

  return (
    <div>
      <div className="flex justify-end p-2 border-b border-border bg-gray-50">
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() =>
            navigate(
              `/scenarios/${scenarioId}/proposals/plan-review/${proposal.id}?entity=${proposal.owner}`
            )
          }
        >
          <Pencil size={12} className="mr-1" />
          Edit Plan Review
        </Button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-border">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Plan Name</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Plan Type</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Recommendation</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Current Balance</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Proposed Balance</th>
          </tr>
        </thead>
        <tbody>
          {proposal.entries.map((entry) => (
            <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-slate-50">
              <td className="px-3 py-2 text-sm">
                {entry.platform.name} ({entry.platform.accountNumber})
              </td>
              <td className="px-3 py-2 text-sm">{entry.platform.type}</td>
              <td className="px-3 py-2 text-sm text-muted-foreground">{entry.recommendation}</td>
              <td className="px-3 py-2 text-right text-sm">{formatCurrency(entry.platform.balance)}</td>
              <td className="px-3 py-2 text-right text-sm">{formatCurrency(entry.proposedBalance)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {unallocated > 0 && (
            <tr className="border-t border-border">
              <td colSpan={3} className="px-3 py-1.5 text-xs text-right text-muted-foreground">
                <span className="flex items-center justify-end gap-1">
                  Unallocated amount <AlertTriangle size={12} className="text-amber-500" />
                </span>
              </td>
              <td />
              <td className="px-3 py-1.5 text-right text-xs text-amber-700 font-medium">
                {formatCurrency(unallocated)}
              </td>
            </tr>
          )}
          <tr className="border-t border-border font-semibold">
            <td colSpan={3} className="px-3 py-2 text-right text-sm">Total</td>
            <td className="px-3 py-2 text-right text-sm">{formatCurrency(currentTotal)}</td>
            <td className="px-3 py-2 text-right text-sm">
              {formatCurrency(proposedTotal + unallocated)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── Rename Modal ──────────────────────────────────────────────────────────────

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

// ── Main Section ──────────────────────────────────────────────────────────────

export function ProposalsSection({ proposals, scenarioId }: Props) {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(proposals[0]?.id ?? '');
  const [renameOpen, setRenameOpen] = useState(false);

  const scenario = state.clientFile.scenarios.find((s) => s.id === scenarioId);

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

  function handleAddProposal(entity: EntityOwner) {
    if (entity === 'Joint') {
      // Auto-create a multi-entity Plan Review with all entities
      if (!scenario) return;
      const label = `Proposal ${proposals.length + 1} (Joint)`;
      const entityReviews = scenario.entities.map((e) => ({
        owner: e.owner,
        entries: e.platforms.map((p) => ({
          id: p.id,
          platform: p,
          recommendation: 'Hold' as Recommendation,
          proposedInvestments: p.investments.map((i) => ({ ...i })),
          proposedBalance: p.balance,
        })),
      }));
      const proposal: PlanReviewProposal = {
        id: `pr-joint-${Date.now()}`,
        label,
        kind: 'plan-review',
        owner: 'Joint',
        entries: [],
        entityReviews,
      };
      dispatch({ type: 'ADD_PROPOSAL_ANY', scenarioId, proposal });
      // Switch to the new tab (it will appear as the last proposal)
      setTimeout(() => setActiveTab(proposal.id), 50);
    } else {
      navigate(`/scenarios/${scenarioId}/add-proposal?entity=${entity}`);
    }
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
            {/* Add Proposal — entity dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  Add Proposal <ChevronDown size={12} className="ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAddProposal('Client')}>
                  Client
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddProposal('Partner')}>
                  Partner
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddProposal('Joint')}>
                  Joint
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
                    className="max-w-[200px] truncate text-xs data-[state=active]:bg-teal-700 data-[state=active]:text-white"
                    title={p.label}
                  >
                    {isPlanReviewProposal(p) && (
                      <span className="mr-1 opacity-70 text-[10px]">[PR]</span>
                    )}
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>

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
                  <DropdownMenuItem onClick={handleCopy}>Copy proposal</DropdownMenuItem>
                  <DropdownMenuItem disabled>Combine proposals</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {proposals.map((p) => (
              <TabsContent key={p.id} value={p.id} className="mt-0">
                {isPlanReviewProposal(p) ? (
                  <PlanReviewSummary proposal={p} scenarioId={scenarioId} />
                ) : (
                  <ProposalTable proposal={p} />
                )}
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
