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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { QuoteResults, QuoteResultRow, ExcludedProduct } from './quoteResultsData';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 });
}

function scoreColor(score: number): string {
  if (score >= 85) return 'bg-emerald-100 text-emerald-800';
  if (score >= 70) return 'bg-green-100 text-green-700';
  if (score >= 55) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-700';
}

type SortField = 'annualPremium' | 'fifteenYearPremium' | 'featureScore' | 'valueScore';
type PremiumFreq = 'Weekly' | 'Fortnightly' | 'Monthly' | 'Quarterly' | 'Half Yearly' | 'Yearly';

const PREMIUM_FREQ_OPTIONS: PremiumFreq[] = [
  'Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly',
];

const FREQ_MULTIPLIER: Record<PremiumFreq, number> = {
  Weekly: 1 / 52,
  Fortnightly: 1 / 26,
  Monthly: 1 / 12,
  Quarterly: 1 / 4,
  'Half Yearly': 1 / 2,
  Yearly: 1,
};

// ── Toggle filter columns ────────────────────────────────────────────────────

type FilterColumn = 'lifeTpdDouble' | 'tpdOwnership';
const FILTER_LABELS: Record<FilterColumn, string> = {
  lifeTpdDouble: 'Life TPD Extension Double',
  tpdOwnership: 'TPD Ownership',
};

// ── Expanded breakdown row ───────────────────────────────────────────────────

function BreakdownRow({ row }: { row: QuoteResultRow }) {
  const b = row.premiumBreakdown;
  const c = row.commission;
  return (
    <tr className="bg-slate-50">
      <td colSpan={99} className="px-6 py-3">
        <div className="grid grid-cols-2 gap-6">
          {/* Premium breakdown */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2">Premium Breakdown (Annual)</h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-1 font-semibold text-slate-500">Cover</th>
                  <th className="text-right py-1 font-semibold text-slate-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-1 text-slate-700">Life</td>
                  <td className="py-1 text-right text-slate-800">{fmt(b.life)}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1 text-slate-700">TPD Extension</td>
                  <td className="py-1 text-right text-slate-800">{fmt(b.tpdExt)}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1 text-slate-700">Trauma Extension</td>
                  <td className="py-1 text-right text-slate-800">{fmt(b.traumaExt)}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1 text-slate-700">Income Protection</td>
                  <td className="py-1 text-right text-slate-800">{fmt(b.incomeProtection)}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1 text-slate-700">Policy Fee</td>
                  <td className="py-1 text-right text-slate-800">{fmt(b.policyFee)}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1 text-slate-700">Stamp Duty</td>
                  <td className="py-1 text-right text-slate-800">{fmt(b.stampDuty)}</td>
                </tr>
                <tr className="font-semibold">
                  <td className="py-1.5 text-slate-800">Total</td>
                  <td className="py-1.5 text-right text-slate-900">{fmt(row.annualPremium)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Commission breakdown */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2">Commission</h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-1 font-semibold text-slate-500">Type</th>
                  <th className="text-right py-1 font-semibold text-slate-500">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-1 text-slate-700">P100 Upfront</td>
                  <td className="py-1 text-right text-slate-800">{c.p100Upfront}%</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1 text-slate-700">Upfront Amount</td>
                  <td className="py-1 text-right text-slate-800">{fmt(c.upfrontAmount)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-700">Ongoing Amount</td>
                  <td className="py-1 text-right text-slate-800">{fmt(c.ongoingAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Insurer logo ─────────────────────────────────────────────────────────────

function InsurerLogo({ row }: { row: QuoteResultRow }) {
  const [loadFailed, setLoadFailed] = useState(false);

  if (row.insurerLogo && !loadFailed) {
    return (
      <img
        src={row.insurerLogo}
        alt={row.insurer}
        className="w-10 h-10 object-contain bg-white border border-gray-200 rounded"
        onError={() => setLoadFailed(true)}
      />
    );
  }

  // Fallback: initials on a coloured tile mirroring insurerColor
  const initials = row.insurerShort.slice(0, 3).toUpperCase();
  const bgClass = row.insurerColor
    ? row.insurerColor.replace('text-', 'bg-').replace(/-(\d+)/, (_m, d) => `-${Math.max(50, parseInt(d, 10) - 500)}`)
    : 'bg-slate-100';
  return (
    <div
      className={`w-10 h-10 flex items-center justify-center rounded border border-gray-200 ${bgClass}`}
      aria-label={row.insurer}
    >
      <span className={`font-bold text-xs ${row.insurerColor}`}>{initials}</span>
    </div>
  );
}

// ── Excluded product row ─────────────────────────────────────────────────────

function ExcludedRow({ item }: { item: ExcludedProduct }) {
  const [showReasons, setShowReasons] = useState(false);
  return (
    <>
      <tr className="border-b border-gray-100">
        <td className="px-6 py-2 text-sm font-medium text-slate-700">{item.insurer}</td>
        <td className="px-4 py-2 text-right">
          <button
            className="text-xs text-blue-600 hover:underline mr-4"
            onClick={() => setShowReasons(!showReasons)}
          >
            Reasons For Exclusion
          </button>
          <button className="text-xs text-blue-600 hover:underline">PDS</button>
        </td>
      </tr>
      {showReasons && (
        <tr className="bg-orange-50/50">
          <td colSpan={2} className="px-8 py-2">
            {item.reasons.map((r, i) => (
              <div key={i} className="text-xs text-orange-800 py-0.5">{r}</div>
            ))}
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  results: QuoteResults;
  onToggleSelect: (id: string) => void;
  onCompareProducts: () => void;
}

export function QuoteResultsPanel({ results, onToggleSelect, onCompareProducts }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [superFreq, setSuperFreq] = useState<PremiumFreq>('Monthly');
  const [nonSuperFreq, setNonSuperFreq] = useState<PremiumFreq>('Monthly');
  const [sortField, setSortField] = useState<SortField>('annualPremium');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [visibleFilters, setVisibleFilters] = useState<Set<FilterColumn>>(new Set());
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

  function toggleFilter(col: FilterColumn) {
    setVisibleFilters((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  }

  // Filter
  const filtered = results.rows.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return r.insurer.toLowerCase().includes(term) || r.product.toLowerCase().includes(term);
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const superMult = FREQ_MULTIPLIER[superFreq];
  const nonSuperMult = FREQ_MULTIPLIER[nonSuperFreq];

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
          Configure your quote parameters in the left panel and click <strong>Update Quotes</strong> to
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
        {/* Toggle buttons */}
        <button
          className={`text-xs px-2.5 py-1 rounded border font-medium transition-colors ${showGraphs ? 'bg-teal-700 text-white border-teal-700' : 'bg-white border-gray-300 text-slate-600 hover:bg-gray-50'}`}
          onClick={() => setShowGraphs(!showGraphs)}
        >
          All GRAPHS
        </button>
        <button
          className={`text-xs px-2.5 py-1 rounded border font-medium transition-colors ${showOccRating ? 'bg-teal-700 text-white border-teal-700' : 'bg-white border-gray-300 text-slate-600 hover:bg-gray-50'}`}
          onClick={() => setShowOccRating(!showOccRating)}
        >
          Occupation Rating
        </button>

        {/* Filter column toggles */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs gap-1 h-7">
              Columns <ChevronDown size={10} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {(Object.entries(FILTER_LABELS) as [FilterColumn, string][]).map(([key, label]) => (
              <DropdownMenuItem key={key} onClick={(e) => { e.preventDefault(); toggleFilter(key); }} className="gap-2">
                <div className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${visibleFilters.has(key) ? 'bg-teal-600 border-teal-600 text-white' : 'border-gray-300'}`}>
                  {visibleFilters.has(key) && <Check size={10} strokeWidth={3} />}
                </div>
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />

        {/* Super premium frequency */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs gap-1 h-7">
              Super {superFreq} <ChevronDown size={10} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {PREMIUM_FREQ_OPTIONS.map((opt) => (
              <DropdownMenuItem key={opt} onClick={() => setSuperFreq(opt)}>{opt}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Non-Super premium frequency */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs gap-1 h-7">
              Non-Super {nonSuperFreq} <ChevronDown size={10} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {PREMIUM_FREQ_OPTIONS.map((opt) => (
              <DropdownMenuItem key={opt} onClick={() => setNonSuperFreq(opt)}>{opt}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product or insurer"
            className="pl-7 pr-3 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 w-52"
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
                  className={`w-4 h-4 rounded-sm border flex items-center justify-center ${selectAll ? 'bg-teal-600 border-teal-600 text-white' : 'border-gray-300'}`}
                >
                  {selectAll && <Check size={10} strokeWidth={3} />}
                </button>
              </th>
              <th className="w-6 px-1 py-2" /> {/* expand toggle */}
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Insurer</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Products</th>
              {visibleFilters.has('lifeTpdDouble') && (
                <th className="px-3 py-2 text-xs font-semibold text-slate-600 text-center whitespace-nowrap">
                  Life TPD Ext Double
                </th>
              )}
              {visibleFilters.has('tpdOwnership') && (
                <th className="px-3 py-2 text-xs font-semibold text-slate-600 text-center">TPD Ownership</th>
              )}
              <th className="px-3 py-2 text-xs font-semibold text-slate-600 text-right whitespace-nowrap">
                <button className="inline-flex items-center gap-1 hover:text-teal-700" onClick={() => toggleSort('annualPremium')}>
                  <ArrowUpDown size={11} />
                  Premiums
                </button>
              </th>
              <th className="px-3 py-2 text-xs font-semibold text-slate-600 text-right whitespace-nowrap">
                <button className="inline-flex items-center gap-1 hover:text-teal-700" onClick={() => toggleSort('fifteenYearPremium')}>
                  <ArrowUpDown size={11} />
                  15 Yr Premiums
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
              const expanded = expandedRows.has(row.id);
              return (
                <ResultRowGroup
                  key={row.id}
                  row={row}
                  expanded={expanded}
                  superMult={superMult}
                  nonSuperMult={nonSuperMult}
                  superFreq={superFreq}
                  nonSuperFreq={nonSuperFreq}
                  visibleFilters={visibleFilters}
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
      {results.excluded.length > 0 && (
        <div className="border-t border-gray-200">
          <button
            className="flex items-center gap-2 w-full px-6 py-2.5 bg-orange-50 hover:bg-orange-100 transition-colors text-left"
            onClick={() => setExcludedCollapsed(!excludedCollapsed)}
          >
            {excludedCollapsed ? <ChevronRight size={14} className="text-orange-600" /> : <ChevronDown size={14} className="text-orange-600" />}
            <span className="text-xs font-bold text-orange-800">
              EXCLUDED PRODUCTS ({results.excluded.length})
            </span>
          </button>
          {!excludedCollapsed && (
            <table className="w-full text-sm">
              <tbody>
                {results.excluded.map((ex) => (
                  <ExcludedRow key={ex.id} item={ex} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Bottom actions ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-200 bg-gray-50">
        <Button variant="outline" size="sm" className="text-xs h-7 gap-1.5">
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

// ── Single result row + optional breakdown ───────────────────────────────────

function ResultRowGroup({
  row,
  expanded,
  superMult,
  nonSuperMult,
  superFreq,
  nonSuperFreq,
  visibleFilters,
  onToggleSelect,
  onToggleExpand,
}: {
  row: QuoteResultRow;
  expanded: boolean;
  superMult: number;
  nonSuperMult: number;
  superFreq: PremiumFreq;
  nonSuperFreq: PremiumFreq;
  visibleFilters: Set<FilterColumn>;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
}) {
  const superAmt = row.superAmount * superMult;
  const nonSuperAmt = row.nonSuperAmount * nonSuperMult;
  const total = superAmt + nonSuperAmt;

  return (
    <>
      <tr className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${row.selected ? 'bg-teal-50/40' : ''}`}>
        {/* Checkbox */}
        <td className="px-2 py-2.5">
          <button
            onClick={onToggleSelect}
            className={`w-4 h-4 rounded-sm border flex items-center justify-center ${row.selected ? 'bg-teal-600 border-teal-600 text-white' : 'border-gray-300'}`}
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

        {/* Insurer + logo badge */}
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            <InsurerLogo row={row} />
            <div className="flex flex-col">
              <span className={`font-bold text-sm ${row.insurerColor}`}>{row.insurerShort}</span>
              <span className="text-[10px] text-slate-500 leading-tight">{row.insurer}</span>
            </div>
          </div>
        </td>

        {/* Products */}
        <td className="px-3 py-2.5 max-w-[260px]">
          <span className="text-xs text-slate-700 leading-tight line-clamp-2">{row.product}</span>
        </td>

        {/* Optional filter columns */}
        {visibleFilters.has('lifeTpdDouble') && (
          <td className="px-3 py-2.5 text-center text-xs text-slate-700">{row.lifeTpdDouble}</td>
        )}
        {visibleFilters.has('tpdOwnership') && (
          <td className="px-3 py-2.5 text-center text-xs text-slate-700">{row.tpdOwnership}</td>
        )}

        {/* Premiums — separate super / non-super lines using independent frequencies */}
        <td className="px-3 py-2.5 text-right">
          <div className="font-semibold text-slate-800">{fmt(total)}</div>
          {superAmt > 0 && (
            <div className="text-[10px] text-blue-600">Super ({superFreq}): {fmt(superAmt)}</div>
          )}
          {nonSuperAmt > 0 && (
            <div className="text-[10px] text-slate-500">Non-Super ({nonSuperFreq}): {fmt(nonSuperAmt)}</div>
          )}
        </td>

        {/* 15 Year Premiums */}
        <td className="px-3 py-2.5 text-right font-medium text-slate-700">
          {fmt(row.fifteenYearPremium)}
        </td>

        {/* Feature Score */}
        <td className="px-3 py-2.5 text-center">
          <div className="flex flex-col items-center gap-0.5">
            <button className="text-[10px] text-blue-600 hover:underline">Check Premium</button>
            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold ${scoreColor(row.featureScore)}`}>
              {row.featureScore}
            </span>
          </div>
        </td>

        {/* Value Score */}
        <td className="px-3 py-2.5 text-center">
          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold ${scoreColor(row.valueScore)}`}>
            {row.valueScore}
          </span>
        </td>
      </tr>

      {/* Expanded breakdown */}
      {expanded && <BreakdownRow row={row} />}
    </>
  );
}
