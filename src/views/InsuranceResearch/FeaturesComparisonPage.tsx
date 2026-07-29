import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Download, ArrowLeft, ChevronDown, ChevronRight, SlidersHorizontal, Check, X, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { postQuotePortfolioFeatures } from '@/services/omnilifeApi';
import type { QuoteResultRow } from './quoteResultsData';
import { computePremiumTotal } from './quoteResultsData';
import type { PremiumFrequency } from './insuranceData';
import { PREMIUM_FREQUENCY_LABELS } from './insuranceData';

// ── Constants ──────────────────────────────────────────────────────────────

const NEED_TYPE_ORDER = ['TRM', 'TPE', 'TRE', 'TPS', 'TRS', 'TPR', 'INC', 'BUS', 'NES', 'CHT'];

const NEED_TYPE_LABELS: Record<string, string> = {
  TRM: 'Life',
  TPE: 'TPD Extension to Life',
  TRE: 'Trauma Extension to Life',
  TPS: 'TPD Standalone',
  TRS: 'Trauma Standalone',
  TPR: 'TPD Extension to Trauma',
  INC: 'Income Protection',
  BUS: 'Business Expenses',
  NES: 'Needle Stick',
  CHT: 'Child Trauma',
};

const WEIGHTING_LABELS: Record<number, string> = {
  1: 'Lowest',
  2: 'Low',
  3: 'Moderate',
  4: 'High',
  5: 'Highest',
};

const EXCLUDED_HEADING_NAMES = ['Product Name', 'Date of PDS or SPDS', 'Product cover types'];

// ── Types ──────────────────────────────────────────────────────────────────

interface FeatureValue {
  text: string;
  hasFeature: boolean;
  score?: number;
  scoreRaw?: number;
  strengths?: string;
  limitations?: string;
  commentary?: string;
}

interface ParsedFeature {
  key: string;
  name: string;
  values: FeatureValue[];
}

interface ParsedHeading {
  key: string;
  name: string;
  needType: string;
  category: string;
  ipsAdjustedWeighting: number;
  features: ParsedFeature[];
}

interface ParsedNeedGroup {
  needType: string;
  label: string;
  headings: ParsedHeading[];
}

interface ComparisonColumn {
  row: QuoteResultRow;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function scoreBg(score: number): string {
  if (score >= 85) return 'bg-emerald-100 text-emerald-800';
  if (score >= 70) return 'bg-green-50 text-green-700';
  if (score >= 55) return 'bg-yellow-50 text-yellow-800';
  if (score >= 40) return 'bg-orange-50 text-orange-700';
  return 'bg-red-50 text-red-700';
}

function fmt(n: number) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function asStr(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function asNum(v: unknown): number {
  return typeof v === 'number' ? v : 0;
}

const FREQ_SHORT_LABELS: Record<string, string> = {
  Y: 'p.a.', H: 'p.h.y.', Q: 'p.q.', M: 'p.m.', F: 'p.f.', W: 'p.w.',
};

// ── Parse response ─────────────────────────────────────────────────────────

interface ParseResult {
  headings: ParsedHeading[];
  pdsDateValues: string[];
}

function parseFeatureResponse(raw: unknown): ParseResult {
  if (!Array.isArray(raw)) return { headings: [], pdsDateValues: [] };

  const headingMap = new Map<string, { name: string; needType: string; category: string; ipsAdjustedWeighting: number; features: ParsedFeature[] }>();
  let pdsDateValues: string[] = [];
  let pdsDateCaptured = false;

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const entry = item as Record<string, unknown>;

    const headingObj = (entry.heading ?? {}) as Record<string, unknown>;
    const headingCode = asStr(headingObj.code) || asStr(headingObj.name) || 'UNKNOWN';
    const headingName = asStr(headingObj.name) || headingCode;
    const needType = asStr(headingObj.needType) || asStr(headingObj.coverType) || 'OTHER';
    const category = asStr(headingObj.category) || 'Other';
    const ipsAdjustedWeighting = asNum(headingObj.ipsAdjustedWeighting);

    if (headingCode === 'PORTFOLIO_HEADING') continue;

    if (headingCode === 'ALL_PDS_DATE' && !pdsDateCaptured) {
      const portfolios = Array.isArray(entry.features) ? entry.features : [];
      pdsDateValues = portfolios.map((p: unknown) => {
        if (!p || typeof p !== 'object') return '';
        return asStr((p as Record<string, unknown>).text);
      });
      pdsDateCaptured = true;
    }

    const featureObj = (entry.feature ?? {}) as Record<string, unknown>;
    const featureName = asStr(featureObj.name) || asStr(featureObj.code) || asStr(entry.name) || headingName;

    const portfolios = Array.isArray(entry.features) ? entry.features : [];
    const values: FeatureValue[] = portfolios.map((p: unknown) => {
      if (!p || typeof p !== 'object') return { text: '', hasFeature: false };
      const pf = p as Record<string, unknown>;
      const scoreObj = (pf.score && typeof pf.score === 'object') ? pf.score as Record<string, unknown> : null;
      return {
        text: asStr(pf.text) || asStr(pf.value) || '',
        hasFeature: pf.hasFeature === true,
        score: typeof pf.weighting === 'number' && pf.weighting > 0 ? pf.weighting : undefined,
        scoreRaw: scoreObj && typeof scoreObj.raw === 'number' ? scoreObj.raw : undefined,
        strengths: asStr(pf.strengths) || undefined,
        limitations: asStr(pf.limitations) || undefined,
        commentary: asStr(pf.commentary) || undefined,
      };
    });

    const mapKey = `${needType}::${headingCode}`;
    if (!headingMap.has(mapKey)) {
      headingMap.set(mapKey, { name: headingName, needType, category, ipsAdjustedWeighting, features: [] });
    }
    headingMap.get(mapKey)!.features.push({
      key: `${needType}_${headingCode}_${featureName}`,
      name: featureName,
      values,
    });
  }

  const headings: ParsedHeading[] = [];
  for (const [, { name, needType, category, ipsAdjustedWeighting, features }] of headingMap) {
    if (EXCLUDED_HEADING_NAMES.includes(name)) continue;
    headings.push({ key: `${needType}_${name}`, name, needType, category, ipsAdjustedWeighting, features });
  }
  return { headings, pdsDateValues };
}

function groupByNeedType(headings: ParsedHeading[]): ParsedNeedGroup[] {
  const groups = new Map<string, ParsedHeading[]>();
  for (const h of headings) {
    if (!groups.has(h.needType)) groups.set(h.needType, []);
    groups.get(h.needType)!.push(h);
  }

  const result: ParsedNeedGroup[] = [];
  for (const nt of NEED_TYPE_ORDER) {
    if (groups.has(nt)) {
      result.push({ needType: nt, label: NEED_TYPE_LABELS[nt] ?? nt, headings: groups.get(nt)! });
      groups.delete(nt);
    }
  }
  for (const [nt, hdgs] of groups) {
    result.push({ needType: nt, label: NEED_TYPE_LABELS[nt] ?? nt, headings: hdgs });
  }
  return result;
}

// ── Filter state ───────────────────────────────────────────────────────────

interface ComparisonFilters {
  featureText: boolean;
  differencesOnly: boolean;
  featureScore: boolean;
  showProfileFeatures: boolean;
  showBenefitFeatures: boolean;
  showDefinitionFeatures: boolean;
  enabledCategories: Set<string>;
}

// ── Insurer logo ───────────────────────────────────────────────────────────

function InsurerLogo({ name, logo }: { name: string; logo?: string }) {
  const [loadFailed, setLoadFailed] = useState(false);

  if (logo && !loadFailed) {
    return (
      <img
        src={logo}
        alt={name}
        className="object-contain"
        style={{ width: 100, height: 57 }}
        onError={() => setLoadFailed(true)}
      />
    );
  }

  const initials = name.replace(/[^A-Z]/g, '').slice(0, 3) || name.slice(0, 3).toUpperCase();
  return (
    <div className="flex items-center justify-center rounded border border-gray-200 bg-slate-100" style={{ width: 100, height: 57 }} aria-label={name}>
      <span className="font-bold text-lg text-slate-600">{initials}</span>
    </div>
  );
}

// ── Filters panel ──────────────────────────────────────────────────────────

function FiltersPanel({
  open, filters, allKeys, categoryNames, onChange, onClose, onDone, onReset,
}: {
  open: boolean; filters: ComparisonFilters; allKeys: string[]; categoryNames: Record<string, string>;
  onChange: (f: ComparisonFilters) => void; onClose: () => void; onDone: () => void; onReset: () => void;
}) {
  const [catSearch, setCatSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;

  function toggleCat(key: string) {
    const next = new Set(filters.enabledCategories);
    if (next.has(key)) next.delete(key); else next.add(key);
    onChange({ ...filters, enabledCategories: next });
  }

  const filteredCats = catSearch
    ? allKeys.filter((k) => (categoryNames[k] ?? k).toLowerCase().includes(catSearch.toLowerCase()))
    : allKeys;
  const allChecked = allKeys.every((k) => filters.enabledCategories.has(k));

  return (
    <div ref={ref} className="absolute right-0 top-0 bottom-0 w-[320px] bg-white border-l border-gray-200 shadow-xl z-30 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-slate-50">
        <h3 className="text-sm font-bold text-slate-800">Comparison Filters</h3>
        <button className="text-slate-400 hover:text-slate-600" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <div className="space-y-2">
          <FilterToggle label="Feature Text" value={filters.featureText} onChange={(v) => onChange({ ...filters, featureText: v })} />
          <FilterToggle label="Differences Only" value={filters.differencesOnly} onChange={(v) => onChange({ ...filters, differencesOnly: v })} />
          <FilterToggle label="Feature Score" value={filters.featureScore} onChange={(v) => onChange({ ...filters, featureScore: v })} />
        </div>
        <div className="space-y-2 pt-1 border-t border-gray-200">
          <label className="text-xs font-semibold text-slate-700 block">Feature Types</label>
          <FilterChk label="Show profile features" checked={filters.showProfileFeatures} onChange={() => onChange({ ...filters, showProfileFeatures: !filters.showProfileFeatures })} />
          <FilterChk label="Show benefit features" checked={filters.showBenefitFeatures} onChange={() => onChange({ ...filters, showBenefitFeatures: !filters.showBenefitFeatures })} />
          <FilterChk label="Show definition features" checked={filters.showDefinitionFeatures} onChange={() => onChange({ ...filters, showDefinitionFeatures: !filters.showDefinitionFeatures })} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">Categories</label>
          <div className="relative mb-2">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search categories..." className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-teal-400" value={catSearch} onChange={(e) => setCatSearch(e.target.value)} />
          </div>
          <div className="space-y-0.5 max-h-[240px] overflow-y-auto border border-gray-200 rounded p-2">
            {!catSearch && (
              <FilterChk label="Select All" checked={allChecked} onChange={() => onChange({ ...filters, enabledCategories: allChecked ? new Set<string>() : new Set(allKeys) })} bold />
            )}
            {filteredCats.map((key) => (
              <FilterChk key={key} label={categoryNames[key] ?? key} checked={filters.enabledCategories.has(key)} onChange={() => toggleCat(key)} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-200 bg-gray-50">
        <Button variant="outline" size="sm" className="text-xs h-7" onClick={onReset}>Reset</Button>
        <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-7" onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}

function FilterChk({ label, checked, onChange, bold }: { label: string; checked: boolean; onChange: () => void; bold?: boolean }) {
  return (
    <button className="flex items-center gap-2 py-0.5 w-full text-left" onClick={onChange}>
      <div className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${checked ? 'bg-teal-700 border-teal-700 text-white' : 'border-slate-300 bg-white'}`}>
        {checked && <Check size={10} strokeWidth={3} />}
      </div>
      <span className={`text-xs ${bold ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>{label}</span>
    </button>
  );
}

function FilterToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-600">{label}</span>
      <div className="flex rounded border border-slate-300 overflow-hidden">
        <button className={`px-2.5 py-0.5 text-[11px] font-medium ${!value ? 'bg-slate-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`} onClick={() => onChange(false)}>NO</button>
        <button className={`px-2.5 py-0.5 text-[11px] font-medium ${value ? 'bg-teal-700 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`} onClick={() => onChange(true)}>YES</button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

interface Props {
  selectedRows: QuoteResultRow[];
  quoteRequestBody: Record<string, unknown>;
  activeQuoteIndex: number | null;
  onBack: () => void;
}

export function FeaturesComparisonPage({ selectedRows, quoteRequestBody, activeQuoteIndex, onBack }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedNeedTypes, setCollapsedNeedTypes] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [headings, setHeadings] = useState<ParsedHeading[]>([]);
  const [pdsDateValues, setPdsDateValues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfExporting, setPdfExporting] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const columns: ComparisonColumn[] = selectedRows.map((row) => ({ row }));
  const settingsFreq = ((quoteRequestBody?.settings as Record<string, unknown> | undefined)?.frequency as string) || 'M';
  const premiumFreq = (settingsFreq as PremiumFrequency) || 'M';
  const freqSuffix = FREQ_SHORT_LABELS[premiumFreq] ?? PREMIUM_FREQUENCY_LABELS[premiumFreq] ?? 'p.a.';

  const allCategoryKeys = useMemo(() => headings.map((h) => h.key), [headings]);
  const categoryNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const h of headings) m[h.key] = h.name;
    return m;
  }, [headings]);

  const [filters, setFilters] = useState<ComparisonFilters>({
    featureText: true,
    differencesOnly: false,
    featureScore: true,
    showProfileFeatures: true,
    showBenefitFeatures: true,
    showDefinitionFeatures: true,
    enabledCategories: new Set<string>(),
  });
  const [apiExcludeSimilarities, setApiExcludeSimilarities] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const codes = selectedRows.map((r) => r.portfolioCode).filter(Boolean);
    if (codes.length === 0) {
      setError('No products selected.');
      setLoading(false);
      return;
    }

    const body = { ...quoteRequestBody };
    if (activeQuoteIndex !== null && Array.isArray(body.clients)) {
      body.clients = [(body.clients as unknown[])[activeQuoteIndex]].filter(Boolean);
    }

    setLoading(true);
    setError(null);

    postQuotePortfolioFeatures(codes, body, { excludeSimilarities: apiExcludeSimilarities })
      .then((raw) => {
        if (cancelled) return;
        const parsed = parseFeatureResponse(raw);
        setHeadings(parsed.headings);
        setPdsDateValues(parsed.pdsDateValues);
        setFilters((prev) => ({ ...prev, enabledCategories: new Set(parsed.headings.map((h) => h.key)) }));
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedRows, quoteRequestBody, activeQuoteIndex, apiExcludeSimilarities]);

  function toggleNeedType(nt: string) {
    setCollapsedNeedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(nt)) next.delete(nt); else next.add(nt);
      return next;
    });
  }


  const filteredGroups = useMemo(() => {
    const allowedCategories = new Set<string>();
    if (filters.showProfileFeatures) allowedCategories.add('Profile');
    if (filters.showBenefitFeatures) allowedCategories.add('Benefit');
    if (filters.showDefinitionFeatures) allowedCategories.add('Definition');

    let filtered = headings.filter((h) => {
      if (!filters.enabledCategories.has(h.key)) return false;
      if (h.category && allowedCategories.size > 0 && !allowedCategories.has(h.category)) return false;
      return true;
    });
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.map((h) => {
        if (h.name.toLowerCase().includes(term)) return h;
        const matchedFeatures = h.features.filter((f) => f.name.toLowerCase().includes(term));
        return matchedFeatures.length > 0 ? { ...h, features: matchedFeatures } : null;
      }).filter(Boolean) as ParsedHeading[];
    }
    return groupByNeedType(filtered);
  }, [headings, filters.enabledCategories, filters.showProfileFeatures, filters.showBenefitFeatures, filters.showDefinitionFeatures, searchTerm]);

  const totalHeadings = filteredGroups.reduce((sum, g) => sum + g.headings.length, 0);
  const colWidth = Math.max(180, Math.min(260, Math.floor(800 / columns.length)));

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-200 bg-gray-50">
          <button className="flex items-center gap-1 text-sm text-teal-700 hover:underline font-medium" onClick={onBack}>
            <ArrowLeft size={14} /> Back to Quotes
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={28} className="animate-spin text-teal-700" />
            <span className="text-sm text-slate-500">Fetching feature comparison...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-200 bg-gray-50">
          <button className="flex items-center gap-1 text-sm text-teal-700 hover:underline font-medium" onClick={onBack}>
            <ArrowLeft size={14} /> Back to Quotes
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3 max-w-md text-center">
            <AlertTriangle size={28} className="text-amber-500" />
            <span className="text-sm font-medium text-slate-700">Could not load feature comparison</span>
            <span className="text-xs text-slate-500">{error}</span>
            <Button size="sm" variant="outline" className="text-xs h-7 mt-2" onClick={onBack}>Back to Quotes</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white relative">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-200 bg-gray-50">
        <button className="flex items-center gap-1 text-sm text-teal-700 hover:underline font-medium" onClick={onBack}>
          <ArrowLeft size={14} /> Back to Quotes
        </button>
        <div className="flex-1" />
        <h2 className="text-sm font-bold text-slate-800">Feature Comparison</h2>
        <div className="flex-1" />
        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search features..." className="pl-7 pr-3 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 w-56" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button
          className={`relative p-1.5 rounded border transition-colors ${filtersOpen ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-slate-500 border-slate-300 hover:border-teal-500 hover:text-teal-700'}`}
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <SlidersHorizontal size={14} />
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto" ref={tableRef}>
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-20">
            <tr className="bg-white border-b-2 border-gray-200">
              <th className="text-left px-4 py-3 bg-gray-50 border-r border-gray-200 min-w-[280px] sticky left-0 z-30">
                <span className="text-xs font-semibold text-slate-600">Comparison Parameter</span>
              </th>
              {columns.map((col, colIdx) => (
                <th key={col.row.id} className="px-3 py-3 text-center border-r border-gray-200 bg-white relative" style={{ minWidth: colWidth, maxWidth: colWidth + 40 }}>
                  {col.row.existingCover && (
                    <span className="absolute top-1 right-1 bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">EXISTING</span>
                  )}
                  <div className="flex flex-col items-center gap-1">
                    <InsurerLogo name={col.row.supplierName} logo={col.row.supplierLogo} />
                    <span className="text-sm font-bold text-slate-800">{col.row.supplierName}</span>
                    <span className="text-[10px] text-slate-500 leading-tight line-clamp-2 max-w-[180px]">{col.row.products}</span>
                    <span className="text-xs font-semibold text-slate-800">{fmt(computePremiumTotal(col.row, premiumFreq, premiumFreq))} {freqSuffix}</span>
                    {filters.featureScore && (
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold ${scoreBg(col.row.featureScore)}`}>Feature: {col.row.featureScore}</span>
                    )}
                    {pdsDateValues[colIdx] && (
                      <span className="text-[10px] text-slate-400 leading-tight">Date of PDS or SPDS: {pdsDateValues[colIdx]}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredGroups.map((group) => (
              <NeedTypeGroup
                key={group.needType}
                group={group}
                columns={columns}
                collapsedNeedType={collapsedNeedTypes.has(group.needType)}
                onToggleNeedType={() => toggleNeedType(group.needType)}
                colWidth={colWidth}
                showDetails={filters.featureText}
                showScore={filters.featureScore}
              />
            ))}
            {filteredGroups.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="px-6 py-8 text-center text-muted-foreground">No features match your search or filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-gray-50">
        <span className="text-xs text-slate-500">
          Comparing {columns.length} product{columns.length !== 1 ? 's' : ''} across {totalHeadings} feature{totalHeadings === 1 ? '' : 's'} in {filteredGroups.length} cover{filteredGroups.length === 1 ? '' : 's'}
        </span>
        <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-7 gap-1.5" disabled={pdfExporting} onClick={async () => {
          const table = tableRef.current?.querySelector('table');
          if (!table) return;
          setPdfExporting(true);
          try {
            const html2pdf = (await import('html2pdf.js')).default;
            const clone = table.cloneNode(true) as HTMLElement;
            clone.style.fontSize = '10px';
            clone.querySelectorAll('[class*="sticky"]').forEach((el) => {
              (el as HTMLElement).style.position = 'static';
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (html2pdf() as any).set({
              margin: [8, 6, 8, 6],
              filename: 'Feature-Comparison-Report.pdf',
              html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
              jsPDF: { unit: 'mm', format: 'a3', orientation: 'landscape' },
              pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
            }).from(clone).save();
          } finally {
            setPdfExporting(false);
          }
        }}>
          <Download size={12} /> {pdfExporting ? 'Exporting...' : 'Download PDF Report'}
        </Button>
      </div>

      <FiltersPanel
        open={filtersOpen}
        filters={filters}
        allKeys={allCategoryKeys}
        categoryNames={categoryNames}
        onChange={setFilters}
        onClose={() => setFiltersOpen(false)}
        onDone={() => {
          setFiltersOpen(false);
          if (filters.differencesOnly !== apiExcludeSimilarities) {
            setApiExcludeSimilarities(filters.differencesOnly);
          }
        }}
        onReset={() => setFilters({ featureText: true, differencesOnly: false, featureScore: true, showProfileFeatures: true, showBenefitFeatures: true, showDefinitionFeatures: true, enabledCategories: new Set(allCategoryKeys) })}
      />
    </div>
  );
}

// ── Need type group (top-level header) ─────────────────────────────────────

function headingHasVisibleContent(heading: ParsedHeading, colCount: number, showDetails: boolean, showScore: boolean): boolean {
  if (showDetails) return true;
  if (!showScore) return false;
  return !headingScores(heading, colCount).every((s) => s === undefined);
}

function NeedTypeGroup({ group, columns, collapsedNeedType, onToggleNeedType, colWidth, showDetails, showScore }: {
  group: ParsedNeedGroup; columns: ComparisonColumn[]; collapsedNeedType: boolean;
  onToggleNeedType: () => void; colWidth: number; showDetails: boolean; showScore: boolean;
}) {
  const visibleHeadings = group.headings.filter((h) => headingHasVisibleContent(h, columns.length, showDetails, showScore));
  if (visibleHeadings.length === 0) return null;

  return (
    <>
      <tr className="bg-indigo-900 border-y border-indigo-800">
        <td className="px-4 py-2.5 bg-indigo-900 sticky left-0 z-10 cursor-pointer select-none" colSpan={columns.length + 1} onClick={onToggleNeedType}>
          <div className="flex items-center gap-2">
            {collapsedNeedType ? <ChevronRight size={14} className="text-white/70" /> : <ChevronDown size={14} className="text-white/70" />}
            <span className="text-xs font-bold text-white uppercase tracking-wide">{group.label}</span>
            <span className="text-[10px] text-white/60 ml-1">({visibleHeadings.length} feature{visibleHeadings.length === 1 ? '' : 's'})</span>
          </div>
        </td>
      </tr>
      {!collapsedNeedType && group.headings.map((heading) => (
        <HeadingGroup
          key={heading.key}
          heading={heading}
          columns={columns}
          colWidth={colWidth}
          showDetails={showDetails}
          showScore={showScore}
        />
      ))}
    </>
  );
}

// ── Heading group (collapsible, with weighting + scores in columns) ───────

function headingScores(heading: ParsedHeading, colCount: number): (number | undefined)[] {
  const scores: (number | undefined)[] = new Array(colCount).fill(undefined);
  for (const feature of heading.features) {
    for (let i = 0; i < feature.values.length && i < colCount; i++) {
      if (feature.values[i].scoreRaw != null && scores[i] === undefined) {
        scores[i] = feature.values[i].scoreRaw;
      }
    }
  }
  return scores;
}

function HeadingGroup({ heading, columns, colWidth, showDetails, showScore }: {
  heading: ParsedHeading; columns: ComparisonColumn[]; colWidth: number; showDetails: boolean; showScore: boolean;
}) {
  const weightLabel = heading.ipsAdjustedWeighting > 0 ? WEIGHTING_LABELS[heading.ipsAdjustedWeighting] : null;
  const scores = headingScores(heading, columns.length);

  if (!showDetails && (!showScore || scores.every((s) => s === undefined))) return null;

  return (
    <>
      <tr className="bg-slate-50 border-y border-gray-200">
        <td className="px-4 py-1.5 bg-slate-50 sticky left-0 z-10 min-w-[280px]">
          <div>
            <div className="text-xs font-bold text-slate-700 leading-snug">{heading.name}</div>
            {weightLabel && (
              <div className="text-[10px] text-slate-400 italic leading-tight">Weighting: {weightLabel}</div>
            )}
          </div>
        </td>
        {columns.map((col, idx) => (
          <td key={col.row.id} className="px-3 py-1.5 bg-slate-50 text-center" style={{ minWidth: colWidth }}>
            {showScore && scores[idx] != null && (
              <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold ${scoreBg(scores[idx]!)}`}>
                {scores[idx]}
              </span>
            )}
          </td>
        ))}
      </tr>
      {showDetails && heading.features.map((feature) => (
        <FeatureRow key={feature.key} feature={feature} columns={columns} colWidth={colWidth} />
      ))}
    </>
  );
}

// ── Feature row (strengths, limitations, commentary, text) ────────────────

function FeatureRow({ feature, columns, colWidth }: {
  feature: ParsedFeature; columns: ComparisonColumn[]; colWidth: number;
}) {
  return (
    <tr className="border-b border-gray-100 hover:bg-slate-50/50 align-top">
      <td className="px-4 py-2 bg-white sticky left-0 z-10 border-r border-gray-200 align-top min-w-[280px]">
        <span className="text-xs text-slate-700 font-medium">{feature.name}</span>
      </td>
      {feature.values.map((val, idx) => {
        const col = columns[idx];
        if (!col) return null;
        const hasContent = val.strengths || val.limitations || val.commentary || val.text || val.hasFeature;
        return (
          <td key={col.row.id} className={`px-3 py-2 border-r border-gray-100 align-top ${val.hasFeature ? 'bg-emerald-50/30' : ''}`} style={{ minWidth: colWidth }}>
            {val.strengths && (
              <div className="mt-0.5">
                <div className="text-[10px] font-semibold text-emerald-700">Strengths</div>
                <div className="text-[10px] text-slate-600 whitespace-pre-line leading-relaxed">{val.strengths}</div>
              </div>
            )}
            {val.limitations && (
              <div className="mt-1">
                <div className="text-[10px] font-semibold text-amber-700">Limitations</div>
                <div className="text-[10px] text-slate-600 whitespace-pre-line leading-relaxed">{val.limitations}</div>
              </div>
            )}
            {val.commentary && (
              <div className="mt-1">
                <div className="text-[10px] font-semibold text-blue-700">Commentary</div>
                <div className="text-[10px] text-slate-600 whitespace-pre-line leading-relaxed">{val.commentary}</div>
              </div>
            )}
            {val.text && (
              <div className="mt-1">
                <div className="text-[10px] font-semibold text-slate-500">Feature Text</div>
                <div className="text-[10px] text-slate-600 whitespace-pre-line leading-relaxed">{val.text}</div>
              </div>
            )}
            {!hasContent && (
              <span className="text-xs text-slate-400">—</span>
            )}
          </td>
        );
      })}
    </tr>
  );
}
