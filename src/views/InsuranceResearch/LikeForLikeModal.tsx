import { useState, useCallback } from 'react';
import { X, Loader2, Check, ChevronDown, ChevronRight, Link2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReviewItem } from './ScenarioReviewPage';
import type { ResearchPortfolio, ExistingPolicy, ExistingCoverType } from './insuranceData';
import { PREMIUM_FREQUENCY_LABELS, PREMIUM_FREQUENCY_MULTIPLIER, COVER_TYPE_LABELS } from './insuranceData';
import type { PremiumFrequency } from './insuranceData';
import { MapProductModal } from './MapProductModal';
import { postSimilaritiesAndDifferences } from '@/services/omnilifeApi';
import type { DifferenceFeature, SimilaritiesAndDifferencesEntry } from '@/services/omnilifeApi';

// ── Types ───────────────────────────────────────────────────────────────────

type ModalTab = 'details' | 'compare';

export interface ExistingProductState {
  existingItemId: string;
  premSuperEdit: string;
  premNonSuperEdit: string;
  superFreq: PremiumFrequency;
  nonSuperFreq: PremiumFrequency;
  linkedPortfolio?: ResearchPortfolio;
}

export interface LikeForLikeState {
  selectedExistingIds: string[];
  existingStates: Record<string, ExistingProductState>;
  checkedDifferences?: string[];
}

// ── Props ───────────────────────────────────────────────────────────────────

interface Props {
  recommendedItem: ReviewItem;
  existingItems: ReviewItem[];
  clientName: string;
  partnerName: string | null;
  initialState?: LikeForLikeState;
  onClose: () => void;
  onSave: (state: LikeForLikeState) => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 });
}

const FREQ_SHORT: Record<PremiumFrequency, string> = {
  Y: '/year', H: '/half-year', Q: '/quarter', M: '/month', F: '/fortnight', W: '/week',
};

function buildPolicyFromRecommended(rec: ReviewItem, state: ExistingProductState): ExistingPolicy {
  const labelToType: Record<string, ExistingCoverType> = {
    'Life': 'Life', 'TPD': 'TPD', 'Trauma': 'Trauma',
    'Income Protection': 'IP', 'Business Expense': 'BE', 'Child Cover': 'ChildCover',
  };
  return {
    id: `l4l-${state.existingItemId}`,
    provider: rec.insurer,
    policyDescription: rec.label,
    lifeInsured: rec.lifeInsured,
    premiumSuper: parseFloat(state.premSuperEdit) || 0,
    stampDutySuper: 0,
    superFrequency: state.superFreq,
    premiumNonSuper: parseFloat(state.premNonSuperEdit) || 0,
    stampDutyNonSuper: 0,
    nonSuperFrequency: state.nonSuperFreq,
    covers: rec.covers.map((c) => ({
      id: crypto.randomUUID(),
      coverType: labelToType[c.type] ?? (c.type as ExistingCoverType),
      sumInsured: c.sumInsured,
      premiumStyle: '',
      definition: c.definition,
      super: c.isSuper ? 'Yes' : 'No',
      waitingPeriod: c.waitingPeriod,
      benefitPeriod: c.benefitPeriod,
    })),
    action: 'Review',
    researchPortfolio: state.linkedPortfolio,
  };
}

// ── Existing Product Details Panel ──────────────────────────────────────────

function ExistingProductDetailsPanel({
  existingItem,
  recItem,
  state,
  onStateChange,
  onOpenLink,
  clientName,
  partnerName,
}: {
  existingItem: ReviewItem;
  recItem: ReviewItem;
  state: ExistingProductState;
  onStateChange: (s: ExistingProductState) => void;
  onOpenLink: () => void;
  clientName: string;
  partnerName: string | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const lifeInsuredName = recItem.lifeInsured === 'client' ? clientName : (partnerName ?? 'Partner');

  return (
    <div className="border border-teal-300 rounded-lg bg-teal-50/30 mb-3 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs hover:bg-teal-50"
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {existingItem.insurerLogo && <img src={existingItem.insurerLogo} alt="" className="w-6 h-6 object-contain" />}
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-slate-800">{existingItem.label}</span>
          <span className="text-slate-500 ml-2">{existingItem.insurer}</span>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">
          {fmt(existingItem.premiumPa)} p.a.
        </span>
      </button>

      {expanded && (
        <div className="border-t border-teal-200 px-4 py-3 space-y-3">
          {/* Premium editing */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 italic w-[130px]">Premium (Super):</label>
              <input
                type="number"
                step="0.01"
                className="w-24 border border-gray-200 rounded px-2 py-1 text-xs text-right"
                value={state.premSuperEdit}
                onChange={(e) => onStateChange({ ...state, premSuperEdit: e.target.value })}
              />
              <select
                className="border border-gray-200 rounded px-1.5 py-1 text-xs"
                value={state.superFreq}
                onChange={(e) => onStateChange({ ...state, superFreq: e.target.value as PremiumFrequency })}
              >
                {Object.entries(PREMIUM_FREQUENCY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 italic w-[130px]">Premium (Non-super):</label>
              <input
                type="number"
                step="0.01"
                className="w-24 border border-gray-200 rounded px-2 py-1 text-xs text-right"
                value={state.premNonSuperEdit}
                onChange={(e) => onStateChange({ ...state, premNonSuperEdit: e.target.value })}
              />
              <select
                className="border border-gray-200 rounded px-1.5 py-1 text-xs"
                value={state.nonSuperFreq}
                onChange={(e) => onStateChange({ ...state, nonSuperFreq: e.target.value as PremiumFrequency })}
              >
                {Object.entries(PREMIUM_FREQUENCY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 font-semibold w-[130px]">Total Premium:</label>
            <span className="text-xs font-semibold text-slate-800">
              {fmt(
                (parseFloat(state.premSuperEdit) || 0) * PREMIUM_FREQUENCY_MULTIPLIER[state.superFreq] +
                (parseFloat(state.premNonSuperEdit) || 0) * PREMIUM_FREQUENCY_MULTIPLIER[state.nonSuperFreq]
              )} /year
            </span>
          </div>

          {/* Cover Details (view-only, from recommended) */}
          <div className="border-t border-gray-200 pt-3">
            <div className="text-xs font-semibold text-slate-600 mb-2 underline">Cover Details</div>
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-1 text-left text-slate-600 font-semibold">Type</th>
                  <th className="py-1 text-left text-slate-600 font-semibold">Details</th>
                  <th className="py-1 text-left text-slate-600 font-semibold">Owner</th>
                  <th className="py-1 text-right text-slate-600 font-semibold">Benefit Amount</th>
                  <th className="py-1 text-center text-slate-600 font-semibold w-12">Super</th>
                  <th className="py-1 text-left text-slate-600 font-semibold">Life Insured</th>
                </tr>
              </thead>
              <tbody>
                {recItem.covers.map((c, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-1 text-slate-700">{c.type}</td>
                    <td className="py-1 text-slate-600">
                      {[c.premiumStructure, c.coverStructure, c.definition].filter(Boolean).join(' / ') || c.type}
                    </td>
                    <td className="py-1 text-slate-600">{c.owner || lifeInsuredName}</td>
                    <td className="py-1 text-right text-slate-800 font-medium">
                      {c.sumInsured ? `$${parseFloat(c.sumInsured.replace(/[^0-9.]/g, '') || '0').toLocaleString('en-AU')}` : ''}
                    </td>
                    <td className="py-1 text-center">
                      <input type="checkbox" checked={c.isSuper} disabled className="rounded border-gray-300 text-teal-600 h-3 w-3 cursor-default" />
                    </td>
                    <td className="py-1 text-slate-600">{lifeInsuredName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Link button */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onOpenLink}
              className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
            >
              <Link2 size={12} />
              {state.linkedPortfolio ? 'Change Linked Products' : 'Link Products'}
            </button>
            {state.linkedPortfolio && (
              <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                <CheckCircle2 size={10} /> Linked
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Compare Tab Content ─────────────────────────────────────────────────────

function CompareTabContent({
  recommendedItem,
  linkedEntries,
  existingItems,
  checkedDiffs,
  onToggleDiff,
  onToggleAllDiffs,
}: {
  recommendedItem: ReviewItem;
  linkedEntries: { existingItem: ReviewItem; portfolio: ResearchPortfolio }[];
  existingItems: ReviewItem[];
  checkedDiffs: Set<string>;
  onToggleDiff: (code: string) => void;
  onToggleAllDiffs: (checked: boolean) => void;
}) {
  const [differences, setDifferences] = useState<DifferenceFeature[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const handleCompare = useCallback(async () => {
    if (linkedEntries.length === 0) return;

    const entries: SimilaritiesAndDifferencesEntry[] = [
      {
        supplierCode: recommendedItem.supplierCode,
        revisionDate: recommendedItem.revisionDate,
        products: recommendedItem.productCodes,
      },
      ...linkedEntries.map((le) => {
        const products: Record<string, string> = {};
        for (const [code, val] of Object.entries(le.portfolio.products)) {
          if (val?.productCode) products[code] = val.productCode;
        }
        return {
          supplierCode: le.portfolio.supplierCode,
          revisionDate: le.portfolio.revisionDate,
          products,
        };
      }),
    ];

    setLoading(true);
    setError(null);

    try {
      const result = await postSimilaritiesAndDifferences(entries);
      setDifferences(result.differences);
      setHasFetched(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load comparison';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [recommendedItem, linkedEntries]);

  if (linkedEntries.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-xs text-slate-400">
        No linked products to compare. Go to the Details tab and link at least one existing product.
      </div>
    );
  }

  const allChecked = differences ? differences.every((d) => checkedDiffs.has(d.code)) : false;

  // Group differences by coverType
  const groupedDiffs: { coverType: string; features: DifferenceFeature[] }[] = [];
  if (differences) {
    const groupMap = new Map<string, DifferenceFeature[]>();
    for (const d of differences) {
      const key = d.coverType || 'General';
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(d);
    }
    for (const [coverType, features] of groupMap) {
      groupedDiffs.push({ coverType, features });
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Compare button */}
      {!hasFetched && !loading && (
        <div className="px-5 py-6 text-center">
          <p className="text-xs text-slate-500 mb-3">
            {linkedEntries.length} product{linkedEntries.length > 1 ? 's' : ''} linked and ready to compare.
          </p>
          <Button
            size="sm"
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs"
            onClick={handleCompare}
          >
            Load Comparison
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-12 justify-center text-xs text-slate-400">
          <Loader2 size={14} className="animate-spin" />
          Loading comparison…
        </div>
      )}
      {error && <p className="text-xs text-red-500 text-center py-6">{error}</p>}

      {differences && (
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-white z-10">
            {/* Column headers: logos */}
            <tr className="border-b border-gray-100">
              <th className="px-3 py-2 text-left" />
              <th className="px-3 py-2 text-center text-[10px] text-slate-500 uppercase tracking-wide font-semibold">
                Recommended
              </th>
              {linkedEntries.map((le, i) => (
                <th key={i} className="px-3 py-2 text-center text-[10px] text-slate-500 uppercase tracking-wide font-semibold">
                  Like for Like
                </th>
              ))}
            </tr>
            <tr className="border-b border-gray-100">
              <th className="px-3 py-2 text-left" />
              <th className="px-3 py-3 text-center">
                {recommendedItem.insurerLogo && (
                  <img src={recommendedItem.insurerLogo} alt="" className="w-12 h-12 object-contain mx-auto mb-1" />
                )}
                <div className="text-xs font-semibold text-slate-800">{recommendedItem.insurer}</div>
              </th>
              {linkedEntries.map((le, i) => (
                <th key={i} className="px-3 py-3 text-center">
                  {le.existingItem.insurerLogo && (
                    <img src={le.existingItem.insurerLogo} alt="" className="w-12 h-12 object-contain mx-auto mb-1" />
                  )}
                  <div className="text-xs font-semibold text-slate-800">{le.existingItem.insurer}</div>
                </th>
              ))}
            </tr>
            {/* Include in report row */}
            <tr className="border-b border-gray-200 bg-slate-50">
              <th className="px-3 py-2 text-left">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={() => onToggleAllDiffs(!allChecked)}
                    className="rounded border-gray-300 text-teal-600 h-3.5 w-3.5"
                  />
                  <span className="text-[10px] text-slate-600 font-medium">Differences to be included in Report</span>
                </label>
              </th>
              <th className="px-3 py-2 text-center text-[10px] text-slate-500 font-medium">{recommendedItem.label}</th>
              {linkedEntries.map((le, i) => (
                <th key={i} className="px-3 py-2 text-center text-[10px] text-slate-500 font-medium">
                  {le.existingItem.label}
                </th>
              ))}
            </tr>
            {/* Cover details row */}
            <tr className="border-b border-gray-200 bg-gray-50">
              <td className="px-3 py-2 text-[10px] text-slate-700 font-medium">
                {recommendedItem.covers.map((c) => {
                  const amt = c.sumInsured ? parseFloat(c.sumInsured.replace(/[^0-9.]/g, '') || '0') : 0;
                  return `${c.type} ${amt > 0 ? `$${amt.toLocaleString('en-AU')}` : ''} ${c.premiumStructure || ''}`.trim();
                }).join('\n').split('\n').map((line, i) => <div key={i}>{line}</div>)}
              </td>
              <td className="px-3 py-2 text-center text-[10px] text-slate-600 font-medium">
                {recommendedItem.label}
              </td>
              {linkedEntries.map((le, i) => (
                <td key={i} className="px-3 py-2 text-center text-[10px] text-slate-600 font-medium">
                  {le.existingItem.label}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupedDiffs.map((group) => (
              <GroupSection
                key={group.coverType}
                coverType={group.coverType}
                features={group.features}
                linkedCount={linkedEntries.length}
                checkedDiffs={checkedDiffs}
                onToggleDiff={onToggleDiff}
              />
            ))}
            {differences.length === 0 && (
              <tr>
                <td colSpan={2 + linkedEntries.length} className="px-3 py-8 text-center text-slate-400">
                  No differences found between these products.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Feature Group Section ───────────────────────────────────────────────────

const COVER_TYPE_DISPLAY: Record<string, string> = {
  TRM: 'Life', TPD: 'TPD', TPE: 'TPD', TPS: 'TPD', TPR: 'TPD',
  TRE: 'Trauma', TRS: 'Trauma', TRA: 'Trauma',
  INC: 'Income Protection', BUS: 'Business Expense',
  ALL: 'All Cover Types', General: 'General',
};

function GroupSection({
  coverType,
  features,
  linkedCount,
  checkedDiffs,
  onToggleDiff,
}: {
  coverType: string;
  features: DifferenceFeature[];
  linkedCount: number;
  checkedDiffs: Set<string>;
  onToggleDiff: (code: string) => void;
}) {
  // Group features by their name prefix (e.g. "Exclusions for Life Cover", "Indexation Benefit")
  const featureGroups: { groupName: string; items: DifferenceFeature[] }[] = [];
  const groupMap = new Map<string, DifferenceFeature[]>();

  for (const f of features) {
    const parts = f.name.split(' - ');
    const groupName = parts.length > 1 ? parts[0].trim() : (COVER_TYPE_DISPLAY[coverType] ?? coverType);
    if (!groupMap.has(groupName)) groupMap.set(groupName, []);
    groupMap.get(groupName)!.push(f);
  }
  for (const [groupName, items] of groupMap) {
    featureGroups.push({ groupName, items });
  }

  const label = COVER_TYPE_DISPLAY[coverType] ?? coverType;

  return (
    <>
      {/* Cover type header */}
      <tr className="bg-[#2c3e6b]">
        <td colSpan={2 + linkedCount} className="px-3 py-1.5 text-xs font-semibold text-white">
          {label} ({features.length} features)
        </td>
      </tr>
      {features.map((d) => {
        const isChecked = checkedDiffs.has(d.code);
        return (
          <tr key={d.code} className="border-b border-gray-100 hover:bg-slate-50/50">
            <td className="px-3 py-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleDiff(d.code)}
                  className="rounded border-gray-300 text-teal-600 h-3.5 w-3.5"
                />
                <span className="text-slate-700">{d.name}</span>
              </label>
            </td>
            <td className="px-3 py-1.5 text-center">
              {d.featureIncluded.some((p) => p.endsWith('P0'))
                ? <CheckCircle2 size={14} className="inline text-emerald-500" />
                : <XCircle size={14} className="inline text-red-400" />}
            </td>
            {Array.from({ length: linkedCount }, (_, i) => {
              const suffix = `P${i + 1}`;
              const included = d.featureIncluded.some((p) => p.endsWith(suffix));
              return (
                <td key={i} className={`px-3 py-1.5 text-center ${included ? 'bg-emerald-50/40' : 'bg-red-50/40'}`}>
                  {included
                    ? <CheckCircle2 size={14} className="inline text-emerald-500" />
                    : <XCircle size={14} className="inline text-red-400" />}
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function LikeForLikeModal({
  recommendedItem,
  existingItems,
  clientName,
  partnerName,
  initialState,
  onClose,
  onSave,
}: Props) {
  const [activeTab, setActiveTab] = useState<ModalTab>('details');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() =>
    initialState ? new Set(initialState.selectedExistingIds) : new Set()
  );
  const [existingStates, setExistingStates] = useState<Record<string, ExistingProductState>>(() =>
    initialState?.existingStates ?? {}
  );
  const [checkedDiffs, setCheckedDiffs] = useState<Set<string>>(() =>
    initialState?.checkedDifferences ? new Set(initialState.checkedDifferences) : new Set()
  );
  const [linkTarget, setLinkTarget] = useState<{ existingItemId: string } | null>(null);

  function buildState(): LikeForLikeState {
    return {
      selectedExistingIds: Array.from(selectedIds),
      existingStates,
      checkedDifferences: Array.from(checkedDiffs),
    };
  }

  function toggleExisting(item: ReviewItem) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
        if (!existingStates[item.id]) {
          setExistingStates((prev) => ({
            ...prev,
            [item.id]: {
              existingItemId: item.id,
              premSuperEdit: '',
              premNonSuperEdit: '',
              superFreq: recommendedItem.superFrequencyCode,
              nonSuperFreq: recommendedItem.nonSuperFrequencyCode,
            },
          }));
        }
      }
      return next;
    });
  }

  function handleExistingStateChange(existingItemId: string, state: ExistingProductState) {
    setExistingStates((prev) => ({ ...prev, [existingItemId]: state }));
  }

  function handleLinkSave(portfolio: ResearchPortfolio) {
    if (!linkTarget) return;
    setExistingStates((prev) => ({
      ...prev,
      [linkTarget.existingItemId]: {
        ...prev[linkTarget.existingItemId],
        linkedPortfolio: portfolio,
      },
    }));
    setLinkTarget(null);
  }

  function handleToggleDiff(code: string) {
    setCheckedDiffs((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function handleToggleAllDiffs(checked: boolean) {
    if (checked) {
      setCheckedDiffs(new Set());
    } else {
      setCheckedDiffs(new Set());
    }
  }

  const linkedEntries: { existingItem: ReviewItem; portfolio: ResearchPortfolio }[] = [];
  for (const id of selectedIds) {
    const item = existingItems.find((i) => i.id === id);
    const state = existingStates[id];
    if (item && state?.linkedPortfolio) {
      linkedEntries.push({ existingItem: item, portfolio: state.linkedPortfolio });
    }
  }

  const linkPolicy = linkTarget
    ? buildPolicyFromRecommended(recommendedItem, existingStates[linkTarget.existingItemId])
    : null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-xl w-[1100px] max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-[#3b5998]">
            <h2 className="text-sm font-bold text-white">
              Like for Like: {recommendedItem.insurer} — {recommendedItem.label}
            </h2>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X size={16} />
            </button>
          </div>

          {/* Top-level tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-2.5 text-xs font-semibold transition-colors ${
                activeTab === 'details'
                  ? 'text-teal-700 border-b-2 border-teal-700 bg-teal-50/30'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-6 py-2.5 text-xs font-semibold transition-colors ${
                activeTab === 'compare'
                  ? 'text-teal-700 border-b-2 border-teal-700 bg-teal-50/30'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              Compare
            </button>
          </div>

          {/* Tab content */}
          {activeTab === 'details' && (
            <div className="flex-1 overflow-auto">
              {/* Recommended product summary */}
              <div className="px-5 py-3 border-b border-gray-200 bg-slate-50">
                <div className="flex items-center gap-3 mb-2">
                  <input type="checkbox" checked disabled className="rounded border-gray-300 text-teal-600 h-3.5 w-3.5" />
                  {recommendedItem.insurerLogo && (
                    <img src={recommendedItem.insurerLogo} alt="" className="w-10 h-10 object-contain" />
                  )}
                  <div className="flex-1">
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Recommended Product</div>
                    <div className="text-sm font-semibold text-slate-800">{recommendedItem.label}</div>
                    <div className="text-xs text-slate-500">{recommendedItem.insurer}</div>
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{fmt(recommendedItem.premiumPa)} p.a.</span>
                </div>

                {recommendedItem.covers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 ml-9">
                    {recommendedItem.covers.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-medium">
                        {(COVER_TYPE_LABELS as Record<string, string>)[c.type] ?? c.type}
                        {c.sumInsured ? ` $${parseFloat(c.sumInsured.replace(/[^0-9.]/g, '') || '0').toLocaleString('en-AU')}` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Existing products selection */}
              <div className="px-5 py-3 border-b border-gray-200">
                <div className="text-xs font-semibold text-slate-600 mb-2">
                  Select Existing Products for Like for Like Comparison ({existingItems.length} available)
                </div>
                {existingItems.length === 0 ? (
                  <p className="text-xs text-slate-400">No existing products available for this life insured.</p>
                ) : (
                  <div className="space-y-1">
                    {existingItems.map((item) => {
                      const isSelected = selectedIds.has(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleExisting(item)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded border text-left text-xs transition-colors ${
                            isSelected ? 'border-teal-300 bg-teal-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300'}`}>
                            {isSelected && <Check size={10} />}
                          </div>
                          {item.insurerLogo && <img src={item.insurerLogo} alt="" className="w-6 h-6 object-contain" />}
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-slate-800">{item.label}</span>
                            <span className="text-slate-500 ml-2">{item.insurer}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{fmt(item.premiumPa)} p.a.</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected existing products details */}
              <div className="px-5 py-3">
                {Array.from(selectedIds).length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">
                    Select an existing product above to configure details.
                  </p>
                )}
                {Array.from(selectedIds).map((id) => {
                  const item = existingItems.find((i) => i.id === id);
                  const state = existingStates[id];
                  if (!item || !state) return null;
                  return (
                    <ExistingProductDetailsPanel
                      key={id}
                      existingItem={item}
                      recItem={recommendedItem}
                      state={state}
                      onStateChange={(s) => handleExistingStateChange(id, s)}
                      onOpenLink={() => setLinkTarget({ existingItemId: id })}
                      clientName={clientName}
                      partnerName={partnerName}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'compare' && (
            <CompareTabContent
              recommendedItem={recommendedItem}
              linkedEntries={linkedEntries}
              existingItems={existingItems}
              checkedDiffs={checkedDiffs}
              onToggleDiff={handleToggleDiff}
              onToggleAllDiffs={handleToggleAllDiffs}
            />
          )}

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>
              Close
            </Button>
            <Button
              size="sm"
              className="bg-teal-700 hover:bg-teal-800 text-white text-xs"
              onClick={() => onSave(buildState())}
            >
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Map Product Modal for linking */}
      {linkTarget && (
        <MapProductModal
          open={true}
          onClose={() => setLinkTarget(null)}
          policy={linkPolicy}
          onSave={handleLinkSave}
        />
      )}
    </>
  );
}
