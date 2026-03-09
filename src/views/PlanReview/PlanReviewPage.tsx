import { useReducer, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Settings, AlertTriangle, ChevronDown, X, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useAppContext } from '@/context/AppContext';
import { isPlanReviewProposal } from '@/types/domain';
import type {
  EntityOwner,
  Investment,
  Platform,
  PlanReviewEntry,
  PlanReviewProposal,
  Recommendation,
} from '@/types/domain';
import { formatCurrency } from '@/lib/utils';

// ── Helpers ──────────────────────────────────────────────────────────────────

const REC_LABEL: Record<Recommendation, string> = {
  Hold: 'Hold',
  Close: 'Close / Roll balance out',
  'Roll portion out': 'Roll portion out',
  'Switch/Rebalance': 'Switch / Rebalance',
  'Roll portion in': 'Roll portion in',
  'Roll available balance in': 'Roll available balance in',
};

const ALL_RECOMMENDATIONS: Recommendation[] = [
  'Hold',
  'Close',
  'Roll portion out',
  'Switch/Rebalance',
  'Roll portion in',
  'Roll available balance in',
];

function needsEditView(r: Recommendation) {
  return r !== 'Hold' && r !== 'Close';
}

function computeProposedBalance(entry: EntryState): number {
  if (entry.recommendation === 'Hold') return entry.platform.balance;
  if (entry.recommendation === 'Close') return 0;
  return entry.proposedInvestments.reduce((s, i) => s + i.amount, 0);
}

function copyInvestments(investments: Investment[]): Investment[] {
  return investments.map((i) => ({ ...i }));
}

// ── Asset Allocation ──────────────────────────────────────────────────────────

const ALLOC_MAP: Record<string, string> = {
  'Domestic Equity': 'Dom Eq',
  'International Equity': 'Intl Eq',
  'Domestic Fixed Interest': 'Dom Fxd Int',
  'International Fixed Interest': 'Intl Fxd Int',
  'Fixed Interest': 'Dom Fxd Int',
  'Domestic Cash': 'Dom Cash',
  'International Cash': 'Intl Cash',
  Cash: 'Dom Cash',
  'Domestic Property': 'Dom Prop',
  'International Property': 'Intl Prop',
  Alternative: 'Alt',
};

function computeWeightedAlloc(
  investments: Investment[],
  total: number
): Record<string, number> {
  const raw: Record<string, number> = {};
  for (const inv of investments) {
    for (const [key, pct] of Object.entries(inv.allocation)) {
      if (pct === undefined) continue;
      const displayKey = ALLOC_MAP[key] ?? key;
      raw[displayKey] = (raw[displayKey] ?? 0) + (inv.amount * pct) / 100;
    }
  }
  if (total === 0) return raw;
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, (v / total) * 100]));
}

function allKeys(a: Record<string, number>, b: Record<string, number>): string[] {
  return Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).sort();
}

// ── Page state ────────────────────────────────────────────────────────────────

interface EntryState {
  id: string;
  platform: Platform;
  recommendation: Recommendation;
  proposedInvestments: Investment[];
}

type PageMode = { kind: 'list' } | { kind: 'edit-plan'; platformId: string };

interface AllocMode {
  byAmount: boolean; // true = By $ Amount, false = By Percentage
}

interface PageState {
  entries: EntryState[];
  mode: PageMode;
  toast: string | null;
  snapshot: EntryState[] | null;
  allocMode: AllocMode;
}

type PageAction =
  | { type: 'SET_RECOMMENDATION'; platformId: string; recommendation: Recommendation; unallocated: number }
  | { type: 'ENTER_EDIT'; platformId: string }
  | { type: 'EXIT_EDIT' }
  | { type: 'SET_PROPOSED_AMOUNT'; platformId: string; investmentId: string; amount: number }
  | { type: 'REMOVE_PROPOSED_INVESTMENT'; platformId: string; investmentId: string }
  | { type: 'ADD_TO_PLAN'; platformId: string; amount: number }
  | { type: 'UNDO' }
  | { type: 'DISMISS_TOAST' }
  | { type: 'SET_ALLOC_MODE'; byAmount: boolean };

function pageReducer(state: PageState, action: PageAction): PageState {
  switch (action.type) {
    case 'SET_RECOMMENDATION': {
      const snapshot = state.entries.map((e) => ({ ...e, proposedInvestments: [...e.proposedInvestments] }));
      const entries = state.entries.map((e) => {
        if (e.id !== action.platformId) return e;
        const rec = action.recommendation;
        let proposedInvestments = e.proposedInvestments;
        if (rec === 'Hold') {
          proposedInvestments = copyInvestments(e.platform.investments);
        } else if (rec === 'Close') {
          proposedInvestments = [];
        } else if (rec === 'Roll available balance in') {
          // Distribute unallocated proportionally across existing proposed investments
          const unallocated = action.unallocated;
          const total = proposedInvestments.reduce((s, i) => s + i.amount, 0);
          if (total > 0 && unallocated > 0) {
            proposedInvestments = proposedInvestments.map((inv) => ({
              ...inv,
              amount: inv.amount + (unallocated * inv.amount) / total,
            }));
          }
        }
        return { ...e, recommendation: rec, proposedInvestments };
      });
      const newMode: PageMode =
        needsEditView(action.recommendation) ? { kind: 'edit-plan', platformId: action.platformId } : { kind: 'list' };
      return {
        ...state,
        entries,
        snapshot,
        toast: `Changed recommendation to ${REC_LABEL[action.recommendation]}.${needsEditView(action.recommendation) ? ' Specify proposed amounts.' : ''}`,
        mode: newMode,
      };
    }
    case 'ENTER_EDIT':
      return { ...state, mode: { kind: 'edit-plan', platformId: action.platformId } };
    case 'EXIT_EDIT':
      return { ...state, mode: { kind: 'list' } };
    case 'SET_PROPOSED_AMOUNT': {
      const entries = state.entries.map((e) => {
        if (e.id !== action.platformId) return e;
        return {
          ...e,
          proposedInvestments: e.proposedInvestments.map((inv) =>
            inv.id === action.investmentId ? { ...inv, amount: action.amount } : inv
          ),
        };
      });
      return { ...state, entries };
    }
    case 'REMOVE_PROPOSED_INVESTMENT': {
      const entries = state.entries.map((e) => {
        if (e.id !== action.platformId) return e;
        return {
          ...e,
          proposedInvestments: e.proposedInvestments.filter((inv) => inv.id !== action.investmentId),
        };
      });
      return { ...state, entries };
    }
    case 'ADD_TO_PLAN': {
      const entries = state.entries.map((e) => {
        if (e.id !== action.platformId) return e;
        const total = e.proposedInvestments.reduce((s, i) => s + i.amount, 0);
        if (total === 0) return e;
        return {
          ...e,
          proposedInvestments: e.proposedInvestments.map((inv) => ({
            ...inv,
            amount: inv.amount + (action.amount * inv.amount) / total,
          })),
        };
      });
      return { ...state, entries };
    }
    case 'UNDO':
      if (!state.snapshot) return state;
      return { ...state, entries: state.snapshot, snapshot: null, toast: null, mode: { kind: 'list' } };
    case 'DISMISS_TOAST':
      return { ...state, toast: null };
    case 'SET_ALLOC_MODE':
      return { ...state, allocMode: { byAmount: action.byAmount } };
    default:
      return state;
  }
}

// ── Edit Plan Panel ───────────────────────────────────────────────────────────

interface EditPlanPanelProps {
  entry: EntryState;
  unallocated: number;
  allocMode: AllocMode;
  onSetAmount: (investmentId: string, amount: number) => void;
  onRemove: (investmentId: string) => void;
  onAddToplan: (amount: number) => void;
  onSetAllocMode: (byAmount: boolean) => void;
}

function EditPlanPanel({
  entry,
  unallocated,
  allocMode,
  onSetAmount,
  onRemove,
  onAddToplan,
  onSetAllocMode,
}: EditPlanPanelProps) {
  const proposedTotal = entry.proposedInvestments.reduce((s, i) => s + i.amount, 0);
  const currentTotal = entry.platform.investments.reduce((s, i) => s + i.amount, 0);
  const currentMap = new Map(entry.platform.investments.map((i) => [i.id, i]));

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium text-muted-foreground">Allocate Balance:</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              checked={allocMode.byAmount}
              onChange={() => onSetAllocMode(true)}
              className="accent-teal-700"
            />
            <span className="text-sm">By $ Amount</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              checked={!allocMode.byAmount}
              onChange={() => onSetAllocMode(false)}
              className="accent-teal-700"
            />
            <span className="text-sm">By Percentage</span>
          </label>
        </div>
        <Button size="sm" className="bg-gray-700 hover:bg-gray-800 text-white text-xs">
          Add Investment
        </Button>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-border">
          <tr>
            <th className="w-8" />
            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Name</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">APIR</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Current $</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Proposed $</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Proposed %</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Fees</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Net Balance</th>
          </tr>
        </thead>
        <tbody>
          {entry.proposedInvestments.map((inv) => {
            const currentAmt = currentMap.get(inv.id)?.amount ?? 0;
            const pct = proposedTotal > 0 ? (inv.amount / proposedTotal) * 100 : 0;
            const fees = ((inv.investCosts ?? 0) * inv.amount) / 100;
            return (
              <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-slate-50">
                <td className="pl-2 py-2">
                  <button
                    onClick={() => onRemove(inv.id)}
                    className="text-muted-foreground hover:text-red-500"
                  >
                    <X size={13} />
                  </button>
                </td>
                <td className="px-3 py-2">
                  <span className="text-blue-600 cursor-pointer hover:underline text-xs">{inv.name}</span>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{inv.apirCode}</td>
                <td className="px-3 py-2 text-right text-xs">{formatCurrency(currentAmt)}</td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    className="border border-border rounded px-2 py-0.5 text-xs text-right w-28 focus:outline-none focus:ring-1 focus:ring-teal-600"
                    value={inv.amount}
                    onChange={(e) => onSetAmount(inv.id, parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="px-3 py-2 text-right text-xs">{pct.toFixed(2)}%</td>
                <td className="px-3 py-2 text-right text-xs">{formatCurrency(fees)}</td>
                <td className="px-3 py-2 text-right text-xs">{formatCurrency(inv.amount - fees)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-border font-medium">
            <td colSpan={3} className="px-3 py-2 text-xs text-right text-muted-foreground">Total</td>
            <td className="px-3 py-2 text-right text-xs">{formatCurrency(currentTotal)}</td>
            <td className="px-3 py-2 text-right text-xs">{formatCurrency(proposedTotal)}</td>
            <td className="px-3 py-2 text-right text-xs">100.00%</td>
            <td />
            <td className="px-3 py-2 text-right text-xs">{formatCurrency(proposedTotal)}</td>
          </tr>
          <tr className="border-t border-border text-muted-foreground">
            <td colSpan={3} className="px-3 py-1 text-xs text-right">Transactional costs</td>
            <td className="px-3 py-1 text-right text-xs">$0.00</td>
            <td className="px-3 py-1 text-right text-xs">$0.00</td>
            <td colSpan={3} />
          </tr>
          <tr className="border-t border-border">
            <td colSpan={3} className="px-3 py-1 text-xs font-semibold text-right">Available to invest</td>
            <td className="px-3 py-1 text-right text-xs font-semibold">{formatCurrency(currentTotal)}</td>
            <td className="px-3 py-1 text-right text-xs font-semibold flex items-center justify-end gap-1">
              {formatCurrency(proposedTotal)}
              {proposedTotal < currentTotal && (
                <AlertTriangle size={12} className="text-amber-500 shrink-0" />
              )}
            </td>
            <td colSpan={3} />
          </tr>
          <tr className="border-t border-border text-muted-foreground">
            <td colSpan={3} className="px-3 py-1 text-xs text-right">
              <button className="text-blue-600 hover:underline">Transfer fees</button>
            </td>
            <td />
            <td className="px-3 py-1 text-right text-xs">$0.00</td>
            <td colSpan={3} />
          </tr>
        </tfoot>
      </table>

      {/* Unallocated amount bar */}
      {unallocated > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 border-t border-blue-200">
          <TriangleAlert size={14} className="text-amber-500 shrink-0" />
          <span className="text-xs font-semibold">
            {formatCurrency(unallocated)} Unallocated
          </span>
          <Button
            size="sm"
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-6"
            onClick={() => onAddToplan(unallocated)}
          >
            Add to plan
          </Button>
          <input
            type="number"
            readOnly
            value={unallocated.toFixed(2)}
            className="border border-border rounded px-2 py-0.5 text-xs w-28 text-right bg-white"
          />
          <input
            type="text"
            readOnly
            value="100.00%"
            className="border border-border rounded px-2 py-0.5 text-xs w-16 text-right bg-white"
          />
        </div>
      )}
    </div>
  );
}

// ── Asset Allocation Table ────────────────────────────────────────────────────

function AssetAllocationTable({ entries }: { entries: EntryState[] }) {
  const allInvExisting = entries.flatMap((e) => e.platform.investments);
  const allInvProposed = entries.flatMap((e) => e.proposedInvestments);
  const existingTotal = allInvExisting.reduce((s, i) => s + i.amount, 0);
  const proposedTotal = allInvProposed.reduce((s, i) => s + i.amount, 0);

  const existingAlloc = computeWeightedAlloc(allInvExisting, existingTotal);
  const proposedAlloc = computeWeightedAlloc(allInvProposed, proposedTotal);
  const keys = allKeys(existingAlloc, proposedAlloc);

  if (keys.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="px-2 py-1.5 text-left text-muted-foreground font-medium w-40" />
            {keys.map((k) => (
              <th key={k} className="px-2 py-1.5 text-right text-muted-foreground font-medium">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="px-2 py-1.5 font-medium">Existing</td>
            {keys.map((k) => (
              <td key={k} className="px-2 py-1.5 text-right">
                {((existingAlloc[k] ?? 0)).toFixed(2)}%
              </td>
            ))}
          </tr>
          <tr className="border-b border-border">
            <td className="px-2 py-1.5 font-medium">Proposed</td>
            {keys.map((k) => (
              <td key={k} className="px-2 py-1.5 text-right">
                {((proposedAlloc[k] ?? 0)).toFixed(2)}%
              </td>
            ))}
          </tr>
          <tr>
            <td className="px-2 py-1.5 font-medium">Variance</td>
            {keys.map((k) => {
              const variance = (proposedAlloc[k] ?? 0) - (existingAlloc[k] ?? 0);
              return (
                <td
                  key={k}
                  className={`px-2 py-1.5 text-right ${
                    Math.abs(variance) > 0.01
                      ? variance > 0
                        ? 'text-blue-700'
                        : 'text-red-600'
                      : ''
                  }`}
                >
                  {variance.toFixed(2)}%
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function PlanReviewPage() {
  const { scenarioId, proposalId } = useParams<{ scenarioId: string; proposalId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();

  const entity = (searchParams.get('entity') ?? 'Client') as EntityOwner;
  const labelParam = searchParams.get('label');

  const scenario = state.clientFile.scenarios.find((s) => s.id === scenarioId);

  // Build initial entries from existing proposal (edit) or entity platforms (new)
  function buildInitialEntries(): EntryState[] {
    if (proposalId && scenario) {
      const existing = scenario.proposals.find((p) => p.id === proposalId);
      if (existing && isPlanReviewProposal(existing)) {
        // Multi-entity: find this entity's portion
        if (existing.entityReviews) {
          const er = existing.entityReviews.find((r) => r.owner === entity);
          if (er) {
            return er.entries.map((e) => ({
              id: e.id,
              platform: e.platform,
              recommendation: e.recommendation,
              proposedInvestments: copyInvestments(e.proposedInvestments),
            }));
          }
        }
        // Single-entity
        return existing.entries.map((e) => ({
          id: e.id,
          platform: e.platform,
          recommendation: e.recommendation,
          proposedInvestments: copyInvestments(e.proposedInvestments),
        }));
      }
    }
    const entityData = scenario?.entities.find((e) => e.owner === entity);
    return (entityData?.platforms ?? []).map((p) => ({
      id: p.id,
      platform: p,
      recommendation: 'Hold' as Recommendation,
      proposedInvestments: copyInvestments(p.investments),
    }));
  }

  const [pageState, pageDispatch] = useReducer(pageReducer, undefined, () => ({
    entries: buildInitialEntries(),
    mode: { kind: 'list' } as PageMode,
    toast: null,
    snapshot: null,
    allocMode: { byAmount: true },
  }));

  // Recompute entries when scenario loads (async context)
  useEffect(() => {
    // Only runs once on mount; entries already built above
  }, []);

  if (!scenario) {
    return <div className="p-6 text-muted-foreground">Scenario not found.</div>;
  }

  // Derived values
  const unallocatedAmount = pageState.entries
    .filter((e) => e.recommendation === 'Close')
    .reduce((s, e) => s + e.platform.balance, 0);

  const currentTotal = pageState.entries.reduce((s, e) => s + e.platform.balance, 0);
  const proposedTotal = pageState.entries.reduce((s, e) => s + computeProposedBalance(e), 0);

  const editingPlatformId = pageState.mode.kind === 'edit-plan' ? pageState.mode.platformId : null;
  const editingEntry = editingPlatformId
    ? pageState.entries.find((e) => e.id === editingPlatformId)
    : undefined;

  function handleSave() {
    const existingProposal = proposalId
      ? scenario!.proposals.find((p) => p.id === proposalId)
      : undefined;

    const updatedEntries = pageState.entries.map((e) => ({
      id: e.id,
      platform: e.platform,
      recommendation: e.recommendation,
      proposedInvestments: e.proposedInvestments,
      proposedBalance: computeProposedBalance(e),
    }));

    // Multi-entity: update just this entity's portion
    if (existingProposal && isPlanReviewProposal(existingProposal) && existingProposal.entityReviews) {
      dispatch({
        type: 'UPDATE_ENTITY_PLAN_REVIEW',
        scenarioId: scenarioId!,
        proposalId: existingProposal.id,
        entityOwner: entity,
        entries: updatedEntries,
      });
      navigate(`/scenarios/${scenarioId}`);
      return;
    }

    const label =
      (existingProposal ? existingProposal.label : null) ??
      labelParam ??
      `Proposal ${(scenario!.proposals.length + 1)} (${entity})`;

    const proposal: PlanReviewProposal = {
      id: existingProposal?.id ?? `pr-${Date.now()}`,
      label,
      kind: 'plan-review',
      owner: entity,
      entries: updatedEntries,
    };

    if (existingProposal) {
      dispatch({ type: 'UPDATE_PLAN_REVIEW_PROPOSAL', scenarioId: scenarioId!, proposal });
    } else {
      dispatch({ type: 'ADD_PROPOSAL_ANY', scenarioId: scenarioId!, proposal });
    }
    navigate(`/scenarios/${scenarioId}`);
  }

  const isEditMode = pageState.mode.kind === 'edit-plan';

  const sectionTitle = isEditMode && editingEntry
    ? `Plan Review : Edit Plan : ${editingEntry.platform.name} (${editingEntry.platform.accountNumber})`
    : 'Plan Review';

  return (
    <div className="p-6">
      {/* Toast notification */}
      {pageState.toast && (
        <div className="flex items-center justify-between mb-4 px-4 py-2 bg-green-50 border border-green-300 rounded text-sm">
          <div className="flex items-center gap-2">
            <TriangleAlert size={14} className="text-green-600" />
            <span>{pageState.toast}</span>
            <button
              className="text-blue-600 hover:underline font-medium ml-2"
              onClick={() => pageDispatch({ type: 'UNDO' })}
            >
              Undo
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold border border-border rounded px-2 py-0.5">
              CURRENT DATA
            </span>
            <Button variant="outline" size="sm" onClick={() => navigate(`/scenarios/${scenarioId}`)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Top bar (when no toast) */}
      {!pageState.toast && (
        <div className="flex items-center justify-end gap-3 mb-4">
          <span className="text-xs font-semibold border border-border rounded px-2 py-0.5">
            CURRENT DATA
          </span>
          <Button variant="outline" size="sm" onClick={() => navigate(`/scenarios/${scenarioId}`)}>
            Cancel
          </Button>
          <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white" onClick={handleSave}>
            Save
          </Button>
        </div>
      )}

      {/* Section */}
      <section>
        <div className="flex items-center justify-between px-4 py-2 bg-teal-700 text-white rounded-t">
          <span className="text-sm font-semibold flex items-center gap-2">
            {sectionTitle}
          </span>
          <Settings size={14} />
        </div>

        <div className="border border-border border-t-0 rounded-b overflow-hidden">
          {isEditMode && editingEntry ? (
            /* ── Edit Plan Sub-view ── */
            <>
              {/* Tabs row */}
              <div className="flex items-center border-b border-border bg-gray-50 text-xs">
                {['Investment Funds', 'Pension Details', 'Contribution Amounts', 'Balances/Aggregation', 'Research Notes', 'Fee Research'].map(
                  (tab, i) => (
                    <button
                      key={tab}
                      className={`px-4 py-2 border-b-2 ${
                        i === 0
                          ? 'border-teal-700 text-teal-700 font-medium'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab}
                    </button>
                  )
                )}
                <button
                  className="ml-auto px-4 py-2 text-xs text-blue-600 hover:underline"
                  onClick={() => pageDispatch({ type: 'EXIT_EDIT' })}
                >
                  ← Back to Plan List
                </button>
              </div>
              <EditPlanPanel
                entry={editingEntry}
                unallocated={unallocatedAmount}
                allocMode={pageState.allocMode}
                onSetAmount={(investmentId, amount) =>
                  pageDispatch({
                    type: 'SET_PROPOSED_AMOUNT',
                    platformId: editingEntry.id,
                    investmentId,
                    amount,
                  })
                }
                onRemove={(investmentId) =>
                  pageDispatch({
                    type: 'REMOVE_PROPOSED_INVESTMENT',
                    platformId: editingEntry.id,
                    investmentId,
                  })
                }
                onAddToplan={(amount) =>
                  pageDispatch({ type: 'ADD_TO_PLAN', platformId: editingEntry.id, amount })
                }
                onSetAllocMode={(byAmount) =>
                  pageDispatch({ type: 'SET_ALLOC_MODE', byAmount })
                }
              />
            </>
          ) : (
            /* ── Main Plan List ── */
            <>
              <div className="flex justify-end p-2 border-b border-border bg-gray-50">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="bg-gray-700 hover:bg-gray-800 text-white text-xs">
                      Add Proposed Plan <ChevronDown size={12} className="ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled>Super Plan</DropdownMenuItem>
                    <DropdownMenuItem disabled>Pension Plan</DropdownMenuItem>
                    <DropdownMenuItem disabled>Investment Platform</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="w-8" />
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Plan Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Plan Type
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Recommendation
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">
                      Current Balance
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">
                      Proposed Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageState.entries.map((entry) => {
                    const proposed = computeProposedBalance(entry);
                    return (
                      <tr
                        key={entry.id}
                        className="border-b border-border last:border-0 hover:bg-slate-50"
                      >
                        <td className="pl-2 py-2">
                          {needsEditView(entry.recommendation) && (
                            <button
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                pageDispatch({ type: 'ENTER_EDIT', platformId: entry.id })
                              }
                            >
                              <ChevronDown size={13} />
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {needsEditView(entry.recommendation) ? (
                            <button
                              className="text-blue-600 hover:underline text-sm text-left"
                              onClick={() =>
                                pageDispatch({ type: 'ENTER_EDIT', platformId: entry.id })
                              }
                            >
                              {entry.platform.name} ({entry.platform.accountNumber})
                            </button>
                          ) : (
                            <span className="text-sm">
                              {entry.platform.name} ({entry.platform.accountNumber})
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm">{entry.platform.type}</td>
                        <td className="px-3 py-2">
                          <div className="relative">
                            <select
                              className="appearance-none border border-border rounded px-2 py-1 pr-7 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 w-52"
                              value={entry.recommendation}
                              onChange={(e) =>
                                pageDispatch({
                                  type: 'SET_RECOMMENDATION',
                                  platformId: entry.id,
                                  recommendation: e.target.value as Recommendation,
                                  unallocated: unallocatedAmount,
                                })
                              }
                            >
                              {ALL_RECOMMENDATIONS.map((r) => (
                                <option key={r} value={r}>
                                  {REC_LABEL[r]}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={12}
                              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right text-sm">
                          {formatCurrency(entry.platform.balance)}
                        </td>
                        <td className="px-3 py-2 text-right text-sm flex items-center justify-end gap-1">
                          {formatCurrency(proposed)}
                          {entry.platform.hasWarning && entry.recommendation === 'Hold' && (
                            <AlertTriangle size={13} className="text-amber-500" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border text-muted-foreground">
                    <td colSpan={4} className="px-3 py-1.5 text-xs text-right">
                      <button className="text-blue-600 hover:underline">Transfer fees</button>
                    </td>
                    <td className="px-3 py-1.5 text-right text-xs">$0.00</td>
                    <td className="px-3 py-1.5 text-right text-xs flex items-center justify-end gap-1">
                      $0.00
                      <button className="text-muted-foreground hover:text-foreground">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      </button>
                    </td>
                  </tr>
                  {unallocatedAmount > 0 && (
                    <tr className="border-t border-border">
                      <td colSpan={4} className="px-3 py-1.5 text-xs text-right text-muted-foreground">
                        <span className="flex items-center justify-end gap-1">
                          Unallocated amount
                          <AlertTriangle size={12} className="text-amber-500" />
                        </span>
                      </td>
                      <td />
                      <td className="px-3 py-1.5 text-right text-xs font-medium text-amber-700">
                        {formatCurrency(unallocatedAmount)}
                      </td>
                    </tr>
                  )}
                  <tr className="border-t border-border font-semibold">
                    <td colSpan={3} className="px-3 py-2 text-right text-sm">Total</td>
                    <td />
                    <td className="px-3 py-2 text-right text-sm">{formatCurrency(currentTotal)}</td>
                    <td className="px-3 py-2 text-right text-sm">
                      {formatCurrency(proposedTotal + unallocatedAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Asset Allocation Section */}
              <div className="border-t border-border">
                <div className="flex border-b border-border bg-gray-50">
                  {['Asset Allocation', 'Performance History', 'Fee Comparison'].map((tab, i) => (
                    <button
                      key={tab}
                      className={`px-4 py-2 text-xs border-b-2 ${
                        i === 0
                          ? 'border-teal-700 text-teal-700 font-medium'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="p-4">
                  <AssetAllocationTable entries={pageState.entries} />
                  <p className="text-xs text-muted-foreground mt-3">
                    Asset allocation is based on the proposed investment holdings.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
