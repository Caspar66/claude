import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, Eye, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuoteResultRow, ResolvedCover } from './quoteResultsData';
import { getNeedLabel } from './quoteResultsData';
import type { ExistingPolicy, ExistingCover, PremiumFrequency, ClientFormData } from './insuranceData';
import { PREMIUM_FREQUENCY_LABELS, PREMIUM_FREQUENCY_MULTIPLIER, coverToNeedCode } from './insuranceData';
import type { NeedsQuote } from './needsTypes';
import {
  STRUCTURE_4_LABELS, STRUCTURE_3_LABELS,
  OCCUPATION_LABELS,
} from './needsTypes';
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
  premiumSuper: number;
  premiumNonSuper: number;
  superFrequencyCode: PremiumFrequency;
  nonSuperFrequencyCode: PremiumFrequency;
  frequency: string;
  lifeInsured: 'client' | 'partner';
  existingPolicy?: ExistingPolicy;
  quoteRow?: QuoteResultRow;
  covers: ReviewCover[];
  supplierCode: string;
  revisionDate?: string;
  productCodes: Record<string, string>;
}

export interface ReviewCover {
  type: string;
  definition?: string;
  coverStructure?: string;
  premiumStructure?: string;
  sumInsured: string;
  owner: string;
  isSuper: boolean;
  waitingPeriod?: string;
  benefitPeriod?: string;
  resolved?: ResolvedCover;
}

function fmt(n: number) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 });
}

const STRUCT_MAP: Record<string, string> = { ...STRUCTURE_4_LABELS, ...STRUCTURE_3_LABELS };
const OCC_MAP: Record<string, string> = OCCUPATION_LABELS;

function getCoverType(needCode: string): string {
  switch (needCode) {
    case 'TRM': return 'Life';
    case 'TPE': case 'TPR': case 'TPS': return 'TPD';
    case 'TRE': case 'TRS': return 'Trauma';
    case 'INC': return 'Income Protection';
    case 'BUS': return 'Business Expense';
    case 'NES': case 'CHT': return 'Other';
    default: return getNeedLabel(needCode);
  }
}

function deriveCoverStructure(c: ExistingCover, coverType: string, allCovers: ExistingCover[]): string {
  const isSuperLinked = c.superLinked === 'Yes';

  if (coverType === 'TPD') {
    if (isSuperLinked) return 'Super-Linked';
    if (c.standAlone === 'Yes') return 'Standalone';
    if (c.flexiLinked === 'Yes') return 'Flexi-linked';
    return 'Linked';
  }

  if (coverType === 'Trauma') {
    const hasLifeCover = allCovers.some(co => co.coverType === 'Life');
    if (!hasLifeCover) return 'Standalone';
    if (c.standAlone === 'Yes') return 'Standalone';
    if (c.flexiLinked === 'Yes') return 'Flexi-linked';
    return 'Linked';
  }

  if (isSuperLinked) return 'Super-Linked';
  if (c.standAlone === 'Yes') return 'Standalone';
  if (c.flexiLinked === 'Yes') return 'Linked';
  return 'Standalone';
}

const FREQ_SHORT: Record<PremiumFrequency, string> = {
  Y: '/year', H: '/half year', Q: '/quarter', M: '/month', F: '/fortnight', W: '/week',
};

function formatBenefitPeriod(bp: string): string {
  if (!bp) return '';
  const n = parseInt(bp, 10);
  if (isNaN(n)) return bp;
  if (n <= 5) return `${n} year${n === 1 ? '' : 's'}`;
  return `Age ${n}`;
}

function formatWaitingPeriod(wp: string): string {
  if (!wp) return '';
  return `${wp} days`;
}

function isTPDCode(code: string): boolean {
  return code === 'TPE' || code === 'TPR';
}

function isIPCode(code: string): boolean {
  return code === 'INC';
}

function isSuperLinkOwner(owner?: string): boolean {
  return owner === 'J' || owner === 'K';
}

function buildResolvedCovers(resolvedCovers: ResolvedCover[], defaultOwner: string): ReviewCover[] {
  const result: ReviewCover[] = [];
  for (const rc of resolvedCovers) {
    const si = rc.sumInsured != null ? `${rc.sumInsured}` : rc.monthlyBenefit != null ? `${rc.monthlyBenefit}` : '';
    const premiumStructure = rc.structure ? (STRUCT_MAP[rc.structure] ?? rc.structure) : undefined;

    if (isTPDCode(rc.needCode) && rc.owner === 'J') {
      result.push({
        type: 'TPD',
        definition: 'Super-Linked Any',
        coverStructure: 'Super-Linked',
        premiumStructure,
        sumInsured: si,
        owner: defaultOwner,
        isSuper: true,
        resolved: rc,
      });
      result.push({
        type: 'TPD',
        definition: 'Super-Linked Own',
        coverStructure: 'Super-Linked',
        premiumStructure,
        sumInsured: si,
        owner: defaultOwner,
        isSuper: false,
        resolved: rc,
      });
    } else if (isIPCode(rc.needCode) && isSuperLinkOwner(rc.owner)) {
      result.push({
        type: 'Income Protection',
        definition: 'Indemnity',
        coverStructure: 'Super-Linked',
        premiumStructure,
        sumInsured: si,
        owner: defaultOwner,
        isSuper: true,
        waitingPeriod: rc.waitingPeriod,
        benefitPeriod: rc.benefitPeriod,
        resolved: rc,
      });
      result.push({
        type: 'Income Protection',
        definition: 'Indemnity',
        coverStructure: 'Super-Linked',
        premiumStructure,
        sumInsured: si,
        owner: defaultOwner,
        isSuper: false,
        waitingPeriod: rc.waitingPeriod,
        benefitPeriod: rc.benefitPeriod,
        resolved: rc,
      });
    } else {
      const coverType = getCoverType(rc.needCode);
      const ownerCode = rc.owner ?? '';
      const isSuperCover = ownerCode === 'S' || ownerCode === 'M' || ownerCode === 'J' || ownerCode === 'K';

      let definition: string | undefined;
      let coverStructure: string;

      if (isTPDCode(rc.needCode)) {
        definition = rc.occupationType === 'O' ? 'Own' : rc.occupationType === 'A' ? 'Any' : (rc.occupationType ? (OCC_MAP[rc.occupationType] ?? rc.occupationType) : undefined);
        coverStructure = rc.isLinked ? 'Linked' : 'Standalone';
      } else if (isIPCode(rc.needCode)) {
        definition = 'Indemnity';
        coverStructure = rc.isLinked ? 'Linked' : 'Standalone';
      } else if (rc.needCode === 'NES' || rc.needCode === 'CHT') {
        coverStructure = rc.needCode === 'NES' ? 'Needle Stick' : 'Child Trauma';
      } else {
        definition = rc.definition || undefined;
        coverStructure = rc.isLinked ? 'Linked' : 'Standalone';
      }

      result.push({
        type: coverType,
        definition,
        coverStructure,
        premiumStructure,
        sumInsured: si,
        owner: defaultOwner,
        isSuper: isSuperCover,
        waitingPeriod: rc.waitingPeriod,
        benefitPeriod: rc.benefitPeriod,
        resolved: rc,
      });
    }
  }
  return result;
}

function buildExistingItems(policies: ExistingPolicy[], clientName: string, partnerName: string | null): ReviewItem[] {
  const styleMap: Record<string, string> = { S: 'Variable age-stepped', B: 'Blended', L: 'Variable to age 65', '70': 'Variable to age 70' };
  return policies
    .filter((p) => p.action === 'Review' || p.action === 'Replace')
    .map((p) => {
      const lifeInsuredName = p.lifeInsured === 'client' ? clientName : (partnerName ?? 'Partner');
      const premSuper = p.premiumSuper + p.stampDutySuper;
      const premNonSuper = p.premiumNonSuper + p.stampDutyNonSuper;
      const premiumPa = premSuper * PREMIUM_FREQUENCY_MULTIPLIER[p.superFrequency]
                       + premNonSuper * PREMIUM_FREQUENCY_MULTIPLIER[p.nonSuperFrequency];
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
        premiumSuper: premSuper,
        premiumNonSuper: premNonSuper,
        superFrequencyCode: p.superFrequency,
        nonSuperFrequencyCode: p.nonSuperFrequency,
        frequency: PREMIUM_FREQUENCY_LABELS[p.superFrequency],
        lifeInsured: p.lifeInsured,
        existingPolicy: p,
        covers: p.covers.map((c) => {
          const needCode = coverToNeedCode(c, p.covers);
          const coverType = getCoverType(needCode);
          return {
            type: coverType,
            definition: c.definition || undefined,
            coverStructure: deriveCoverStructure(c, coverType, p.covers),
            premiumStructure: c.premiumStyle ? (styleMap[c.premiumStyle] ?? c.premiumStyle) : undefined,
            sumInsured: c.sumInsured,
            owner: c.owner || lifeInsuredName,
            isSuper: c.super === 'Yes',
            waitingPeriod: c.waitingPeriod,
            benefitPeriod: c.benefitPeriod,
          };
        }),
        supplierCode: p.researchPortfolio?.supplierCode ?? '',
        revisionDate: p.researchPortfolio?.revisionDate,
        productCodes,
      };
    });
}

function buildQuoteItems(rows: QuoteResultRow[], quotes: NeedsQuote[], clientName: string): ReviewItem[] {
  return rows
    .filter((r) => r.recommendation === 'rec' || r.recommendation === 'alt')
    .map((r) => {
      const q = quotes[r.quoteIndex];
      const superFreq = (q?.superFrequency ?? 'M') as PremiumFrequency;
      const nonSuperFreq = (q?.nonSuperFrequency ?? 'M') as PremiumFrequency;
      const premSuper = (r.premiumInsideSuper[superFreq] ?? 0) + (r.stampDutyInsideSuper[superFreq] ?? 0);
      const premNonSuper = (r.premiumOutsideSuper[nonSuperFreq] ?? 0) + (r.stampDutyOutsideSuper[nonSuperFreq] ?? 0);
      const premiumPa = premSuper * PREMIUM_FREQUENCY_MULTIPLIER[superFreq]
                       + premNonSuper * PREMIUM_FREQUENCY_MULTIPLIER[nonSuperFreq];
      const defaultOwner = clientName;
      return {
        id: r.id,
        type: r.recommendation === 'rec' ? 'rec' as const : 'alt' as const,
        label: r.products || r.portfolioName,
        insurer: r.supplierName,
        insurerLogo: r.supplierLogo,
        status: (r.recommendation === 'rec' ? 'Recommend' : 'Alternative') as ReviewStatus,
        premiumPa,
        premiumSuper: premSuper,
        premiumNonSuper: premNonSuper,
        superFrequencyCode: superFreq,
        nonSuperFrequencyCode: nonSuperFreq,
        frequency: PREMIUM_FREQUENCY_LABELS[nonSuperFreq],
        lifeInsured: q?.lifeInsured ?? 'client',
        quoteRow: r,
        covers: r.resolvedCovers.length > 0
          ? buildResolvedCovers(r.resolvedCovers, defaultOwner)
          : r.premiumBreakdown.length > 0
            ? r.premiumBreakdown.map((bd, idx) => {
                const lineItem = r.premiumLineItems[idx];
                return {
                  type: bd.description.split(' / ')[0] || bd.description,
                  definition: bd.description,
                  sumInsured: lineItem ? `${lineItem.amount}` : '',
                  owner: defaultOwner,
                  isSuper: false,
                };
              })
            : r.products.split(', ').map((p) => ({ type: p, sumInsured: '', owner: defaultOwner, isSuper: false })),
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

// ── Add Custom Owner Modal ─────────────────────────────────────────────────

function AddOwnerModal({ onSave, onClose }: { onSave: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-xl w-80 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">Add Custom Owner</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
        </div>
        <input
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
          placeholder="Owner name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onSave(name.trim()); }}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">Cancel</Button>
          <Button
            size="sm"
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs"
            onClick={() => { if (name.trim()) onSave(name.trim()); }}
            disabled={!name.trim()}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Expandable row ──────────────────────────────────────────────────────────

function ReviewRow({
  item,
  onStatusChange,
  onViewDetails,
  onCoverUpdate,
  onRequestAddOwner,
  clientName,
  partnerName,
  customOwners,
}: {
  item: ReviewItem;
  onStatusChange: (id: string, status: ReviewStatus) => void;
  onViewDetails: (item: ReviewItem) => void;
  onCoverUpdate: (itemId: string, coverIndex: number, updates: Partial<ReviewCover>) => void;
  onRequestAddOwner: (itemId: string, coverIndex: number) => void;
  clientName: string;
  partnerName: string | null;
  customOwners: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const lifeInsuredName = item.lifeInsured === 'client' ? clientName : (partnerName ?? 'Partner');

  const statusOptions: ReviewStatus[] =
    item.type === 'existing' ? ['Hold', 'Replace', 'Cancel', 'Vary', 'Exclude'] :
    item.type === 'rec' ? ['Recommend', 'Not Accepted'] :
    item.type === 'alt' ? ['Alternative', 'Not Accepted'] :
    ['Recommend', 'Not Accepted', 'Alternative', 'Hold', 'Replace', 'Cancel', 'Vary', 'Exclude', 'Vary to Existing'];

  const ownerOptions: string[] = [clientName];
  if (partnerName && !ownerOptions.includes(partnerName)) ownerOptions.push(partnerName);
  if (!ownerOptions.includes('SMSF')) ownerOptions.push('SMSF');
  if (!ownerOptions.includes('Super Fund')) ownerOptions.push('Super Fund');
  for (const co of customOwners) {
    if (!ownerOptions.includes(co)) ownerOptions.push(co);
  }

  function handleOwnerChange(coverIndex: number, value: string) {
    if (value === '__add__') {
      onRequestAddOwner(item.id, coverIndex);
      return;
    }
    onCoverUpdate(item.id, coverIndex, { owner: value });
  }

  function formatBenefitAmount(raw: string): string {
    if (!raw) return '';
    const num = parseFloat(raw.replace(/[^0-9.]/g, '') || '0');
    return num > 0 ? `$${num.toLocaleString('en-AU')}` : '';
  }

  const totalPrem = item.premiumSuper + item.premiumNonSuper;

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
        <td className="px-3 py-3 text-right">
          {item.premiumSuper > 0
            ? <><span className="text-sm font-medium text-slate-800">{fmt(item.premiumSuper)}</span><span className="text-xs text-slate-400 ml-0.5">{FREQ_SHORT[item.superFrequencyCode]}</span></>
            : <span className="text-xs text-slate-400">N/A</span>}
        </td>
        <td className="px-3 py-3 text-right">
          {item.premiumNonSuper > 0
            ? <><span className="text-sm font-medium text-slate-800">{fmt(item.premiumNonSuper)}</span><span className="text-xs text-slate-400 ml-0.5">{FREQ_SHORT[item.nonSuperFrequencyCode]}</span></>
            : <span className="text-xs text-slate-400">N/A</span>}
        </td>
        <td className="px-3 py-3 text-right">
          <span className="text-sm font-semibold text-slate-800">{fmt(totalPrem)}</span>
          <span className="text-xs text-slate-400 ml-0.5">
            {item.superFrequencyCode === item.nonSuperFrequencyCode
              ? FREQ_SHORT[item.superFrequencyCode]
              : item.premiumSuper > 0 && item.premiumNonSuper > 0
                ? FREQ_SHORT[item.nonSuperFrequencyCode]
                : item.premiumSuper > 0 ? FREQ_SHORT[item.superFrequencyCode] : FREQ_SHORT[item.nonSuperFrequencyCode]}
          </span>
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
      {expanded && item.covers.length > 0 && (
        <tr className="bg-slate-50/50">
          <td />
          <td colSpan={6} className="px-6 py-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-1 text-left text-slate-600 font-semibold">Type</th>
                  <th className="py-1 text-left text-slate-600 font-semibold">Description</th>
                  <th className="py-1 text-left text-slate-600 font-semibold">Premium Structure</th>
                  <th className="py-1 text-left text-slate-600 font-semibold">Cover Structure</th>
                  <th className="py-1 text-center text-slate-600 font-semibold w-14">Super</th>
                  <th className="py-1 text-left text-slate-600 font-semibold">Owner</th>
                  <th className="py-1 text-left text-slate-600 font-semibold">Life Insured</th>
                  <th className="py-1 text-right text-slate-600 font-semibold">Benefit Amount</th>
                  <th className="py-1 text-left text-slate-600 font-semibold">Benefit Period</th>
                  <th className="py-1 text-left text-slate-600 font-semibold">Waiting Period</th>
                </tr>
              </thead>
              <tbody>
                {item.covers.map((c, idx) => {
                  const rc = c.resolved;
                  return (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-1.5 text-slate-700 font-medium">{c.type}</td>
                      <td className="py-1.5 text-slate-600">{c.definition || ''}</td>
                      <td className="py-1.5 text-slate-600">{c.premiumStructure || (rc?.structure ? (STRUCT_MAP[rc.structure] ?? rc.structure) : '')}</td>
                      <td className="py-1.5 text-slate-600">{c.coverStructure || ''}</td>
                      <td className="py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={c.isSuper}
                          disabled
                          className="rounded border-gray-300 text-teal-600 h-3.5 w-3.5 cursor-default"
                        />
                      </td>
                      <td className="py-1.5">
                        <select
                          className="border border-gray-200 rounded px-1.5 py-0.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                          value={ownerOptions.includes(c.owner) ? c.owner : c.owner}
                          onChange={(e) => handleOwnerChange(idx, e.target.value)}
                        >
                          {ownerOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                          {!ownerOptions.includes(c.owner) && (
                            <option value={c.owner}>{c.owner}</option>
                          )}
                          <option value="__add__">+ Add...</option>
                        </select>
                      </td>
                      <td className="py-1.5 text-slate-600">{lifeInsuredName}</td>
                      <td className="py-1.5 text-right text-slate-800 font-medium">
                        {formatBenefitAmount(c.sumInsured)}
                      </td>
                      <td className="py-1.5 text-slate-600">{c.benefitPeriod ? formatBenefitPeriod(c.benefitPeriod) : (rc?.benefitPeriod ? formatBenefitPeriod(rc.benefitPeriod) : '')}</td>
                      <td className="py-1.5 text-slate-600">{c.waitingPeriod ? formatWaitingPeriod(c.waitingPeriod) : (rc?.waitingPeriod ? formatWaitingPeriod(rc.waitingPeriod) : '')}</td>
                    </tr>
                  );
                })}
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
  const clientName = `${clientData.firstName} ${clientData.lastName}`.trim() || 'Client';
  const partnerName = partnerData ? `${partnerData.firstName} ${partnerData.lastName}`.trim() || 'Partner' : null;

  const allRows = [...clientQuoteResults, ...partnerQuoteResults];
  const [items, setItems] = useState<ReviewItem[]>(() => [
    ...buildExistingItems(policies, clientName, partnerName),
    ...buildQuoteItems(allRows, quotes, clientName),
  ]);

  const [varyItem, setVaryItem] = useState<ReviewItem | null>(null);
  const [replaceItem, setReplaceItem] = useState<ReviewItem | null>(null);
  const [detailsItem, setDetailsItem] = useState<ReviewItem | null>(null);
  const [customOwners, setCustomOwners] = useState<string[]>([]);
  const [addOwnerTarget, setAddOwnerTarget] = useState<{ itemId: string; coverIndex: number } | null>(null);

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

  function handleCoverUpdate(itemId: string, coverIndex: number, updates: Partial<ReviewCover>) {
    setItems((prev) => prev.map((i) => {
      if (i.id !== itemId) return i;
      const newCovers = [...i.covers];
      newCovers[coverIndex] = { ...newCovers[coverIndex], ...updates };
      return { ...i, covers: newCovers };
    }));
  }

  function handleAddOwnerSave(name: string) {
    if (!addOwnerTarget) return;
    setCustomOwners((prev) => prev.includes(name) ? prev : [...prev, name]);
    handleCoverUpdate(addOwnerTarget.itemId, addOwnerTarget.coverIndex, { owner: name });
    setAddOwnerTarget(null);
  }

  function handleVarySave(variedPolicy: ExistingPolicy) {
    if (!varyItem) return;
    setItems((prev) => prev.map((i) => i.id === varyItem.id ? { ...i, status: 'Vary' as ReviewStatus } : i));
    const varyStyleMap: Record<string, string> = { S: 'Variable age-stepped', B: 'Blended', L: 'Variable to age 65', '70': 'Variable to age 70' };
    const premSuper = variedPolicy.premiumSuper + variedPolicy.stampDutySuper;
    const premNonSuper = variedPolicy.premiumNonSuper + variedPolicy.stampDutyNonSuper;
    const premiumPa = premSuper * PREMIUM_FREQUENCY_MULTIPLIER[variedPolicy.superFrequency]
                     + premNonSuper * PREMIUM_FREQUENCY_MULTIPLIER[variedPolicy.nonSuperFrequency];
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
      premiumSuper: premSuper,
      premiumNonSuper: premNonSuper,
      superFrequencyCode: variedPolicy.superFrequency,
      nonSuperFrequencyCode: variedPolicy.nonSuperFrequency,
      frequency: PREMIUM_FREQUENCY_LABELS[variedPolicy.superFrequency],
      lifeInsured: variedPolicy.lifeInsured,
      existingPolicy: variedPolicy,
      covers: variedPolicy.covers.map((c) => {
        const needCode = coverToNeedCode(c, variedPolicy.covers);
        const coverType = getCoverType(needCode);
        return {
          type: coverType,
          definition: c.definition || undefined,
          coverStructure: deriveCoverStructure(c, coverType, variedPolicy.covers),
          premiumStructure: c.premiumStyle ? (varyStyleMap[c.premiumStyle] ?? c.premiumStyle) : undefined,
          sumInsured: c.sumInsured,
          owner: c.owner || c.ownership || clientName,
          isSuper: c.super === 'Yes',
          waitingPeriod: c.waitingPeriod,
          benefitPeriod: c.benefitPeriod,
        };
      }),
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
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600">Super</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600">Non-Super</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600">Premium</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600">Status</th>
              <th className="w-12 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {/* Existing Covers */}
            {existingItems.length > 0 && (
              <tr className="bg-amber-50">
                <td colSpan={7} className="px-4 py-2 text-xs font-bold text-amber-800">
                  Existing Covers ({existingItems.length})
                </td>
              </tr>
            )}
            {existingItems.map((item) => (
              <ReviewRow key={item.id} item={item} onStatusChange={handleStatusChange} onViewDetails={setDetailsItem} onCoverUpdate={handleCoverUpdate} onRequestAddOwner={(itemId, coverIndex) => setAddOwnerTarget({ itemId, coverIndex })} clientName={clientName} partnerName={partnerName} customOwners={customOwners} />
            ))}

            {/* Recommendations */}
            {recItems.length > 0 && (
              <tr className="bg-emerald-50">
                <td colSpan={7} className="px-4 py-2 text-xs font-bold text-emerald-800">
                  Recommendations ({recItems.length})
                </td>
              </tr>
            )}
            {recItems.map((item) => (
              <ReviewRow key={item.id} item={item} onStatusChange={handleStatusChange} onViewDetails={setDetailsItem} onCoverUpdate={handleCoverUpdate} onRequestAddOwner={(itemId, coverIndex) => setAddOwnerTarget({ itemId, coverIndex })} clientName={clientName} partnerName={partnerName} customOwners={customOwners} />
            ))}

            {/* Vary to Existing */}
            {varyItems.length > 0 && (
              <tr className="bg-purple-50">
                <td colSpan={7} className="px-4 py-2 text-xs font-bold text-purple-800">
                  Vary to Existing ({varyItems.length})
                </td>
              </tr>
            )}
            {varyItems.map((item) => (
              <ReviewRow key={item.id} item={item} onStatusChange={handleStatusChange} onViewDetails={setDetailsItem} onCoverUpdate={handleCoverUpdate} onRequestAddOwner={(itemId, coverIndex) => setAddOwnerTarget({ itemId, coverIndex })} clientName={clientName} partnerName={partnerName} customOwners={customOwners} />
            ))}

            {/* Alternatives */}
            {altItems.length > 0 && (
              <tr className="bg-blue-50">
                <td colSpan={7} className="px-4 py-2 text-xs font-bold text-blue-800">
                  Alternatives ({altItems.length})
                </td>
              </tr>
            )}
            {altItems.map((item) => (
              <ReviewRow key={item.id} item={item} onStatusChange={handleStatusChange} onViewDetails={setDetailsItem} onCoverUpdate={handleCoverUpdate} onRequestAddOwner={(itemId, coverIndex) => setAddOwnerTarget({ itemId, coverIndex })} clientName={clientName} partnerName={partnerName} customOwners={customOwners} />
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
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
          quoteSuperFreq={detailsItem.quoteRow ? (quotes[detailsItem.quoteRow.quoteIndex]?.superFrequency as PremiumFrequency | undefined) : undefined}
          quoteNonSuperFreq={detailsItem.quoteRow ? (quotes[detailsItem.quoteRow.quoteIndex]?.nonSuperFrequency as PremiumFrequency | undefined) : undefined}
          onSave={(updated) => {
            setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
            setDetailsItem(null);
          }}
          onClose={() => setDetailsItem(null)}
        />
      )}

      {/* Add Custom Owner modal */}
      {addOwnerTarget && (
        <AddOwnerModal
          onSave={handleAddOwnerSave}
          onClose={() => setAddOwnerTarget(null)}
        />
      )}
    </div>
  );
}
