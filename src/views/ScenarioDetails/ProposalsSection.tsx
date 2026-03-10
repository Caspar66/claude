import { useState, useEffect, useRef } from 'react';
import { Settings, ChevronDown, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
  PlanReviewEntry,
  Recommendation,
  ProposalStatus,
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

function computeUnallocated(entries: PlanReviewEntry[]): number {
  const totalClosed = entries
    .filter((e) => e.recommendation === 'Close')
    .reduce((s, e) => s + e.platform.balance, 0);
  const totalAllocatedAboveBase = entries
    .filter((e) => e.recommendation !== 'Close' && e.recommendation !== 'Hold')
    .reduce((s, e) => s + Math.max(0, getProposedBalance(e) - e.platform.balance), 0);
  return Math.max(0, totalClosed - totalAllocatedAboveBase);
}

interface FlatPlatform {
  id: string;
  name: string;
  type: string;
  balance: number;
  hasWarning?: boolean;
}

interface FeesItem {
  platformId: string;
  label: string;
  mode: 'proposed' | 'closing';
}

interface EntityData {
  key: string;
  owner: EntityOwner;
  proposalTypeLabel: string;
  hasWarning: boolean;
  editProposalPath: string;
  fromPlatforms: FlatPlatform[];
  toPlatforms: Array<{ name: string; type: string; balance: number; hasWarning?: boolean }>;
  feesItems: FeesItem[];
}

function getEntityData(
  proposal: Proposal | PlanReviewProposal,
  scenarioId: string
): EntityData[] {
  if (!isPlanReviewProposal(proposal)) {
    // Standard Proposal — one row per ProposalRow
    return proposal.rows.map((row) => ({
      key: row.id,
      owner: row.owner,
      proposalTypeLabel: row.proposalType,
      hasWarning: !!(row.fromPlatform.hasWarning || row.toPlatform.hasWarning),
      editProposalPath: `/scenarios/${scenarioId}/add-proposal?entity=${row.owner}`,
      fromPlatforms: [
        {
          id: row.fromPlatform.id,
          name: row.fromPlatform.name,
          type: row.fromPlatform.type,
          balance: row.balance,
          hasWarning: row.fromPlatform.hasWarning,
        },
      ],
      toPlatforms: [
        {
          name: row.toPlatform.name,
          type: row.toPlatform.type,
          balance: row.balance,
          hasWarning: row.toPlatform.hasWarning,
        },
      ],
      feesItems: [
        { platformId: row.toPlatform.id, label: `${row.toPlatform.name} (Proposed)`, mode: 'proposed' },
      ],
    }));
  }

  // PlanReviewProposal — multi-entity (Joint)
  if (proposal.entityReviews) {
    return proposal.entityReviews.map((er) => {
      const fromPlatforms: FlatPlatform[] = er.entries.map((e) => ({
        id: e.platform.id,
        name: e.platform.name,
        type: e.platform.type,
        balance: e.platform.balance,
        hasWarning: e.platform.hasWarning,
      }));

      const toPlatforms: Array<{ name: string; type: string; balance: number; hasWarning?: boolean }> = [];
      for (const e of er.entries) {
        if (e.recommendation !== 'Close') {
          toPlatforms.push({
            name: e.platform.name,
            type: e.platform.type,
            balance: getProposedBalance(e),
            hasWarning: e.platform.hasWarning,
          });
        }
      }
      const unallocated = computeUnallocated(er.entries);
      if (unallocated > 0) {
        toPlatforms.push({ name: 'Unallocated', type: '', balance: unallocated });
      }

      const feesItems: FeesItem[] = [
        ...er.entries
          .filter((e) => e.recommendation !== 'Close')
          .map((e) => ({
            platformId: e.platform.id,
            label: `${e.platform.name} (Proposed)`,
            mode: 'proposed' as const,
          })),
        ...er.entries
          .filter((e) => e.recommendation === 'Close')
          .map((e) => ({
            platformId: e.platform.id,
            label: `${e.platform.name} (Current)`,
            mode: 'closing' as const,
          })),
      ];

      return {
        key: er.owner,
        owner: er.owner,
        proposalTypeLabel: 'Plan Review',
        hasWarning: er.entries.some((e) => e.platform.hasWarning),
        editProposalPath: `/scenarios/${scenarioId}/proposals/plan-review/${proposal.id}?entity=${er.owner}`,
        fromPlatforms,
        toPlatforms,
        feesItems,
      };
    });
  }

  // PlanReviewProposal — single entity
  const fromPlatforms: FlatPlatform[] = proposal.entries.map((e) => ({
    id: e.platform.id,
    name: e.platform.name,
    type: e.platform.type,
    balance: e.platform.balance,
    hasWarning: e.platform.hasWarning,
  }));

  const toPlatforms: Array<{ name: string; type: string; balance: number; hasWarning?: boolean }> = [];
  for (const e of proposal.entries) {
    if (e.recommendation !== 'Close') {
      toPlatforms.push({
        name: e.platform.name,
        type: e.platform.type,
        balance: getProposedBalance(e),
        hasWarning: e.platform.hasWarning,
      });
    }
  }
  const unallocated = computeUnallocated(proposal.entries);
  if (unallocated > 0) {
    toPlatforms.push({ name: 'Unallocated', type: '', balance: unallocated });
  }

  const feesItems: FeesItem[] = [
    ...proposal.entries
      .filter((e) => e.recommendation !== 'Close')
      .map((e) => ({
        platformId: e.platform.id,
        label: `${e.platform.name} (Proposed)`,
        mode: 'proposed' as const,
      })),
    ...proposal.entries
      .filter((e) => e.recommendation === 'Close')
      .map((e) => ({
        platformId: e.platform.id,
        label: `${e.platform.name} (Current)`,
        mode: 'closing' as const,
      })),
  ];

  return [
    {
      key: proposal.owner,
      owner: proposal.owner,
      proposalTypeLabel: 'Plan Review',
      hasWarning: proposal.entries.some((e) => e.platform.hasWarning),
      editProposalPath: `/scenarios/${scenarioId}/proposals/plan-review/${proposal.id}?entity=${proposal.owner}`,
      fromPlatforms,
      toPlatforms,
      feesItems,
    },
  ];
}

// ── Unified Proposal Row ───────────────────────────────────────────────────────

interface UnifiedProposalRowProps {
  entityData: EntityData;
  proposalId: string;
  scenarioId: string;
}

function UnifiedProposalRow({ entityData, proposalId, scenarioId }: UnifiedProposalRowProps) {
  const navigate = useNavigate();
  const { owner, proposalTypeLabel, hasWarning, editProposalPath, fromPlatforms, toPlatforms, feesItems } =
    entityData;

  return (
    <>
      {/* Entity header row */}
      <tr className="border-b border-border bg-gray-50/50">
        <td className="pl-2 py-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                title="Actions"
              >
                <ChevronDown size={13} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuItem onClick={() => navigate(editProposalPath)}>
                Edit Proposal
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Edit Fees</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {feesItems.length === 0 ? (
                    <DropdownMenuItem disabled>No products</DropdownMenuItem>
                  ) : (
                    feesItems.map((item) => (
                      <DropdownMenuItem
                        key={item.label}
                        onClick={() =>
                          navigate(
                            `/scenarios/${scenarioId}/proposals/${proposalId}/fees/${item.platformId}?mode=${item.mode}`
                          )
                        }
                      >
                        {item.label}
                      </DropdownMenuItem>
                    ))
                  )}
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
        <td className="px-3 py-1.5 text-sm font-medium">{owner}</td>
        <td className="px-3 py-1.5">
          <button
            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
            onClick={() => navigate(editProposalPath)}
          >
            {proposalTypeLabel}
            {hasWarning && <AlertTriangle size={13} className="text-amber-500" />}
          </button>
        </td>
        <td colSpan={4} />
      </tr>

      {/* From rows */}
      {fromPlatforms.map((p, i) => (
        <tr key={`from-${p.id}-${i}`} className="border-b border-border hover:bg-slate-50">
          <td colSpan={2} />
          <td />
          <td className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
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
      {toPlatforms.map((p, i) => (
        <tr key={`to-${i}`} className="border-b border-border hover:bg-slate-50">
          <td colSpan={2} />
          <td />
          <td className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
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

// ── Unified Proposal Table ─────────────────────────────────────────────────────

const PROPOSAL_STATUSES: ProposalStatus[] = [
  'Not Accepted',
  'Recommend and Acquire',
  'Like-for-like comparison',
];

function UnifiedProposalTable({
  proposal,
  scenarioId,
}: {
  proposal: Proposal | PlanReviewProposal;
  scenarioId: string;
}) {
  const { dispatch } = useAppContext();
  const entities = getEntityData(proposal, scenarioId);
  const currentStatus: ProposalStatus = proposal.status ?? 'Not Accepted';

  function handleStatusChange(status: ProposalStatus) {
    dispatch({ type: 'SET_PROPOSAL_STATUS', scenarioId, proposalId: proposal.id, status });
  }

  if (entities.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        No entries in this proposal yet.
      </div>
    );
  }

  return (
    <div>
      {/* Sub-header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-gray-50">
        <div className="flex gap-2 text-xs font-semibold text-muted-foreground">
          <span className="w-8">Action</span>
          <span className="w-28">Owner</span>
          <span>Proposal Type</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              {currentStatus} <ChevronDown size={12} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {PROPOSAL_STATUSES.map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => handleStatusChange(s)}
                className={s === currentStatus ? 'font-semibold text-teal-700' : ''}
              >
                {s}
              </DropdownMenuItem>
            ))}
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
          <col className="w-36" />
        </colgroup>
        <tbody>
          {entities.map((ed) => (
            <UnifiedProposalRow
              key={ed.key}
              entityData={ed}
              proposalId={proposal.id}
              scenarioId={scenarioId}
            />
          ))}
        </tbody>
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

  const activeProposal = proposals.find((p) => p.id === activeTab) ?? proposals[0];

  function handleRename(newLabel: string) {
    if (!activeProposal) return;
    dispatch({ type: 'RENAME_PROPOSAL', scenarioId, proposalId: activeProposal.id, label: newLabel });
    setRenameOpen(false);
  }

  function handleDelete() {
    if (!activeProposal) return;
    if (confirm(`Delete proposal "${activeProposal.label}"?`)) {
      dispatch({ type: 'DELETE_PROPOSAL', scenarioId, proposalId: activeProposal.id });
    }
  }

  function handleCopy() {
    if (!activeProposal) return;
    const base = activeProposal.label;
    const existingCopies = proposals.filter((p) =>
      p.label.match(new RegExp(`^Copy of \\d+ ${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))
    ).length;
    const newLabel = `Copy of ${existingCopies + 1} ${base}`;
    dispatch({ type: 'COPY_PROPOSAL', scenarioId, proposalId: activeProposal.id, newLabel });
  }

  function handleAddProposal(entity: EntityOwner) {
    if (entity === 'Joint') {
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
          </div>
        </div>

        <div className="border border-border border-t-0 rounded-b overflow-hidden">
          {proposals.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No proposals have been specified
            </div>
          ) : (
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
                  <UnifiedProposalTable proposal={p} scenarioId={scenarioId} />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </section>

      {activeProposal && (
        <RenameModal
          open={renameOpen}
          currentLabel={activeProposal.label}
          onConfirm={handleRename}
          onClose={() => setRenameOpen(false)}
        />
      )}
    </>
  );
}
