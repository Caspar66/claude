import { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuoteResults, QuoteResultRow, ExcludedProduct } from './quoteResultsData';
import { computePremiumTotal, computeCumulativePremium } from './quoteResultsData';
import type { PremiumFrequency } from './insuranceData';
import { PREMIUM_FREQUENCY_LABELS } from './insuranceData';
import type { NeedsQuote } from './needsTypes';
import { ExclusionReasonsModal } from './ExclusionReasonsModal';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 });
}

function scoreColor(score: number): string {
  if (score > 80) return 'bg-emerald-100 text-emerald-800';
  if (score >= 50) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-700';
}

type SortField = 'premium' | 'cumulativePremium' | 'featureScore' | 'valueScore';

function freqLabel(code: PremiumFrequency): string {
  return PREMIUM_FREQUENCY_LABELS[code];
}

// ── Insurer logo ─────────────────────────────────────────────────────────────

function InsurerLogo({ name, logo }: { name: string; logo?: string }) {
  const [loadFailed, setLoadFailed] = useState(false);

  if (logo && !loadFailed) {
    return (
      <img
        src={logo}
        alt={name}
        className="w-10 h-10 object-contain bg-white border border-gray-200 rounded"
        onError={() => setLoadFailed(true)}
      />
    );
  }

  const initials = name.replace(/[^A-Z]/g, '').slice(0, 3) || name.slice(0, 3).toUpperCase();
  return (
    <div className="w-10 h-10 flex items-center justify-center rounded border border-gray-200 bg-slate-100" aria-label={name}>
      <span className="font-bold text-xs text-slate-600">{initials}</span>
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
  activeQuoteIndex: number | null;
  activeClient: 'client' | 'partner';
  quotes: NeedsQuote[];
  quoteRequestBody: Record<string, unknown>;
  onToggleSelect: (id: string) => void;
  onCompareProducts: () => void;
  onViewCompareFeatures: () => void;
}

export function QuoteResultsPanel({ results, activeQuoteIndex, activeClient, quotes, quoteRequestBody, onToggleSelect, onCompareProducts, onViewCompareFeatures }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('premium');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [excludedCollapsed, setExcludedCollapsed] = useState(true);
  const [showGraphs, setShowGraphs] = useState(false);
  const [showOccRating, setShowOccRating] = useState(false);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  }

  function toggleExpand(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getRowFreqs(row: QuoteResultRow): { superFreq: PremiumFrequency; nonSuperFreq: PremiumFrequency } {
    const q = quotes[row.quoteIndex];
    return {
      superFreq: (q?.superFrequency ?? 'M') as PremiumFrequency,
      nonSuperFreq: (q?.nonSuperFrequency ?? 'M') as PremiumFrequency,
    };
  }

  function getSortValue(row: QuoteResultRow, field: SortField): number {
    const { superFreq, nonSuperFreq } = getRowFreqs(row);
    switch (field) {
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

  // Filter by specific quote or all quotes for the active client
  const visibleRows = activeQuoteIndex !== null
    ? results.rows.filter((r) => r.quoteIndex === activeQuoteIndex)
    : results.rows.filter((r) => clientQuoteIndices.has(r.quoteIndex));
  const visibleExcluded = activeQuoteIndex !== null
    ? results.excluded.filter((e) => e.quoteIndex === activeQuoteIndex)
    : results.excluded.filter((e) => clientQuoteIndices.has(e.quoteIndex));

  const filtered = visibleRows.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return r.supplierName.toLowerCase().includes(term) || r.products.toLowerCase().includes(term);
  });

  // Sort — existing cover rows always at the bottom
  const quoteRows = filtered.filter((r) => !r.existingCover);
  const existingRows = filtered.filter((r) => r.existingCover);

  quoteRows.sort((a, b) => {
    const aVal = getSortValue(a, sortField);
    const bVal = getSortValue(b, sortField);
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });
  existingRows.sort((a, b) => {
    const aVal = getSortValue(a, sortField);
    const bVal = getSortValue(b, sortField);
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const sorted = [...quoteRows, ...existingRows];

  const selectAll = sorted.length > 0 && sorted.every((r) => r.selected);

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
          className={`text-xs px-2.5 py-1 rounded border font-medium transition-colors ${showOccRating ? 'bg-teal-700 text-white border-teal-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
          onClick={() => setShowOccRating(!showOccRating)}
        >
          Occupation Rating
        </button>

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
              <th className="w-6 px-1 py-2" />
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Insurer</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Products</th>
              <th className="px-3 py-2 text-xs font-semibold text-slate-600 text-right whitespace-nowrap">
                <button className="inline-flex items-center gap-1 hover:text-teal-700" onClick={() => toggleSort('premium')}>
                  <ArrowUpDown size={11} />
                  Premiums
                </button>
              </th>
              <th className="px-3 py-2 text-xs font-semibold text-slate-600 text-right whitespace-nowrap">
                <button className="inline-flex items-center gap-1 hover:text-teal-700" onClick={() => toggleSort('cumulativePremium')}>
                  <ArrowUpDown size={11} />
                  Cumulative Premiums
                </button>
              </th>
              <th className="px-3 py-2 text-xs font-semibold text-slate-600 text-center whitespace-nowrap">
                <button className="inline-flex items-center gap-1 hover:text-teal-700" onClick={() => toggleSort('featureScore')}>
                  <ArrowUpDown size={11} />
                  Feature Score
                </button>
              </th>
              <th className="px-3 py-2 text-xs font-semibold text-slate-600 text-center whitespace-nowrap">
                <button className="inline-flex items-center gap-1 hover:text-teal-700" onClick={() => toggleSort('valueScore')}>
                  <ArrowUpDown size={11} />
                  Value Score
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const quote = quotes[row.quoteIndex];
              return (
                <ResultRow
                  key={row.id}
                  row={row}
                  expanded={expandedRows.has(row.id)}
                  superFreq={(quote?.superFrequency ?? 'M') as PremiumFrequency}
                  nonSuperFreq={(quote?.nonSuperFrequency ?? 'M') as PremiumFrequency}
                  onToggleSelect={() => onToggleSelect(row.id)}
                  onToggleExpand={() => toggleExpand(row.id)}
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

      {/* ── Bottom actions ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-200 bg-gray-50">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7 gap-1.5"
          onClick={onViewCompareFeatures}
        >
          <ExternalLink size={12} />
          VIEW / COMPARE FEATURES
        </Button>
        <Button variant="outline" size="sm" className="text-xs h-7 gap-1.5">
          <Download size={12} />
          DOWNLOAD REPORT
        </Button>
        <Button
          size="sm"
          className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-7 gap-1.5"
          onClick={onCompareProducts}
        >
          <FileText size={12} />
          Compare Products
        </Button>
      </div>
    </div>
  );
}

// ── Single result row ───────────────────────────────────────────────────────

function ResultRow({
  row,
  expanded,
  superFreq,
  nonSuperFreq,
  onToggleSelect,
  onToggleExpand,
}: {
  row: QuoteResultRow;
  expanded: boolean;
  superFreq: PremiumFrequency;
  nonSuperFreq: PremiumFrequency;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
}) {
  const totalPremium = computePremiumTotal(row, superFreq, nonSuperFreq);
  const cumulativePremium = computeCumulativePremium(row, superFreq, nonSuperFreq);
  const sameFreq = superFreq === nonSuperFreq;
  const superPrem = (row.premiumInsideSuper[superFreq] ?? 0) + (row.stampDutyInsideSuper[superFreq] ?? 0);
  const nonSuperPrem = (row.premiumOutsideSuper[nonSuperFreq] ?? 0) + (row.stampDutyOutsideSuper[nonSuperFreq] ?? 0);

  return (
    <>
      <tr className={`border-b border-gray-100 hover:bg-slate-50/50 transition-colors ${row.selected ? 'bg-teal-50/40' : ''}`}>
        {/* Checkbox */}
        <td className="px-2 py-2.5">
          <button
            onClick={onToggleSelect}
            className={`w-4 h-4 rounded-sm border flex items-center justify-center ${row.selected ? 'bg-teal-700 border-teal-700 text-white' : 'border-slate-300'}`}
          >
            {row.selected && <Check size={10} strokeWidth={3} />}
          </button>
        </td>

        {/* Expand toggle */}
        <td className="px-1 py-2.5">
          <button onClick={onToggleExpand} className="text-slate-400 hover:text-slate-700">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </td>

        {/* Insurer — supplier logo + name + portfolio name */}
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            <InsurerLogo name={row.supplierName} logo={row.supplierLogo} />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-800">{row.supplierName}</span>
                {row.existingCover && (
                  <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                    EXISTING
                  </span>
                )}
              </div>
              {row.portfolioName && (
                <span className="text-[10px] text-slate-500 leading-tight">{row.portfolioName}</span>
              )}
            </div>
          </div>
        </td>

        {/* Products */}
        <td className="px-3 py-2.5 max-w-[260px]">
          <span className="text-xs text-slate-700 leading-tight line-clamp-2">{row.products}</span>
        </td>

        {/* Premiums */}
        <td className="px-3 py-2.5 text-right">
          <div className="font-semibold text-slate-800">{fmt(totalPremium)}</div>
          <div className="text-[10px] text-slate-400">
            {sameFreq ? freqLabel(superFreq) : 'Annualised'}
          </div>
          {superPrem !== 0 && (
            <div className="text-[10px] text-slate-500 mt-0.5">
              Super ({freqLabel(superFreq)}) {fmt(superPrem)}
            </div>
          )}
          {nonSuperPrem !== 0 && (
            <div className="text-[10px] text-slate-500">
              Non Super ({freqLabel(nonSuperFreq)}) {fmt(nonSuperPrem)}
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
      </tr>

      {/* Expanded detail placeholder */}
      {expanded && (
        <tr className="bg-slate-50">
          <td colSpan={99} className="px-6 py-3">
            <div className="text-xs text-slate-500">
              Premium detail breakdown will appear here once the API response format is fully mapped.
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
