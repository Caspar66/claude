import { useState, useRef, useCallback } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Search,
  ArrowUpDown,
  Download,
  BarChart3,
  ExternalLink,
  FileText,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuoteResults, QuoteResultRow, ExcludedProduct, PremiumBreakdownItem } from './quoteResultsData';
import { computePremiumTotal, computeCumulativePremium, FREQ_ANNUAL_MULTIPLIER } from './quoteResultsData';
import { postQuoteValidation } from '@/services/omnilifeApi';
import type { PremiumFrequency } from './insuranceData';
import type { NeedsQuote } from './needsTypes';
import { ExclusionReasonsModal } from './ExclusionReasonsModal';
import { OccupationDetailsModal } from './OccupationDetailsModal';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 });
}

function scoreColor(score: number): string {
  if (score > 80) return 'bg-emerald-100 text-emerald-800';
  if (score >= 50) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-700';
}

type SortField = 'insurer' | 'products' | 'premium' | 'cumulativePremium' | 'featureScore' | 'valueScore';

const FREQ_SHORT: Record<string, string> = {
  Y: 'pa', H: 'phy', Q: 'pq', M: 'pm', F: 'pf', W: 'pw',
};

function freqShort(code: PremiumFrequency): string {
  return FREQ_SHORT[code] ?? code;
}

const FREQ_LABEL: Record<string, string> = {
  Y: 'Yearly', H: 'Half Yearly', Q: 'Quarterly', M: 'Monthly', F: 'Fortnightly', W: 'Weekly',
};

// ── Insurer logo ─────────────────────────────────────────────────────────────

function InsurerLogo({ name, logo, size = 'md' }: { name: string; logo?: string; size?: 'sm' | 'md' | 'lg' }) {
  const [loadFailed, setLoadFailed] = useState(false);
  const px = size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';

  if (logo && !loadFailed) {
    return (
      <img
        src={logo}
        alt={name}
        className={`${px} object-contain bg-white border border-gray-200 rounded`}
        onError={() => setLoadFailed(true)}
      />
    );
  }

  const initials = name.replace(/[^A-Z]/g, '').slice(0, 3) || name.slice(0, 3).toUpperCase();
  return (
    <div className={`${px} flex items-center justify-center rounded border border-gray-200 bg-slate-100`} aria-label={name}>
      <span className={`font-bold ${size === 'lg' ? 'text-sm' : 'text-xs'} text-slate-600`}>{initials}</span>
    </div>
  );
}

// ── Premium breakdown summary ───────────────────────────────────────────────

function PremiumBreakdownSummary({
  row,
  superFreq,
  nonSuperFreq,
  validated,
}: {
  row: QuoteResultRow;
  superFreq: PremiumFrequency;
  nonSuperFreq: PremiumFrequency;
  validated: boolean | null;
}) {
  const bd = row.premiumBreakdown;

  if (bd.length === 0) {
    const fallbackNonSuper = (row.premiumOutsideSuper[nonSuperFreq] ?? 0) + (row.stampDutyOutsideSuper[nonSuperFreq] ?? 0);
    const fallbackSuper = (row.premiumInsideSuper[superFreq] ?? 0) + (row.stampDutyInsideSuper[superFreq] ?? 0);
    const fallbackTotal = computePremiumTotal(row, superFreq, nonSuperFreq);
    const fallbackHasBoth = fallbackSuper !== 0 && fallbackNonSuper !== 0;
    const fallbackFreqLabel = superFreq === nonSuperFreq
      ? FREQ_LABEL[superFreq]
      : fallbackHasBoth
        ? 'Annualised'
        : FREQ_LABEL[fallbackNonSuper !== 0 ? nonSuperFreq : superFreq];
    return (
      <>
        {row.premiumLineItems.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-xs py-0.5">
            <span className="text-slate-600">{item.label}</span>
            <span className="text-slate-800">{fmt(item.amount)}</span>
          </div>
        ))}
        <div className={`flex items-center justify-between px-2 py-2 mt-2 text-white rounded text-xs font-bold ${validated === true ? 'bg-emerald-700' : 'bg-indigo-900'}`}>
          <span className="flex items-center gap-1">
            {validated === true && <Check size={12} />}
            Total {fallbackFreqLabel} Premium
          </span>
          <span>{fmt(fallbackTotal)}</span>
        </div>
      </>
    );
  }

  const superLines: { desc: string; amount: number }[] = [];
  let superStampDuty = 0;
  for (const item of bd) {
    const prem = item.premiumInsideSuper[superFreq] ?? 0;
    if (prem > 0) superLines.push({ desc: item.description, amount: prem });
    superStampDuty += item.stampDutyInsideSuper[superFreq] ?? 0;
  }
  const superSubTotal = superLines.reduce((s, l) => s + l.amount, 0) + superStampDuty;

  const nonSuperLines: { desc: string; amount: number }[] = [];
  let nonSuperStampDuty = 0;
  for (const item of bd) {
    const prem = item.premiumOutsideSuper[nonSuperFreq] ?? 0;
    if (prem > 0) nonSuperLines.push({ desc: item.description, amount: prem });
    nonSuperStampDuty += item.stampDutyOutsideSuper[nonSuperFreq] ?? 0;
  }
  const nonSuperSubTotal = nonSuperLines.reduce((s, l) => s + l.amount, 0) + nonSuperStampDuty;

  const hasSuper = superSubTotal > 0;
  const hasNonSuper = nonSuperSubTotal > 0;
  const hasBoth = hasSuper && hasNonSuper;
  const needsAnnualise = hasBoth && superFreq !== nonSuperFreq;

  let totalLabel: string;
  let totalValue: number;
  if (needsAnnualise) {
    totalLabel = 'Total Annualised Premium';
    totalValue = superSubTotal * FREQ_ANNUAL_MULTIPLIER[superFreq]
               + nonSuperSubTotal * FREQ_ANNUAL_MULTIPLIER[nonSuperFreq];
  } else if (hasSuper && !hasNonSuper) {
    totalLabel = `Total ${FREQ_LABEL[superFreq]} Premium`;
    totalValue = superSubTotal;
  } else if (hasNonSuper && !hasSuper) {
    totalLabel = `Total ${FREQ_LABEL[nonSuperFreq]} Premium`;
    totalValue = nonSuperSubTotal;
  } else {
    totalLabel = `Total ${FREQ_LABEL[nonSuperFreq]} Premium`;
    totalValue = superSubTotal + nonSuperSubTotal;
  }

  return (
    <>
      {hasSuper && (
        <>
          <div className="text-xs font-bold text-slate-700 mb-1.5">Super</div>
          {superLines.map((line, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-0.5 pl-3">
              <span className="text-slate-600">{line.desc}</span>
              <span className="text-slate-800 shrink-0 ml-2">{fmt(line.amount)}</span>
            </div>
          ))}
          {superStampDuty > 0 && (
            <div className="flex items-center justify-between text-xs py-0.5 pl-3">
              <span className="text-slate-600">Stamp Duty</span>
              <span className="text-slate-800">{fmt(superStampDuty)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs py-1 mt-1 border-t border-gray-100">
            <span className="text-slate-700 font-bold">{FREQ_LABEL[superFreq]} Sub Total</span>
            <span className="text-slate-800 font-medium">{fmt(superSubTotal)}</span>
          </div>
        </>
      )}

      {hasNonSuper && (
        <>
          <div className={`text-xs font-bold text-slate-700 mb-1.5 ${hasSuper ? 'mt-3' : ''}`}>Non-super{hasBoth ? ' (linked to Super)' : ''}</div>
          {nonSuperLines.map((line, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-0.5 pl-3">
              <span className="text-slate-600">{line.desc}</span>
              <span className="text-slate-800 shrink-0 ml-2">{fmt(line.amount)}</span>
            </div>
          ))}
          {nonSuperStampDuty > 0 && (
            <div className="flex items-center justify-between text-xs py-0.5 pl-3">
              <span className="text-slate-600">Stamp Duty</span>
              <span className="text-slate-800">{fmt(nonSuperStampDuty)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs py-1 mt-1 border-t border-gray-100">
            <span className="text-slate-700 font-bold">{FREQ_LABEL[nonSuperFreq]} Sub Total</span>
            <span className="text-slate-800 font-medium">{fmt(nonSuperSubTotal)}</span>
          </div>
        </>
      )}

      <div className={`flex items-center justify-between px-2 py-2 mt-2 text-white rounded text-xs font-bold ${validated === true ? 'bg-emerald-700' : 'bg-indigo-900'}`}>
        <span className="flex items-center gap-1">
          {validated === true && <Check size={12} />}
          {totalLabel}
        </span>
        <span>{fmt(totalValue)}</span>
      </div>
    </>
  );
}

// ── Additional Information panel ─────────────────────────────────────────────

type AdditionalInfoTab = 'summary' | 'notes' | 'links';

function AdditionalInfoPanel({
  row,
  superFreq,
  nonSuperFreq,
  quoteRequestBody,
  onClose,
  onValidated,
  initialValidated,
  onRequoteWithOccupation,
  requotingOccupation,
}: {
  row: QuoteResultRow;
  superFreq: PremiumFrequency;
  nonSuperFreq: PremiumFrequency;
  quoteRequestBody: Record<string, unknown>;
  onClose: () => void;
  onValidated: (rowId: string, matched: boolean) => void;
  initialValidated: boolean | null;
  onRequoteWithOccupation: (quoteIndex: number, supplierCode: string, occupationId: string) => void;
  requotingOccupation: boolean;
}) {
  const [activeTab, setActiveTab] = useState<AdditionalInfoTab>(row.existingCover ? 'links' : 'summary');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ matched: boolean; omnium: number; supplier: number } | 'failed' | null>(
    initialValidated === true ? { matched: true, omnium: 0, supplier: 0 } : initialValidated === false ? 'failed' : null,
  );
  const [showOccModal, setShowOccModal] = useState(false);
  const hasFeatures = row.topFeatures.length > 0 || row.bottomFeatures.length > 0;
  const hasLinks = !!row.pdsLink || !!row.tmdLink;

  async function handleValidate() {
    setValidating(true);
    try {
      const res = await postQuoteValidation(
        row.portfolioCode,
        quoteRequestBody,
        superFreq,
        nonSuperFreq,
      );
      const matched = res.validation === 'Success';
      setValidationResult({ matched, omnium: res.omniumPremiumTotal, supplier: res.supplierPremiumTotal });
      onValidated(row.id, matched);
    } catch (err) {
      console.error('[QuoteValidation]', err);
      setValidationResult('failed');
    } finally {
      setValidating(false);
    }
  }

  const [panelWidth, setPanelWidth] = useState(360);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(360);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    startW.current = panelWidth;

    function onMove(ev: MouseEvent) {
      if (!dragging.current) return;
      const delta = startX.current - ev.clientX;
      setPanelWidth(Math.max(280, Math.min(600, startW.current + delta)));
    }
    function onUp() {
      dragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [panelWidth]);

  return (
    <div className="border-l border-gray-200 bg-white flex flex-col shrink-0 overflow-hidden relative" style={{ width: panelWidth }}>
      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-300/40 active:bg-indigo-400/50 z-10"
        onMouseDown={onDragStart}
      />
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-indigo-900 text-white">
        <span className="text-xs font-bold truncate">Additional Information : {row.supplierName}</span>
        <button className="text-white/70 hover:text-white shrink-0 ml-2" onClick={onClose}><X size={14} /></button>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Supplier + product header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <InsurerLogo name={row.supplierName} logo={row.supplierLogo} size="lg" />
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-800">{row.portfolioName}</div>
              <div className="text-[11px] text-slate-500 leading-tight">{row.products}</div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="px-4 py-3 space-y-2.5 border-b border-gray-200 text-xs">
          {row.occupationDescription && (
            <div className="flex items-start gap-2">
              <span className="text-slate-500 shrink-0 w-28">Occupation</span>
              <button
                className="text-teal-700 font-medium hover:text-teal-800 underline underline-offset-2 text-left"
                onClick={() => setShowOccModal(true)}
              >
                {row.occupationDescription}
              </button>
            </div>
          )}
          {showOccModal && (
            <OccupationDetailsModal
              supplierName={row.supplierName}
              supplierCode={row.supplierCode}
              occupationDescription={row.occupationDescription}
              occupationClasses={row.occupationClasses}
              onRequoteWithOccupation={(sc, occId) => onRequoteWithOccupation(row.quoteIndex, sc, occId)}
              requoting={requotingOccupation}
              onClose={() => setShowOccModal(false)}
            />
          )}
          {row.tpdOccClass && (
            <div className="flex items-start gap-2">
              <span className="text-slate-500 shrink-0 w-28">TPD Occ Class</span>
              <span className="text-blue-600 font-medium">{row.tpdOccClass}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 px-4 border-b border-gray-200">
          <button
            className={`text-xs font-semibold py-2 border-b-2 transition-colors ${activeTab === 'summary' ? 'text-slate-800 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          {hasFeatures && (
            <button
              className={`text-xs font-semibold py-2 border-b-2 transition-colors ${activeTab === 'notes' ? 'text-slate-800 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
              onClick={() => setActiveTab('notes')}
            >
              Notes
            </button>
          )}
          {hasLinks && (
            <button
              className={`text-xs font-semibold py-2 border-b-2 transition-colors ${activeTab === 'links' ? 'text-slate-800 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
              onClick={() => setActiveTab('links')}
            >
              Links
            </button>
          )}
        </div>

        {/* Tab content */}
        {activeTab === 'summary' && (
          <div className="px-4 py-3">
            <PremiumBreakdownSummary
              row={row}
              superFreq={superFreq}
              nonSuperFreq={nonSuperFreq}
              validated={validationResult !== null && validationResult !== 'failed' ? validationResult.matched : null}
            />
            {row.validationAvailable && (validationResult === null || validationResult === 'failed') && (
              <button
                className={`mt-3 w-full text-xs font-semibold py-1.5 rounded border transition-colors disabled:opacity-50 ${
                  validationResult === 'failed'
                    ? 'border-red-400 text-red-600 hover:bg-red-50'
                    : 'border-teal-700 text-teal-700 hover:bg-teal-50'
                }`}
                onClick={handleValidate}
                disabled={validating}
              >
                {validating ? 'Validating…' : validationResult === 'failed' ? 'Failed to validate — Retry' : 'Validate Premium'}
              </button>
            )}
            {(() => {
              const upfrontPct = row.commissionUpfrontPercent[nonSuperFreq];
              const ongoingPct = row.commissionOngoingPercent[nonSuperFreq];
              const upfrontAnn = row.commissionUpfrontAnnualised
                ?? (((row.commissionUpfront[nonSuperFreq] ?? 0) * FREQ_ANNUAL_MULTIPLIER[nonSuperFreq]) || undefined);
              const ongoingAnn = row.commissionOngoingAnnualised
                ?? (((row.commissionOngoing[nonSuperFreq] ?? 0) * FREQ_ANNUAL_MULTIPLIER[nonSuperFreq]) || undefined);
              const hasData = row.commissionLabel || upfrontPct != null || ongoingPct != null;
              if (!hasData) return null;
              return (
                <table className="w-full text-xs mt-3">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-1 text-left text-slate-700 font-bold w-24">Commissions</th>
                      <th className="py-1 text-right text-slate-700 font-medium">{row.commissionLabel ?? ''}</th>
                      <th className="py-1 text-right text-slate-700 font-medium">Annualised</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(upfrontPct != null || upfrontAnn != null) && (
                      <tr>
                        <td className="py-1 text-slate-500">Upfront:</td>
                        <td className="py-1 text-right text-slate-800 font-medium">{upfrontPct != null ? `${Math.round(upfrontPct)}%` : ''}</td>
                        <td className="py-1 text-right text-slate-800 font-medium">{upfrontAnn != null ? fmt(upfrontAnn) : ''}</td>
                      </tr>
                    )}
                    {(ongoingPct != null || ongoingAnn != null) && (
                      <tr>
                        <td className="py-1 text-slate-500">Ongoing:</td>
                        <td className="py-1 text-right text-slate-800 font-medium">{ongoingPct != null ? `${Math.round(ongoingPct)}%` : ''}</td>
                        <td className="py-1 text-right text-slate-800 font-medium">{ongoingAnn != null ? fmt(ongoingAnn) : ''}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              );
            })()}
          </div>
        )}

        {activeTab === 'notes' && hasFeatures && (
          <div className="px-4 py-3 space-y-4">
            {row.topFeatures.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-2">Strengths</h4>
                <div className="space-y-2">
                  {row.topFeatures.map((f, i) => (
                    <div key={i} className="min-w-0">
                      <span className="text-xs font-bold text-slate-700">{f.headingName} </span>
                      <span className="text-xs text-slate-500">{f.summaryText}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {row.bottomFeatures.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-2">Limitations</h4>
                <div className="space-y-2">
                  {row.bottomFeatures.map((f, i) => (
                    <div key={i} className="min-w-0">
                      <span className="text-xs font-bold text-slate-700">{f.headingName} </span>
                      <span className="text-xs text-slate-500">{f.summaryText}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'links' && hasLinks && (
          <div className="px-4 py-3 space-y-3">
            {row.pdsLink && (
              <a href={row.pdsLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                <Download size={14} className="shrink-0" />
                Product Disclosure Statement (PDS)
              </a>
            )}
            {row.tmdLink && (
              <a href={row.tmdLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                <Download size={14} className="shrink-0" />
                Target Market Determination (TMD)
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Excluded product row ─────────────────────────────────────────────────────

function ExcludedRow({ item, quoteRequestBody }: { item: ExcludedProduct; quoteRequestBody: Record<string, unknown> }) {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <tr className="border-b border-gray-100">
        <td className="px-6 py-2">
          <div className="flex items-center gap-2">
            <InsurerLogo name={item.supplierName} logo={item.supplierLogo} />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-700">{item.supplierName}</span>
              {item.portfolioName && (
                <span className="text-[10px] text-slate-500 leading-tight">{item.portfolioName}</span>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-2">
          <button
            className="text-xs text-teal-700 hover:text-teal-800 font-medium underline underline-offset-2"
            onClick={() => setShowModal(true)}
          >
            Reasons for Exclusion
          </button>
        </td>
        <td className="px-4 py-2">
          {item.errors.length > 0 && (
            <div className="flex flex-col gap-0.5">
              {item.errors.map((err, i) => (
                <span key={i} className="text-xs text-red-600">{err}</span>
              ))}
            </div>
          )}
        </td>
        <td className="px-4 py-2">
          {item.pdsLink && (
            <a
              href={item.pdsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-teal-700 hover:text-teal-800 font-medium underline underline-offset-2"
            >
              PDS
            </a>
          )}
        </td>
        <td className="px-4 py-2">
          {item.tmdLink && (
            <a
              href={item.tmdLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-teal-700 hover:text-teal-800 font-medium underline underline-offset-2"
            >
              TMD
            </a>
          )}
        </td>
      </tr>
      {showModal && (
        <ExclusionReasonsModal
          product={item}
          quoteRequestBody={quoteRequestBody}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  results: QuoteResults;
  selectedQuoteIndices: number[];
  activeClient: 'client' | 'partner';
  quotes: NeedsQuote[];
  quoteRequestBody: Record<string, unknown>;
  onToggleSelect: (id: string) => void;
  onSetRecommendation: (id: string, value: 'rec' | 'alt' | null) => void;
  onCompareProducts: () => void;
  onViewCompareFeatures: () => void;
  onRequoteWithOccupation: (quoteIndex: number, supplierCode: string, occupationId: string) => void;
  requotingOccupation: boolean;
}

export function QuoteResultsPanel({ results, selectedQuoteIndices, activeClient, quotes, quoteRequestBody, onToggleSelect, onSetRecommendation, onCompareProducts, onViewCompareFeatures, onRequoteWithOccupation, requotingOccupation }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('premium');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [excludedCollapsed, setExcludedCollapsed] = useState(true);
  const projectionYears = (quoteRequestBody?.settings as Record<string, unknown> | undefined)?.projectionYears as string | number | undefined;
  const [showGraphs, setShowGraphs] = useState(false);
  const [validatedRows, setValidatedRows] = useState<Record<string, boolean>>({});
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  }

  function getRowFreqs(row: QuoteResultRow): { superFreq: PremiumFrequency; nonSuperFreq: PremiumFrequency } {
    const q = quotes[row.quoteIndex];
    return {
      superFreq: (q?.superFrequency ?? 'M') as PremiumFrequency,
      nonSuperFreq: (q?.nonSuperFrequency ?? 'M') as PremiumFrequency,
    };
  }

  function getSortValue(row: QuoteResultRow, field: SortField): number | string {
    const { superFreq, nonSuperFreq } = getRowFreqs(row);
    switch (field) {
      case 'insurer': return row.supplierName.toLowerCase();
      case 'products': return (row.portfolioName + ' ' + row.products).toLowerCase();
      case 'premium': return computePremiumTotal(row, superFreq, nonSuperFreq);
      case 'cumulativePremium': return computeCumulativePremium(row, superFreq, nonSuperFreq);
      case 'featureScore': return row.featureScore;
      case 'valueScore': return row.valueScore;
    }
  }

  // Quote indices belonging to the active life insured
  const clientQuoteIndices = new Set(
    quotes.map((q, idx) => ({ q, idx }))
      .filter(({ q }) => q.lifeInsured === activeClient)
      .map(({ idx }) => idx),
  );

  // Filter by selected quotes or all quotes for the active client
  const showAll = selectedQuoteIndices.length === 0;
  const visibleRows = showAll
    ? results.rows.filter((r) => clientQuoteIndices.has(r.quoteIndex))
    : results.rows.filter((r) => selectedQuoteIndices.includes(r.quoteIndex));
  const visibleExcluded = showAll
    ? results.excluded.filter((e) => clientQuoteIndices.has(e.quoteIndex))
    : results.excluded.filter((e) => selectedQuoteIndices.includes(e.quoteIndex));

  const filtered = visibleRows.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return r.supplierName.toLowerCase().includes(term) || r.products.toLowerCase().includes(term) || r.portfolioName.toLowerCase().includes(term);
  });

  // Sort — existing cover rows always at the bottom, deduplicated
  const quoteRows = filtered.filter((r) => !r.existingCover);
  const existingRowsRaw = filtered.filter((r) => r.existingCover);
  const seenExisting = new Set<string>();
  const existingRows = existingRowsRaw.filter((r) => {
    const key = `${r.supplierCode}|${r.portfolioCode}|${r.products}`;
    if (seenExisting.has(key)) return false;
    seenExisting.add(key);
    return true;
  });

  function sortRows(rows: QuoteResultRow[]) {
    rows.sort((a, b) => {
      const aVal = getSortValue(a, sortField);
      const bVal = getSortValue(b, sortField);
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }
  sortRows(quoteRows);
  sortRows(existingRows);

  const sorted = [...quoteRows, ...existingRows];

  const selectAll = sorted.length > 0 && sorted.every((r) => r.selected);

  const selectedRow = selectedRowId ? sorted.find((r) => r.id === selectedRowId) ?? null : null;
  const selectedRowFreqs = selectedRow ? getRowFreqs(selectedRow) : null;

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!results.populated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white text-center p-8">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <BarChart3 size={28} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-1">No Quotes Yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Configure your quote parameters in the left panel and click <strong>Get Quotes</strong> to
          generate insurance quotes from Australian providers.
        </p>
      </div>
    );
  }

  // ── Populated state ──────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-gray-50 flex-wrap">
          <button
            className={`text-xs px-2.5 py-1 rounded border font-medium transition-colors ${showGraphs ? 'bg-teal-700 text-white border-teal-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
            onClick={() => setShowGraphs(!showGraphs)}
          >
            All GRAPHS
          </button>
          <button
            type="button"
            className={`inline-flex items-center justify-center gap-1.5 text-xs h-7 px-3 rounded border font-semibold transition-colors ${showAll ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
            disabled={showAll}
            title={showAll ? 'Select a specific quote to compare features' : undefined}
            onClick={() => onViewCompareFeatures()}
          >
            <ExternalLink size={12} />
            VIEW / COMPARE FEATURES
          </button>
          <Button variant="outline" size="sm" className="text-xs h-7 gap-1.5">
            <Download size={12} />
            DOWNLOAD REPORT
          </Button>
          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product or insurer"
              className="pl-7 pr-3 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 w-52"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* ── Main table ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-gray-200">
                <th className="w-8 px-2 py-2">
                  <button
                    onClick={() => {
                      const target = !selectAll;
                      sorted.forEach((r) => { if (r.selected !== target) onToggleSelect(r.id); });
                    }}
                    className={`w-4 h-4 rounded-sm border flex items-center justify-center ${selectAll ? 'bg-teal-700 border-teal-700 text-white' : 'border-slate-300'}`}
                  >
                    {selectAll && <Check size={10} strokeWidth={3} />}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">
                  <button className="inline-flex items-center gap-1 hover:text-teal-700" onClick={() => toggleSort('insurer')}>
                    <ArrowUpDown size={11} />
                    Insurer
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">
                  <button className="inline-flex items-center gap-1 hover:text-teal-700" onClick={() => toggleSort('products')}>
                    <ArrowUpDown size={11} />
                    Products
                  </button>
                </th>
                <th className="px-3 py-2 text-xs font-semibold text-slate-600 text-right whitespace-nowrap">
                  <button className="inline-flex items-center gap-1 hover:text-teal-700" onClick={() => toggleSort('premium')}>
                    <ArrowUpDown size={11} />
                    Premiums
                  </button>
                </th>
                <th className="px-3 py-2 text-xs font-semibold text-slate-600 text-right">
                  <button className="inline-flex items-center gap-1 hover:text-teal-700" onClick={() => toggleSort('cumulativePremium')}>
                    <ArrowUpDown size={11} />
                    {projectionYears ? `${projectionYears}y ` : ''}Cumulative Premiums
                  </button>
                </th>
                <th className="px-3 py-2 text-xs font-semibold text-slate-600 text-center">
                  <button className="inline-flex items-center gap-1 hover:text-teal-700" onClick={() => toggleSort('featureScore')}>
                    <ArrowUpDown size={11} />
                    Feature Score
                  </button>
                </th>
                <th className="px-3 py-2 text-xs font-semibold text-slate-600 text-center">
                  <button className="inline-flex items-center gap-1 hover:text-teal-700" onClick={() => toggleSort('valueScore')}>
                    <ArrowUpDown size={11} />
                    Value Score
                  </button>
                </th>
                <th className="px-2 py-2 text-xs font-semibold text-slate-600 text-center whitespace-nowrap">Rec</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const quote = quotes[row.quoteIndex];
                return (
                  <ResultRow
                    key={row.id}
                    row={row}
                    isActive={selectedRowId === row.id}
                    validated={validatedRows[row.id] ?? null}
                    superFreq={(quote?.superFrequency ?? 'M') as PremiumFrequency}
                    nonSuperFreq={(quote?.nonSuperFrequency ?? 'M') as PremiumFrequency}
                    onToggleSelect={() => onToggleSelect(row.id)}
                    onSetRecommendation={(v) => onSetRecommendation(row.id, v)}
                    onSelectRow={() => setSelectedRowId(selectedRowId === row.id ? null : row.id)}
                  />
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={99} className="px-6 py-8 text-center text-muted-foreground">
                    No results match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Excluded products section ────────────────────────────────────── */}
        {visibleExcluded.length > 0 && (
          <div className="border-t border-gray-200">
            <button
              className="flex items-center gap-2 w-full px-6 py-2.5 bg-orange-50 hover:bg-orange-100 transition-colors text-left"
              onClick={() => setExcludedCollapsed(!excludedCollapsed)}
            >
              {excludedCollapsed ? <ChevronRight size={14} className="text-orange-600" /> : <ChevronDown size={14} className="text-orange-600" />}
              <span className="text-xs font-bold text-orange-800">
                EXCLUDED PRODUCTS ({visibleExcluded.length})
              </span>
            </button>
            {!excludedCollapsed && (
              <table className="w-full text-sm">
                <tbody>
                  {visibleExcluded.map((ex) => (
                    <ExcludedRow key={ex.id} item={ex} quoteRequestBody={quoteRequestBody} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>

      {/* ── Additional Information panel ────────────────────────────────── */}
      {selectedRow && selectedRowFreqs && (
        <AdditionalInfoPanel
          key={selectedRow.id}
          row={selectedRow}
          superFreq={selectedRowFreqs.superFreq}
          nonSuperFreq={selectedRowFreqs.nonSuperFreq}
          quoteRequestBody={quoteRequestBody}
          onClose={() => setSelectedRowId(null)}
          onValidated={(rowId, matched) => setValidatedRows((prev) => ({ ...prev, [rowId]: matched }))}
          initialValidated={validatedRows[selectedRow.id] ?? null}
          onRequoteWithOccupation={onRequoteWithOccupation}
          requotingOccupation={requotingOccupation}
        />
      )}
    </div>
  );
}

// ── Single result row ───────────────────────────────────────────────────────

function ResultRow({
  row,
  isActive,
  validated,
  superFreq,
  nonSuperFreq,
  onToggleSelect,
  onSetRecommendation,
  onSelectRow,
}: {
  row: QuoteResultRow;
  isActive: boolean;
  validated: boolean | null;
  superFreq: PremiumFrequency;
  nonSuperFreq: PremiumFrequency;
  onToggleSelect: () => void;
  onSetRecommendation: (value: 'rec' | 'alt' | null) => void;
  onSelectRow: () => void;
}) {
  const totalPremium = computePremiumTotal(row, superFreq, nonSuperFreq);
  const cumulativePremium = computeCumulativePremium(row, superFreq, nonSuperFreq);
  const superPrem = (row.premiumInsideSuper[superFreq] ?? 0) + (row.stampDutyInsideSuper[superFreq] ?? 0);
  const nonSuperPrem = (row.premiumOutsideSuper[nonSuperFreq] ?? 0) + (row.stampDutyOutsideSuper[nonSuperFreq] ?? 0);
  const hasBothSides = superPrem !== 0 && nonSuperPrem !== 0;
  const effectiveFreqLabel = superFreq === nonSuperFreq
    ? freqShort(superFreq)
    : hasBothSides
      ? 'Annualised'
      : freqShort(nonSuperPrem !== 0 ? nonSuperFreq : superFreq);

  return (
    <>
      <tr
        className={`border-b border-gray-100 hover:bg-slate-50/50 transition-colors cursor-pointer ${isActive ? 'bg-indigo-50/60 border-l-2 border-l-indigo-500' : row.selected ? 'bg-teal-50/40' : ''}`}
        onClick={onSelectRow}
      >
        {/* Checkbox */}
        <td className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onToggleSelect}
            className={`w-4 h-4 rounded-sm border flex items-center justify-center ${row.selected ? 'bg-teal-700 border-teal-700 text-white' : 'border-slate-300'}`}
          >
            {row.selected && <Check size={10} strokeWidth={3} />}
          </button>
        </td>

        {/* Insurer — logo only */}
        <td className="px-3 py-2.5">
          <InsurerLogo name={row.supplierName} logo={row.supplierLogo} />
        </td>

        {/* Products — portfolio + product names */}
        <td className="px-3 py-2.5 max-w-[280px]">
          <div className="flex flex-col">
            {row.existingCover && (
              <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full w-fit mb-0.5">
                EXISTING
              </span>
            )}
            {row.portfolioName && (
              <span className="text-xs text-teal-700 font-medium leading-tight">{row.portfolioName}</span>
            )}
            <span className="text-[10px] text-slate-500 leading-tight line-clamp-2">{row.products}</span>
          </div>
        </td>

        {/* Premiums */}
        <td className={`px-3 py-2.5 text-right ${validated === true ? 'text-emerald-700' : ''}`}>
          <div className={`font-semibold ${validated === true ? 'text-emerald-700' : 'text-slate-800'}`}>
            {validated === true && <Check size={12} className="inline mr-0.5 -mt-0.5" />}
            {fmt(totalPremium)}
          </div>
          <div className="text-[10px] text-slate-400">
            {effectiveFreqLabel}
          </div>
          {superPrem !== 0 && (
            <div className="text-[10px] text-slate-500 mt-0.5">
              Super ({freqShort(superFreq)}) {fmt(superPrem)}
            </div>
          )}
          {nonSuperPrem !== 0 && (
            <div className="text-[10px] text-slate-500">
              Non Super ({freqShort(nonSuperFreq)}) {fmt(nonSuperPrem)}
            </div>
          )}
        </td>

        {/* Cumulative Premiums */}
        <td className="px-3 py-2.5 text-right font-medium text-slate-700">
          {row.existingCover ? <span className="text-xs text-slate-400">N/A</span> : fmt(cumulativePremium)}
        </td>

        {/* Feature Score */}
        <td className="px-3 py-2.5 text-center">
          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold ${scoreColor(row.featureScore)}`}>
            {row.featureScore}
          </span>
        </td>

        {/* Value Score */}
        <td className="px-3 py-2.5 text-center">
          {row.existingCover
            ? <span className="text-xs text-slate-400">N/A</span>
            : (
              <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold ${scoreColor(row.valueScore)}`}>
                {row.valueScore}
              </span>
            )}
        </td>

        {/* Rec / Alt */}
        <td className="px-2 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
          {row.existingCover ? null : (
          <div className="flex items-center gap-1 justify-center">
            <button
              className={`px-2 py-0.5 text-[11px] font-medium rounded border transition-colors ${
                row.recommendation === 'rec'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-500 border-slate-300 hover:border-indigo-400'
              }`}
              onClick={() => onSetRecommendation(row.recommendation === 'rec' ? null : 'rec')}
            >
              Rec
            </button>
            <button
              className={`px-2 py-0.5 text-[11px] font-medium rounded border transition-colors ${
                row.recommendation === 'alt'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-500 border-slate-300 hover:border-indigo-400'
              }`}
              onClick={() => onSetRecommendation(row.recommendation === 'alt' ? null : 'alt')}
            >
              Alt
            </button>
          </div>
          )}
        </td>
      </tr>

    </>
  );
}
