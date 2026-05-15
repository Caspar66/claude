import { useState, useCallback } from 'react';
import { X, Loader2, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReviewItem } from './ScenarioReviewPage';
import { postGainedAndLost } from '@/services/omnilifeApi';
import type { GainedLostFeature, GainedLostResponse } from '@/services/omnilifeApi';
import { COVER_TYPE_LABELS } from './insuranceData';

// ── Types ───────────────────────────────────────────────────────────────────

type ReplacementTab = 'differences' | 'costs' | 'reasons';

interface FeatureCheck {
  featureCode: string;
  checked: boolean;
}

interface ComparisonResult {
  candidateId: string;
  data: GainedLostResponse;
  featureChecks: FeatureCheck[];
}

// ── Props ───────────────────────────────────────────────────────────────────

interface Props {
  existingItem: ReviewItem;
  replacementCandidates: ReviewItem[];
  clientName: string;
  partnerName: string | null;
  onClose: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function allFeatureCodes(data: GainedLostResponse): FeatureCheck[] {
  const codes: FeatureCheck[] = [];
  const seen = new Set<string>();
  for (const list of [data.featuresGained, data.featuresImproved, data.featuresLost, data.featuresDecreased]) {
    for (const f of list) {
      if (!seen.has(f.code)) {
        seen.add(f.code);
        codes.push({ featureCode: f.code, checked: true });
      }
    }
  }
  return codes;
}

function FeatureGroup({
  title,
  colorClass,
  features,
  featureChecks,
  onToggle,
}: {
  title: string;
  colorClass: string;
  features: GainedLostFeature[];
  featureChecks: FeatureCheck[];
  onToggle: (code: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  if (features.length === 0) return null;

  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-1.5 w-full text-left px-2 py-1.5 rounded text-xs font-semibold ${colorClass}`}
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {title} ({features.length})
      </button>
      {expanded && (
        <div className="ml-1 mt-1 space-y-0.5">
          {features.map((f) => {
            const check = featureChecks.find((c) => c.featureCode === f.code);
            return (
              <div key={f.code} className="flex items-start gap-2 px-2 py-1 rounded hover:bg-slate-50 text-xs">
                <button
                  onClick={() => onToggle(f.code)}
                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                    check?.checked
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {check?.checked && <Check size={10} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800">{f.name}</div>
                  {f.coverType && (
                    <span className="text-slate-500 text-[10px]">
                      {(COVER_TYPE_LABELS as Record<string, string>)[f.coverType] ?? f.coverType}
                    </span>
                  )}
                  {f.subFeatures.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {f.subFeatures.map((sf) => (
                        <div key={sf.code} className="flex gap-3 text-[10px] text-slate-600 pl-2 border-l border-slate-200">
                          <span className="text-slate-400 min-w-[60px]">Existing:</span>
                          <span>{sf.comparedValue || '—'}</span>
                          <span className="text-slate-400 min-w-[60px]">New:</span>
                          <span>{sf.recommendedValue || '—'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function ReplacementModal({
  existingItem,
  replacementCandidates,
  clientName,
  partnerName,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState<ReplacementTab>('differences');
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [comparisons, setComparisons] = useState<Map<string, ComparisonResult>>(new Map());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [costsText, setCostsText] = useState('');
  const [reasonsText, setReasonsText] = useState('');

  const lifeInsuredName = existingItem.lifeInsured === 'client'
    ? clientName
    : (partnerName ?? 'Partner');

  const toggleCandidate = useCallback(async (candidate: ReviewItem) => {
    const id = candidate.id;
    setSelectedCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      next.add(id);
      return next;
    });

    if (comparisons.has(id)) return;

    setLoading((prev) => new Set(prev).add(id));
    setErrors((prev) => { const n = new Map(prev); n.delete(id); return n; });

    try {
      const data = await postGainedAndLost({
        compared: {
          supplierCode: existingItem.supplierCode,
          revisionDate: existingItem.revisionDate,
          products: existingItem.productCodes,
        },
        recommended: {
          supplierCode: candidate.supplierCode,
          revisionDate: candidate.revisionDate,
          products: candidate.productCodes,
        },
      });
      const featureChecks = allFeatureCodes(data);
      setComparisons((prev) => new Map(prev).set(id, { candidateId: id, data, featureChecks }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load comparison';
      setErrors((prev) => new Map(prev).set(id, msg));
    } finally {
      setLoading((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }
  }, [existingItem, comparisons]);

  function toggleFeatureCheck(candidateId: string, featureCode: string) {
    setComparisons((prev) => {
      const next = new Map(prev);
      const existing = next.get(candidateId);
      if (!existing) return prev;
      next.set(candidateId, {
        ...existing,
        featureChecks: existing.featureChecks.map((c) =>
          c.featureCode === featureCode ? { ...c, checked: !c.checked } : c
        ),
      });
      return next;
    });
  }

  const tabs: { key: ReplacementTab; label: string }[] = [
    { key: 'differences', label: 'Differences in Benefits' },
    { key: 'costs', label: 'Costs of Replacement' },
    { key: 'reasons', label: 'Reasons for Replacement' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-[900px] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Replacement Analysis</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {existingItem.insurer} — {existingItem.label} • {lifeInsuredName}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        {/* Existing cover summary */}
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
          <div className="text-xs font-semibold text-amber-800 mb-1.5">Existing Cover</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-slate-500">Insurer:</span>{' '}
              <span className="text-slate-800 font-medium">{existingItem.insurer}</span>
            </div>
            <div>
              <span className="text-slate-500">Life Insured:</span>{' '}
              <span className="text-slate-800 font-medium">{lifeInsuredName}</span>
            </div>
            <div>
              <span className="text-slate-500">Premium p.a.:</span>{' '}
              <span className="text-slate-800 font-medium">
                {existingItem.premiumPa.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          {existingItem.covers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {existingItem.covers.map((c, i) => (
                <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-medium">
                  {(COVER_TYPE_LABELS as Record<string, string>)[c.type] ?? c.type}
                  {c.sumInsured ? ` $${parseFloat(c.sumInsured.replace(/[^0-9.]/g, '') || '0').toLocaleString('en-AU')}` : ''}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Candidates list */}
        <div className="px-5 py-3 border-b border-gray-200">
          <div className="text-xs font-semibold text-slate-600 mb-2">
            Select Replacement Products ({replacementCandidates.length} available)
          </div>
          {replacementCandidates.length === 0 ? (
            <p className="text-xs text-slate-400">No recommended or varied products for this life insured.</p>
          ) : (
            <div className="space-y-1 max-h-[120px] overflow-auto">
              {replacementCandidates.map((c) => {
                const isSelected = selectedCandidates.has(c.id);
                const isLoading = loading.has(c.id);
                const error = errors.get(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCandidate(c)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded border text-left text-xs transition-colors ${
                      isSelected
                        ? 'border-teal-300 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check size={10} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 truncate">{c.label}</div>
                      <div className="text-slate-500">{c.insurer}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      c.type === 'rec' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {c.type === 'rec' ? 'Recommend' : 'Vary to Existing'}
                    </span>
                    {isLoading && <Loader2 size={14} className="animate-spin text-slate-400" />}
                    {error && <span className="text-red-500 text-[10px] max-w-[120px] truncate">{error}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                activeTab === t.key
                  ? 'text-teal-700 border-b-2 border-teal-700 bg-teal-50/30'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto px-5 py-3 min-h-[200px]">
          {activeTab === 'differences' && (
            <>
              {Array.from(selectedCandidates).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-8">
                  Select a replacement product above to see differences in benefits.
                </p>
              )}
              {Array.from(selectedCandidates).map((candidateId) => {
                const candidate = replacementCandidates.find((c) => c.id === candidateId);
                const comparison = comparisons.get(candidateId);
                const isLoading = loading.has(candidateId);
                const error = errors.get(candidateId);

                if (!candidate) return null;
                return (
                  <div key={candidateId} className="mb-4 last:mb-0">
                    <div className="text-xs font-semibold text-slate-700 mb-2 pb-1 border-b border-gray-100">
                      vs. {candidate.insurer} — {candidate.label}
                    </div>
                    {isLoading && (
                      <div className="flex items-center gap-2 py-4 text-xs text-slate-400">
                        <Loader2 size={14} className="animate-spin" />
                        Loading comparison…
                      </div>
                    )}
                    {error && <p className="text-xs text-red-500 py-2">{error}</p>}
                    {comparison && (
                      <div>
                        <FeatureGroup
                          title="Features Gained"
                          colorClass="bg-emerald-50 text-emerald-800"
                          features={comparison.data.featuresGained}
                          featureChecks={comparison.featureChecks}
                          onToggle={(code) => toggleFeatureCheck(candidateId, code)}
                        />
                        <FeatureGroup
                          title="Features Improved"
                          colorClass="bg-blue-50 text-blue-800"
                          features={comparison.data.featuresImproved}
                          featureChecks={comparison.featureChecks}
                          onToggle={(code) => toggleFeatureCheck(candidateId, code)}
                        />
                        <FeatureGroup
                          title="Features Lost"
                          colorClass="bg-red-50 text-red-800"
                          features={comparison.data.featuresLost}
                          featureChecks={comparison.featureChecks}
                          onToggle={(code) => toggleFeatureCheck(candidateId, code)}
                        />
                        <FeatureGroup
                          title="Features Decreased"
                          colorClass="bg-amber-50 text-amber-800"
                          features={comparison.data.featuresDecreased}
                          featureChecks={comparison.featureChecks}
                          onToggle={(code) => toggleFeatureCheck(candidateId, code)}
                        />
                        {comparison.data.featuresGained.length === 0 &&
                         comparison.data.featuresImproved.length === 0 &&
                         comparison.data.featuresLost.length === 0 &&
                         comparison.data.featuresDecreased.length === 0 && (
                          <p className="text-xs text-slate-400 py-2">No feature differences found.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {activeTab === 'costs' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Costs of Replacement</label>
              <textarea
                value={costsText}
                onChange={(e) => setCostsText(e.target.value)}
                className="w-full h-[200px] border border-gray-200 rounded p-3 text-xs text-slate-800 resize-none focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Describe the costs associated with replacing this policy, including any exit fees, loss of loyalty benefits, waiting periods, exclusions that may apply to new cover, premium differences, etc."
              />
            </div>
          )}

          {activeTab === 'reasons' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Reasons for Replacement</label>
              <textarea
                value={reasonsText}
                onChange={(e) => setReasonsText(e.target.value)}
                className="w-full h-[200px] border border-gray-200 rounded p-3 text-xs text-slate-800 resize-none focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Explain why replacement is recommended for this policy. Consider: client's needs have changed, better product features available, cost savings, improved definitions, insurer financial strength, etc."
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
          <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>
            Close
          </Button>
          <Button
            size="sm"
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs"
            onClick={onClose}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
