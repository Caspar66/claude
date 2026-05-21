import { useState, useCallback } from 'react';
import { X, Loader2, Check, ChevronDown, ChevronRight, Link2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReviewItem, ReviewCover } from './ScenarioReviewPage';
import type { ResearchPortfolio, ExistingPolicy } from './insuranceData';
import { PREMIUM_FREQUENCY_LABELS, PREMIUM_FREQUENCY_MULTIPLIER, COVER_TYPE_LABELS, coverToNeedCode } from './insuranceData';
import type { PremiumFrequency } from './insuranceData';
import { MapProductModal } from './MapProductModal';
import { postSimilaritiesAndDifferences } from '@/services/omnilifeApi';
import type { DifferenceFeature, SimilaritiesAndDifferencesEntry } from '@/services/omnilifeApi';

// ── Types ───────────────────────────────────────────────────────────────────

type L4LTab = 'details' | 'compare';

interface ExistingProductState {
  existingItemId: string;
  premSuperEdit: string;
  premNonSuperEdit: string;
  superFreq: PremiumFrequency;
  nonSuperFreq: PremiumFrequency;
  linkedPortfolio?: ResearchPortfolio;
  differences?: DifferenceFeature[];
  compareLoading?: boolean;
  compareError?: string;
}

export interface LikeForLikeState {
  selectedExistingIds: string[];
  existingStates: Record<string, ExistingProductState>;
}

// ── Props ───────────────────────────────────────────────────────────────────

interface Props {
  recommendedItem: ReviewItem;
  existingItems: ReviewItem[];
  clientName: string;
  partnerName: string | null;
  initialState?: LikeForLikeState;
  onClose: (state: LikeForLikeState) => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 });
}

const FREQ_SHORT: Record<PremiumFrequency, string> = {
  Y: '/year', H: '/half-year', Q: '/quarter', M: '/month', F: '/fortnight', W: '/week',
};

function buildPolicyFromRecommended(rec: ReviewItem, state: ExistingProductState): ExistingPolicy {
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
      coverType: c.type as 'Life' | 'TPD' | 'Trauma' | 'Income Protection' | 'Business Expense' | 'Child Cover',
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

// ── Existing Product Panel ──────────────────────────────────────────────────

function ExistingProductPanel({
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
  const [activeTab, setActiveTab] = useState<L4LTab>('details');
  const [expanded, setExpanded] = useState(true);
  const lifeInsuredName = recItem.lifeInsured === 'client' ? clientName : (partnerName ?? 'Partner');

  const handleCompare = useCallback(async () => {
    if (!recItem.supplierCode || !state.linkedPortfolio) return;

    const recEntry: SimilaritiesAndDifferencesEntry = {
      supplierCode: recItem.supplierCode,
      revisionDate: recItem.revisionDate,
      products: recItem.productCodes,
    };

    const l4lEntry: SimilaritiesAndDifferencesEntry = {
      supplierCode: state.linkedPortfolio.supplierCode,
      revisionDate: state.linkedPortfolio.revisionDate,
      products: {},
    };
    for (const [code, val] of Object.entries(state.linkedPortfolio.products)) {
      if (val?.productCode) l4lEntry.products[code] = val.productCode;
    }

    onStateChange({ ...state, compareLoading: true, compareError: undefined });

    try {
      const result = await postSimilaritiesAndDifferences([recEntry, l4lEntry]);
      onStateChange({ ...state, differences: result.differences, compareLoading: false, compareError: undefined });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load comparison';
      onStateChange({ ...state, compareLoading: false, compareError: msg });
    }
  }, [recItem, state, onStateChange]);

  const productCodeForEntry = (code: string, entry: SimilaritiesAndDifferencesEntry): string => {
    return entry.products[code.replace('NeedType_', '')] ?? '';
  };

  const recProductCode = recItem.supplierCode;
  const l4lProductCode = state.linkedPortfolio?.supplierCode ?? '';

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
        <div className="border-t border-teal-200">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                activeTab === 'details'
                  ? 'text-teal-700 border-b-2 border-teal-700 bg-teal-50/30'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => {
                setActiveTab('compare');
                if (state.linkedPortfolio && !state.differences && !state.compareLoading) {
                  handleCompare();
                }
              }}
              className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                activeTab === 'compare'
                  ? 'text-teal-700 border-b-2 border-teal-700 bg-teal-50/30'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              } ${!state.linkedPortfolio ? 'opacity-40 cursor-not-allowed' : ''}`}
              disabled={!state.linkedPortfolio}
            >
              Compare
            </button>
          </div>

          {activeTab === 'details' && (
            <div className="px-4 py-3 space-y-3">
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

          {activeTab === 'compare' && (
            <div className="px-4 py-3">
              {!state.linkedPortfolio && (
                <p className="text-xs text-slate-400 text-center py-6">
                  Link products first to compare differences.
                </p>
              )}
              {state.compareLoading && (
                <div className="flex items-center gap-2 py-6 justify-center text-xs text-slate-400">
                  <Loader2 size={14} className="animate-spin" />
                  Loading comparison…
                </div>
              )}
              {state.compareError && (
                <p className="text-xs text-red-500 text-center py-4">{state.compareError}</p>
              )}
              {state.differences && state.differences.length > 0 && (
                <div className="overflow-auto max-h-[300px]">
                  <table className="w-full text-xs border-collapse">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-gray-200">
                        <th className="py-1.5 text-left text-slate-600 font-semibold px-2">Difference</th>
                        <th className="py-1.5 text-center text-slate-600 font-semibold px-2 uppercase text-[10px]">Recommended</th>
                        <th className="py-1.5 text-center text-slate-600 font-semibold px-2 uppercase text-[10px]">Like for Like</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.differences.map((d) => {
                        const recEntry: SimilaritiesAndDifferencesEntry = {
                          supplierCode: recItem.supplierCode,
                          revisionDate: recItem.revisionDate,
                          products: recItem.productCodes,
                        };
                        const l4lEntry: SimilaritiesAndDifferencesEntry = {
                          supplierCode: state.linkedPortfolio!.supplierCode,
                          revisionDate: state.linkedPortfolio!.revisionDate,
                          products: {},
                        };
                        for (const [code, val] of Object.entries(state.linkedPortfolio!.products)) {
                          if (val?.productCode) l4lEntry.products[code] = val.productCode;
                        }

                        const recProducts = Object.values(recEntry.products);
                        const l4lProducts = Object.values(l4lEntry.products);

                        const recIncluded = d.featureIncluded.some((p) => recProducts.includes(p));
                        const l4lIncluded = d.featureIncluded.some((p) => l4lProducts.includes(p));

                        return (
                          <tr key={d.code} className={`border-b border-gray-100 ${l4lIncluded ? 'bg-emerald-50/30' : 'bg-red-50/30'}`}>
                            <td className="py-1.5 px-2 text-slate-700">{d.name}</td>
                            <td className="py-1.5 px-2 text-center">
                              {recIncluded
                                ? <CheckCircle2 size={14} className="inline text-emerald-500" />
                                : <XCircle size={14} className="inline text-red-400" />}
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              {l4lIncluded
                                ? <CheckCircle2 size={14} className="inline text-emerald-500" />
                                : <XCircle size={14} className="inline text-red-400" />}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {state.differences && state.differences.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">No differences found between these products.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
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
}: Props) {
  const lifeInsuredName = recommendedItem.lifeInsured === 'client' ? clientName : (partnerName ?? 'Partner');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() =>
    initialState ? new Set(initialState.selectedExistingIds) : new Set()
  );
  const [existingStates, setExistingStates] = useState<Record<string, ExistingProductState>>(() =>
    initialState?.existingStates ?? {}
  );
  const [linkTarget, setLinkTarget] = useState<{ existingItemId: string } | null>(null);

  function buildState(): LikeForLikeState {
    return {
      selectedExistingIds: Array.from(selectedIds),
      existingStates,
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
        differences: undefined,
        compareError: undefined,
      },
    }));
    setLinkTarget(null);
  }

  const linkPolicy = linkTarget
    ? buildPolicyFromRecommended(recommendedItem, existingStates[linkTarget.existingItemId])
    : null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-xl w-[1050px] max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-[#3b5998]">
            <div>
              <h2 className="text-sm font-bold text-white">
                Like for Like: {recommendedItem.insurer} — {recommendedItem.label}
              </h2>
            </div>
            <button onClick={() => onClose(buildState())} className="text-white/70 hover:text-white">
              <X size={16} />
            </button>
          </div>

          {/* Recommended product summary */}
          <div className="px-5 py-3 border-b border-gray-200 bg-slate-50">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                <input type="checkbox" checked disabled className="rounded border-gray-300 text-teal-600 h-3.5 w-3.5" />
              </div>
              {recommendedItem.insurerLogo && (
                <img src={recommendedItem.insurerLogo} alt="" className="w-10 h-10 object-contain" />
              )}
              <div className="flex-1">
                <div className="text-xs text-slate-400 uppercase tracking-wide">Recommended Product</div>
                <div className="text-sm font-semibold text-slate-800">{recommendedItem.label}</div>
                <div className="text-xs text-slate-500">{recommendedItem.insurer}</div>
              </div>
              <Link2 size={14} className="text-slate-400" />
            </div>

            {/* Premium details */}
            <div className="grid grid-cols-3 gap-3 text-xs mb-2">
              <div>
                <span className="text-slate-500 italic">Premium (Super):</span>{' '}
                <span className="font-medium text-slate-800">
                  {recommendedItem.premiumSuper > 0
                    ? `${fmt(recommendedItem.premiumSuper)} ${FREQ_SHORT[recommendedItem.superFrequencyCode]}`
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 italic">Premium (Non-super):</span>{' '}
                <span className="font-medium text-slate-800">
                  {recommendedItem.premiumNonSuper > 0
                    ? `${fmt(recommendedItem.premiumNonSuper)} ${FREQ_SHORT[recommendedItem.nonSuperFrequencyCode]}`
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-600 font-semibold">Total Premium:</span>{' '}
                <span className="font-semibold text-slate-800">{fmt(recommendedItem.premiumPa)} /year</span>
              </div>
            </div>

            {/* Cover pills */}
            {recommendedItem.covers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
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
          <div className="flex-1 overflow-auto px-5 py-3 min-h-[150px]">
            {Array.from(selectedIds).length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">
                Select an existing product above to begin the Like for Like comparison.
              </p>
            )}
            {Array.from(selectedIds).map((id) => {
              const item = existingItems.find((i) => i.id === id);
              const state = existingStates[id];
              if (!item || !state) return null;
              return (
                <ExistingProductPanel
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

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => onClose(buildState())}>
              Close
            </Button>
            <Button
              size="sm"
              className="bg-teal-700 hover:bg-teal-800 text-white text-xs"
              onClick={() => onClose(buildState())}
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
