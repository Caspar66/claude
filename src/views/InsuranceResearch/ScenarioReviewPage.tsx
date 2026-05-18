import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuoteResultRow, ResolvedCover } from './quoteResultsData';
import { getNeedLabel } from './quoteResultsData';
import type { ExistingPolicy, ExistingCover, PremiumFrequency, ClientFormData } from './insuranceData';
import { COVER_TYPE_LABELS, PREMIUM_FREQUENCY_LABELS, PREMIUM_FREQUENCY_MULTIPLIER, coverToNeedCode } from './insuranceData';
import type { NeedsQuote } from './needsTypes';
import { VaryExistingCoverModal } from './VaryExistingCoverModal';
import { ReplacementModal } from './ReplacementModal';
import { ProductDetailsModal } from './ProductDetailsModal';

// ── Types ───────────────────────────────────────────────────────────────────

export type ReviewStatus = 'Recommend' | 'Not Accepted' | 'Alternative' | 'Hold' | 'Replace' | 'Cancel' | 'Vary' | 'Exclude' | 'Vary to Existing';

export interface ReviewItem {
  id: string;
  type: 'existing' | 'rec' | 'alt' | 'vary';
  label: string;
  insurer: string;
  insurerLogo?: string;
  status: ReviewStatus;
  premiumPa: number;
  frequency: string;
  lifeInsured: 'client' | 'partner';
  existingPolicy?: ExistingPolicy;
  quoteRow?: QuoteResultRow;
  covers: {
    type: string;
    definition?: string;
    sumInsured: string;
    owner?: string;
    resolved?: ResolvedCover;
  }[];
  supplierCode: string;
  revisionDate?: string;
  productCodes: Record<string, string>;
}

function fmt(n: number) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 });
}

function coverLabel(c: ExistingCover): string {
  let label = COVER_TYPE_LABELS[c.coverType] || c.coverType;
  if (c.premiumStyle) {
    const styleMap: Record<string, string> = { S: 'Variable age-stepped', B: 'Blended', L: 'Variable to age 65', '70': 'Variable to age 70' };
    label += ` / ${styleMap[c.premiumStyle] ?? c.premiumStyle}`;
  }
  if (c.definition) label += ` / ${c.definition}`;
  if (c.waitingPeriod) label += ` / WP ${c.waitingPeriod} days`;
  if (c.benefitPeriod) label += ` / BP to Age ${c.benefitPeriod}`;
  return label;
}

function buildExistingItems(policies: ExistingPolicy[]): ReviewItem[] {
  return policies
    .filter((p) => p.action === 'Review' || p.action === 'Replace')
    .map((p) => {
      const premiumPa = (p.premiumSuper + p.stampDutySuper) * PREMIUM_FREQUENCY_MULTIPLIER[p.superFrequency]
                       + (p.premiumNonSuper + p.stampDutyNonSuper) * PREMIUM_FREQUENCY_MULTIPLIER[p.nonSuperFrequency];
      const productCodes: Record<string, string> = {};
      if (p.researchPortfolio) {
        for (const [code, val] of Object.entries(p.researchPortfolio.products)) {
          if (val?.productCode) productCodes[code] = val.productCode;
        }
      }
      return {
        id: p.id,
        type: 'existing' as const,
        label: p.policyDescription || 'Existing Policy',
        insurer: p.provider,
        status: 'Hold' as ReviewStatus,
        premiumPa,
        frequency: PREMIUM_FREQUENCY_LABELS[p.superFrequency],
        lifeInsured: p.lifeInsured,
        existingPolicy: p,
        covers: p.covers.map((c) => ({
          type: coverToNeedCode(c, p.covers),
          definition: c.definition,
          sumInsured: c.sumInsured,
          owner: c.ownership,
        })),
        supplierCode: p.researchPortfolio?.supplierCode ?? '',
        revisionDate: p.researchPortfolio?.revisionDate,
        productCodes,
      };
    });
}

function buildQuoteItems(rows: QuoteResultRow[], quotes: NeedsQuote[]): ReviewItem[] {
  return rows
    .filter((r) => r.recommendation === 'rec' || r.recommendation === 'alt')
    .map((r) => {
      const q = quotes[r.quoteIndex];
      const superFreq = (q?.superFrequency ?? 'M') as PremiumFrequency;
      const nonSuperFreq = (q?.nonSuperFrequency ?? 'M') as PremiumFrequency;
      const superPrem = Object.values(r.premiumInsideSuper)[0] ?? 0;
      const nonSuperPrem = Object.values(r.premiumOutsideSuper)[0] ?? 0;
      const premiumPa = superPrem * PREMIUM_FREQUENCY_MULTIPLIER[superFreq]
                       + nonSuperPrem * PREMIUM_FREQUENCY_MULTIPLIER[nonSuperFreq];
      return {
        id: r.id,
        type: r.recommendation === 'rec' ? 'rec' as const : 'alt' as const,
        label: r.portfolioName || r.products,
        insurer: r.supplierName,
        insurerLogo: r.supplierLogo,
        status: (r.recommendation === 'rec' ? 'Recommend' : 'Alternative') as ReviewStatus,
        premiumPa,
        frequency: PREMIUM_FREQUENCY_LABELS[nonSuperFreq],
        lifeInsured: q?.lifeInsured ?? 'client',
        quoteRow: r,
        covers: r.resolvedCovers.length > 0
          ? r.resolvedCovers.map((rc) => ({
              type: getNeedLabel(rc.needCode),
              definition: rc.definition,
              sumInsured: rc.sumInsured != null ? `${rc.sumInsured}` : rc.monthlyBenefit != null ? `${rc.monthlyBenefit}` : '',
              owner: rc.owner,
              resolved: rc,
            }))
          : r.premiumBreakdown.length > 0
            ? r.premiumBreakdown.map((bd, idx) => {
                const lineItem = r.premiumLineItems[idx];
                return {
                  type: bd.description.split(' / ')[0] || bd.description,
                  definition: bd.description,
                  sumInsured: lineItem ? `${lineItem.amount}` : '',
                };
              })
            : r.products.split(', ').map((p) => ({ type: p, sumInsured: '' })),
        supplierCode: r.supplierCode,
        revisionDate: r.revisionDate,
        productCodes: r.productCodes,
      };
    });
}

// ── Status badge component ──────────────────────────────────────────────────

const STATUS_COLORS: Record<ReviewStatus, string> = {
  Recommend: 'bg-emerald-100 text-emerald-800',
  'Not Accepted': 'bg-slate-100 text-slate-600',
  Alternative: 'bg-blue-100 text-blue-800',
  Hold: 'bg-amber-100 text-amber-800',
  Replace: 'bg-red-100 text-red-800',
  Cancel: 'bg-red-100 text-red-700',
  Vary: 'bg-purple-100 text-purple-800',
  Exclude: 'bg-slate-200 text-slate-500',
  'Vary to Existing': 'bg-purple-100 text-purple-800',
};

// ── Expandable row ──────────────────────────────────────────────────────────

function ReviewRow({
  item,
  onStatusChange,
  onViewDetails,
  clientName,
  partnerName,
}: {
  item: ReviewItem;
  onStatusChange: (id: string, status: ReviewStatus) => void;
  onViewDetails: (item: ReviewItem) => void;
  clientName: string;
  partnerName: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const lifeInsuredName = item.lifeInsured === 'client' ? clientName : (partnerName ?? 'Partner');

  const statusOptions: ReviewStatus[] =
    item.type === 'existing' ? ['Hold', 'Replace', 'Cancel', 'Vary', 'Exclude'] :
    item.type === 'rec' ? ['Recommend', 'Not Accepted'] :
    item.type === 'alt' ? ['Alternative', 'Not Accepted'] :
    ['Recommend', 'Not Accepted', 'Alternative', 'Hold', 'Replace', 'Cancel', 'Vary', 'Exclude', 'Vary to Existing'];

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-slate-50/50 transition-colors">
        <td className="px-3 py-3">
          <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-slate-600">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-2">
            {item.insurerLogo && (
              <img src={item.insurerLogo} alt="" className="w-8 h-8 object-contain flex-shrink-0" />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-800">{item.label}</span>
              <span className="text-xs text-slate-500">{item.insurer}</span>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-xs text-slate-600">{lifeInsuredName}</td>
        <td className="px-3 py-3 text-right">
          <span className="text-sm font-medium text-slate-800">{fmt(item.premiumPa)}</span>
          <span className="text-xs text-slate-400 ml-1">pa</span>
        </td>
        <td className="px-3 py-3 text-center">
          <select
            className={`px-2 py-0.5 rounded-full text-xs font-semibold border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500 ${STATUS_COLORS[item.status]}`}
            value={item.status}
            onChange={(e) => onStatusChange(item.id, e.target.value as ReviewStatus)}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </td>
        <td className="px-3 py-3 text-center">
          <button
            onClick={() => onViewDetails(item)}
            className="text-teal-600 hover:text-teal-800 p-1 rounded hover:bg-teal-50 inline-flex items-center gap-1 text-xs font-medium"
            title="View Details"
          >
            <Eye size={14} />
          </button>
        </td>
      </tr>
      {expanded && item.existingPolicy && (
        <tr className="bg-slate-50/50">
          <td />
          <td colSpan={5} className="px-6 py-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-1 text-left text-slate-600 font-semibold">Type</th>
                  <th className="py-1 text-left text-slate-600 font-semibold">Definition</th>
                  <th className="py-1 text-left text-slate-600 font-semibold">Owner</th>
                  <th className="py-1 text-left text-slate-600 font-semibold">Life Insured</th>
                  <th className="py-1 text-right text-slate-600 font-semibold">Benefit Amount</th>
                </tr>
              </thead>
              <tbody>
                {item.existingPolicy.covers.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100">
                    <td className="py-1.5 text-slate-700">{COVER_TYPE_LABELS[c.coverType]}</td>
                    <td className="py-1.5 text-slate-600">{coverLabel(c)}</td>
                    <td className="py-1.5 text-slate-600">{lifeInsuredName}</td>
                    <td className="py-1.5 text-slate-600">{lifeInsuredName}</td>
                    <td className="py-1.5 text-right text-slate-800 font-medium">{c.sumInsured ? `$${parseFloat(c.sumInsured.replace(/[^0-9.]/g, '') || '0').toLocaleString('en-AU')}` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
      {expanded && item.quoteRow && (
        <tr className="bg-slate-50/50">
          <td />
          <td colSpan={5} className="px-6 py-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-1 text-left text-slate-600 font-semibold">Type</th>
                  <th className="py-1 text-left text-slate-600 font-semibold">Definition</th>
                  <th className="py-1 text-left text-slate-600 font-semibold">Owner</th>
                  <th className="py-1 text-left text-slate-600 font-semibold">Life Insured</th>
                  <th className="py-1 text-right text-slate-600 font-semibold">Benefit Amount</th>
                </tr>
              </thead>
              <tbody>
                {item.covers.map((c, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-1.5 text-slate-700">{c.type}</td>
                    <td className="py-1.5 text-slate-600">{c.definition || c.type}</td>
                    <td className="py-1.5 text-slate-600">{lifeInsuredName}</td>
                    <td className="py-1.5 text-slate-600">{lifeInsuredName}</td>
                    <td className="py-1.5 text-right text-slate-800 font-medium">
                      {c.sumInsured ? `$${parseFloat(c.sumInsured.replace(/[^0-9.]/g, '') || '0').toLocaleString('en-AU')}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

interface Props {
  scenarioName: string;
  policies: ExistingPolicy[];
  clientQuoteResults: QuoteResultRow[];
  partnerQuoteResults: QuoteResultRow[];
  quotes: NeedsQuote[];
  clientData: ClientFormData;
  partnerData: ClientFormData | null;
  onBack: () => void;
  onSaveComplete: (items: ReviewItem[]) => void;
}

export function ScenarioReviewPage({
  scenarioName,
  policies,
  clientQuoteResults,
  partnerQuoteResults,
  quotes,
  clientData,
  partnerData,
  onBack,
  onSaveComplete,
}: Props) {
  const allRows = [...clientQuoteResults, ...partnerQuoteResults];
  const [items, setItems] = useState<ReviewItem[]>(() => [
    ...buildExistingItems(policies),
    ...buildQuoteItems(allRows, quotes),
  ]);

  const [varyItem, setVaryItem] = useState<ReviewItem | null>(null);
  const [replaceItem, setReplaceItem] = useState<ReviewItem | null>(null);
  const [detailsItem, setDetailsItem] = useState<ReviewItem | null>(null);

  const clientName = `${clientData.firstName} ${clientData.lastName}`.trim() || 'Client';
  const partnerName = partnerData ? `${partnerData.firstName} ${partnerData.lastName}`.trim() || 'Partner' : null;

  function handleStatusChange(id: string, status: ReviewStatus) {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    if (status === 'Vary' && item.existingPolicy) {
      setVaryItem(item);
      return;
    }
    if (status === 'Replace' && item.existingPolicy) {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
      setReplaceItem({ ...item, status });
      return;
    }

    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
  }

  function handleVarySave(variedPolicy: ExistingPolicy) {
    if (!varyItem) return;
    setItems((prev) => prev.map((i) => i.id === varyItem.id ? { ...i, status: 'Vary' as ReviewStatus } : i));
    const premiumPa = (variedPolicy.premiumSuper + variedPolicy.stampDutySuper) * PREMIUM_FREQUENCY_MULTIPLIER[variedPolicy.superFrequency]
                     + (variedPolicy.premiumNonSuper + variedPolicy.stampDutyNonSuper) * PREMIUM_FREQUENCY_MULTIPLIER[variedPolicy.nonSuperFrequency];
    const productCodes: Record<string, string> = {};
    if (variedPolicy.researchPortfolio) {
      for (const [code, val] of Object.entries(variedPolicy.researchPortfolio.products)) {
        if (val?.productCode) productCodes[code] = val.productCode;
      }
    }
    const newItem: ReviewItem = {
      id: `vary-${Date.now()}`,
      type: 'vary',
      label: variedPolicy.policyDescription || 'Varied Policy',
      insurer: variedPolicy.provider,
      status: 'Vary to Existing',
      premiumPa,
      frequency: PREMIUM_FREQUENCY_LABELS[variedPolicy.superFrequency],
      lifeInsured: variedPolicy.lifeInsured,
      existingPolicy: variedPolicy,
      covers: variedPolicy.covers.map((c) => ({
        type: coverToNeedCode(c, variedPolicy.covers),
        definition: c.definition,
        sumInsured: c.sumInsured,
        owner: c.ownership,
      })),
      supplierCode: variedPolicy.researchPortfolio?.supplierCode ?? '',
      revisionDate: variedPolicy.researchPortfolio?.revisionDate,
      productCodes,
    };
    setItems((prev) => [...prev, newItem]);
    setVaryItem(null);
  }

  const existingItems = items.filter((i) => i.type === 'existing');
  const recItems = items.filter((i) => i.type === 'rec');
  const altItems = items.filter((i) => i.type === 'alt');
  const varyItems = items.filter((i) => i.type === 'vary');

  const recommendAndVaryItems = items.filter((i) =>
    (i.type === 'rec' && i.status === 'Recommend') || i.type === 'vary'
  );

  if (varyItem && varyItem.existingPolicy) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <VaryExistingCoverModal
          policy={varyItem.existingPolicy}
          clientName={clientName}
          partnerName={partnerName}
          onSave={handleVarySave}
          onCancel={() => setVaryItem(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-700 text-white">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold">Insurance Research</span>
          <span className="text-slate-400 text-xs">Scenarios &gt;</span>
          <span className="text-sm">{scenarioName}</span>
        </div>
        <button onClick={onBack} className="text-white/70 hover:text-white">
          <ArrowLeft size={18} />
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-gray-200">
              <th className="w-10 px-3 py-2.5" />
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Policy Details</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Life Insured</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600">Premium p.a.</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600">Status</th>
              <th className="w-12 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {/* Existing Covers */}
            {existingItems.length > 0 && (
              <tr className="bg-amber-50">
                <td colSpan={6} className="px-4 py-2 text-xs font-bold text-amber-800">
                  Existing Covers ({existingItems.length})
                </td>
              </tr>
            )}
            {existingItems.map((item) => (
              <ReviewRow key={item.id} item={item} onStatusChange={handleStatusChange} onViewDetails={setDetailsItem} clientName={clientName} partnerName={partnerName} />
            ))}

            {/* Recommendations */}
            {recItems.length > 0 && (
              <tr className="bg-emerald-50">
                <td colSpan={6} className="px-4 py-2 text-xs font-bold text-emerald-800">
                  Recommendations ({recItems.length})
                </td>
              </tr>
            )}
            {recItems.map((item) => (
              <ReviewRow key={item.id} item={item} onStatusChange={handleStatusChange} onViewDetails={setDetailsItem} clientName={clientName} partnerName={partnerName} />
            ))}

            {/* Vary to Existing */}
            {varyItems.length > 0 && (
              <tr className="bg-purple-50">
                <td colSpan={6} className="px-4 py-2 text-xs font-bold text-purple-800">
                  Vary to Existing ({varyItems.length})
                </td>
              </tr>
            )}
            {varyItems.map((item) => (
              <ReviewRow key={item.id} item={item} onStatusChange={handleStatusChange} onViewDetails={setDetailsItem} clientName={clientName} partnerName={partnerName} />
            ))}

            {/* Alternatives */}
            {altItems.length > 0 && (
              <tr className="bg-blue-50">
                <td colSpan={6} className="px-4 py-2 text-xs font-bold text-blue-800">
                  Alternatives ({altItems.length})
                </td>
              </tr>
            )}
            {altItems.map((item) => (
              <ReviewRow key={item.id} item={item} onStatusChange={handleStatusChange} onViewDetails={setDetailsItem} clientName={clientName} partnerName={partnerName} />
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  No products to review. Go back and tag products as Rec or Alt.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
        <Button variant="outline" size="sm" className="text-xs" onClick={onBack}>
          <ArrowLeft size={12} className="mr-1" />
          Back to Quotes
        </Button>
        <Button
          size="sm"
          className="bg-teal-700 hover:bg-teal-800 text-white text-xs"
          onClick={() => onSaveComplete(items)}
        >
          Save to Scenario
        </Button>
      </div>

      {/* Replace modal */}
      {replaceItem && replaceItem.existingPolicy && (
        <ReplacementModal
          existingItem={replaceItem}
          replacementCandidates={recommendAndVaryItems.filter((i) => i.lifeInsured === replaceItem.lifeInsured)}
          clientName={clientName}
          partnerName={partnerName}
          onClose={() => setReplaceItem(null)}
        />
      )}

      {/* Product Details modal */}
      {detailsItem && (
        <ProductDetailsModal
          item={detailsItem}
          clientName={clientName}
          partnerName={partnerName}
          onSave={(updated) => {
            setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
            setDetailsItem(null);
          }}
          onClose={() => setDetailsItem(null)}
        />
      )}
    </div>
  );
}
