import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Download, ArrowLeft, ChevronDown, ChevronRight, SlidersHorizontal, Check, X, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuoteResultRow } from './quoteResultsData';
import { computePremiumTotal } from './quoteResultsData';
import type { FeatureRequestEntry } from '@/services/omnilifeApi';
import { postPortfolioFeatures } from '@/services/omnilifeApi';

// ── Types ────────────────────────────────────────────────────────────────────

interface ComparisonColumn {
  row: QuoteResultRow;
  isExisting: boolean;
}

interface FeatureValue {
  text: string;
  hasFeature: boolean;
  score?: number;
}

interface ParsedFeature {
  key: string;
  name: string;
  values: FeatureValue[];
}

interface ParsedSubHeading {
  key: string;
  name: string;
  features: ParsedFeature[];
}

interface ParsedHeading {
  key: string;
  name: string;
  subHeadings: ParsedSubHeading[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Build features API request from selected rows ───────────────────────────

function buildFeatureRequest(rows: QuoteResultRow[]): FeatureRequestEntry[] {
  return rows
    .filter((r) => r.supplierCode && Object.keys(r.productCodes).length > 0)
    .map((r) => {
      const entry: FeatureRequestEntry = {
        supplierCode: r.supplierCode,
        products: { ...r.productCodes },
      };
      if (r.revisionDate) entry.revisionDate = r.revisionDate;
      return entry;
    });
}

// ── Parse API response ──────────────────────────────────────────────────────

function asStr(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function parseFeatureResponse(raw: unknown): ParsedHeading[] {
  if (!Array.isArray(raw)) return [];

  const headingMap = new Map<string, { name: string; subMap: Map<string, ParsedFeature[]> }>();

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const entry = item as Record<string, unknown>;

    const headingObj = (entry.heading ?? {}) as Record<string, unknown>;
    const headingCode = asStr(headingObj.code) || asStr(headingObj.name) || 'UNKNOWN';
    const headingName = asStr(headingObj.name) || headingCode;

    if (headingCode === 'PORTFOLIO_HEADING') continue;

    const subHeadingObj = (entry.subHeading ?? {}) as Record<string, unknown>;
    const subHeadingName = asStr(subHeadingObj.name) || asStr(subHeadingObj.code) || 'General';

    const featureObj = (entry.feature ?? {}) as Record<string, unknown>;
    const featureName = asStr(featureObj.name) || asStr(featureObj.code) || asStr(entry.name) || headingName;

    const portfolios = Array.isArray(entry.features) ? entry.features : [];
    const values: FeatureValue[] = portfolios.map((p: unknown) => {
      if (!p || typeof p !== 'object') return { text: '', hasFeature: false };
      const pf = p as Record<string, unknown>;
      return {
        text: asStr(pf.text) || asStr(pf.value) || '',
        hasFeature: pf.hasFeature === true,
        score: typeof pf.weighting === 'number' && pf.weighting > 0 ? pf.weighting : undefined,
      };
    });

    if (!headingMap.has(headingCode)) {
      headingMap.set(headingCode, { name: headingName, subMap: new Map() });
    }
    const group = headingMap.get(headingCode)!;
    if (!group.subMap.has(subHeadingName)) {
      group.subMap.set(subHeadingName, []);
    }
    group.subMap.get(subHeadingName)!.push({
      key: `${headingCode}_${subHeadingName}_${featureName}`,
      name: featureName,
      values,
    });
  }

  const headings: ParsedHeading[] = [];
  for (const [code, { name, subMap }] of headingMap) {
    const subHeadings: ParsedSubHeading[] = [];
    for (const [subName, features] of subMap) {
      subHeadings.push({ key: `${code}_${subName}`, name: subName, features });
    }
    headings.push({ key: code, name, subHeadings });
  }
  return headings;
}

// ── Filter state ─────────────────────────────────────────────────────────────

interface ComparisonFilters {
  featureText: boolean;
  differencesOnly: boolean;
  featureScore: boolean;
  enabledCategories: Set<string>;
}

// ── Filters slide-out panel ──────────────────────────────────────────────────

function FiltersPanel({
  open,
  filters,
  allKeys,
  categoryNames,
  onChange,
  onClose,
  onReset,
}: {
  open: boolean;
  filters: ComparisonFilters;
  allKeys: string[];
  categoryNames: Record<string, string>;
  onChange: (f: ComparisonFilters) => void;
  onClose: () => void;
  onReset: () => void;
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
        <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-7" onClick={onClose}>Done</Button>
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

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  selectedRows: QuoteResultRow[];
  existingRowId: string | null;
  onBack: () => void;
}

export function ProductComparisonPage({ selectedRows, existingRowId, onBack }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [headings, setHeadings] = useState<ParsedHeading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const columns: ComparisonColumn[] = selectedRows.map((row) => ({
    row,
    isExisting: row.id === existingRowId,
  }));

  const allCategoryKeys = useMemo(() => headings.map((h) => h.key), [headings]);
  const categoryNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const h of headings) m[h.key] = h.name;
    return m;
  }, [headings]);

  const [filters, setFilters] = useState<ComparisonFilters>({
    featureText: false,
    differencesOnly: false,
    featureScore: true,
    enabledCategories: new Set<string>(),
  });

  useEffect(() => {
    let cancelled = false;
    const entries = buildFeatureRequest(selectedRows);
    if (entries.length === 0) {
      setError('Selected products have no supplier or product codes for comparison.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    postPortfolioFeatures(entries)
      .then((raw) => {
        if (cancelled) return;
        const parsed = parseFeatureResponse(raw);
        setHeadings(parsed);
        setFilters((prev) => ({ ...prev, enabledCategories: new Set(parsed.map((h) => h.key)) }));
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedRows]);

  function toggleCategory(key: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  const filteredHeadings = useMemo(() => {
    let result = headings.filter((h) => filters.enabledCategories.has(h.key));
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.map((h) => {
        if (h.name.toLowerCase().includes(term)) return h;
        const filteredSubs = h.subHeadings.map((sub) => {
          if (sub.name.toLowerCase().includes(term)) return sub;
          const filteredFeatures = sub.features.filter((f) => f.name.toLowerCase().includes(term));
          return filteredFeatures.length > 0 ? { ...sub, features: filteredFeatures } : null;
        }).filter(Boolean) as ParsedSubHeading[];
        return filteredSubs.length > 0 ? { ...h, subHeadings: filteredSubs } : null;
      }).filter(Boolean) as ParsedHeading[];
    }
    return result;
  }, [headings, filters.enabledCategories, searchTerm]);

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
            <span className="text-sm text-slate-500">Fetching product features...</span>
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
    <div className="flex flex-col h-full bg-white relative">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-200 bg-gray-50">
        <button className="flex items-center gap-1 text-sm text-teal-700 hover:underline font-medium" onClick={onBack}>
          <ArrowLeft size={14} /> Back to Quotes
        </button>
        <div className="flex-1" />
        <h2 className="text-sm font-bold text-slate-800">Product Comparison</h2>
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
          <thead className="sticky top-0 z-10">
            <tr className="bg-white border-b-2 border-gray-200">
              <th className="text-left px-4 py-3 bg-gray-50 border-r border-gray-200 min-w-[220px] sticky left-0 z-20">
                <span className="text-xs font-semibold text-slate-600">Comparison Parameter</span>
              </th>
              {columns.map((col) => (
                <th key={col.row.id} className={`px-3 py-3 text-center border-r border-gray-200 ${col.isExisting ? 'bg-amber-50' : 'bg-white'}`} style={{ minWidth: colWidth, maxWidth: colWidth + 40 }}>
                  <div className="flex flex-col items-center gap-1">
                    {col.isExisting && <span className="text-[9px] font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wider">Existing</span>}
                    <span className="text-sm font-bold text-slate-800">{col.row.supplierName}</span>
                    <span className="text-[10px] text-slate-500 leading-tight line-clamp-2 max-w-[180px]">{col.row.products}</span>
                    <span className="text-xs font-semibold text-slate-800">{fmt(computePremiumTotal(col.row, 'Y', 'Y'))} p.a.</span>
                    {filters.featureScore && (
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold ${scoreBg(col.row.featureScore)}`}>Feature: {col.row.featureScore}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredHeadings.map((heading) => (
              <HeadingGroup
                key={heading.key}
                heading={heading}
                columns={columns}
                collapsed={collapsedCategories.has(heading.key)}
                onToggle={() => toggleCategory(heading.key)}
                colWidth={colWidth}
                showText={filters.featureText}
              />
            ))}
            {filteredHeadings.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="px-6 py-8 text-center text-muted-foreground">No features match your search or filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-gray-50">
        <span className="text-xs text-slate-500">
          Comparing {columns.length} product{columns.length !== 1 ? 's' : ''} across {filteredHeadings.length} categor{filteredHeadings.length === 1 ? 'y' : 'ies'}
        </span>
        <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-7 gap-1.5" onClick={() => {
          const w = window.open('', '_blank');
          if (!w) return;
          const html = tableRef.current?.querySelector('table')?.outerHTML ?? '';
          w.document.write(`<!DOCTYPE html><html><head><title>Product Comparison</title><style>body{font-family:sans-serif;margin:20px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{padding:6px 10px;border:1px solid #e5e7eb}th{background:#f1f5f9;font-weight:600;text-align:left}@media print{body{margin:10px}}</style></head><body><h1>Insurance Product Comparison Report</h1>${html}<script>window.print();setTimeout(()=>window.close(),1000)</script></body></html>`);
          w.document.close();
        }}>
          <Download size={12} /> Download Comparison Report
        </Button>
      </div>

      <FiltersPanel
        open={filtersOpen}
        filters={filters}
        allKeys={allCategoryKeys}
        categoryNames={categoryNames}
        onChange={setFilters}
        onClose={() => setFiltersOpen(false)}
        onReset={() => setFilters({ featureText: false, differencesOnly: false, featureScore: true, enabledCategories: new Set(allCategoryKeys) })}
      />
    </div>
  );
}

// ── Heading group (collapsible) ─────────────────────────────────────────────

function HeadingGroup({ heading, columns, collapsed, onToggle, colWidth, showText }: {
  heading: ParsedHeading; columns: ComparisonColumn[]; collapsed: boolean; onToggle: () => void; colWidth: number; showText: boolean;
}) {
  return (
    <>
      <tr className="bg-slate-100 border-y border-gray-200">
        <td className="px-4 py-2 bg-slate-100 sticky left-0 z-10 cursor-pointer select-none" colSpan={columns.length + 1} onClick={onToggle}>
          <div className="flex items-center gap-2">
            {collapsed ? <ChevronRight size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{heading.name}</span>
          </div>
        </td>
      </tr>
      {!collapsed && heading.subHeadings.map((sub) => (
        <SubHeadingRows key={sub.key} sub={sub} columns={columns} colWidth={colWidth} showText={showText} showSubHeader={heading.subHeadings.length > 1 || sub.name !== 'General'} />
      ))}
    </>
  );
}

function SubHeadingRows({ sub, columns, colWidth, showText, showSubHeader }: {
  sub: ParsedSubHeading; columns: ComparisonColumn[]; colWidth: number; showText: boolean; showSubHeader: boolean;
}) {
  return (
    <>
      {showSubHeader && (
        <tr className="bg-gray-50 border-b border-gray-200">
          <td className="px-6 py-1.5 bg-gray-50 sticky left-0 z-10" colSpan={columns.length + 1}>
            <span className="text-[11px] font-semibold text-slate-600">{sub.name}</span>
          </td>
        </tr>
      )}
      {sub.features.map((feature) => (
        <FeatureRow key={feature.key} feature={feature} columns={columns} colWidth={colWidth} showText={showText} />
      ))}
    </>
  );
}

function FeatureRow({ feature, columns, colWidth, showText }: {
  feature: ParsedFeature; columns: ComparisonColumn[]; colWidth: number; showText: boolean;
}) {
  return (
    <tr className="border-b border-gray-100 hover:bg-slate-50/50">
      <td className="px-4 py-2 bg-white sticky left-0 z-10 border-r border-gray-200">
        <span className="text-xs text-slate-700 font-medium">{feature.name}</span>
      </td>
      {feature.values.map((val, idx) => {
        const col = columns[idx];
        if (!col) return null;
        return (
          <td key={col.row.id} className={`px-3 py-2 text-center border-r border-gray-100 ${col.isExisting ? 'bg-amber-50/30' : val.hasFeature ? 'bg-emerald-50/30' : ''}`} style={{ minWidth: colWidth }}>
            {val.score != null && val.score > 0 && (
              <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold mb-0.5 ${scoreBg(val.score * 20)}`}>
                {val.score.toFixed(1)}
              </span>
            )}
            {showText && val.text && (
              <div className="text-[10px] text-slate-600 leading-tight mt-0.5 max-w-[200px] mx-auto">{val.text}</div>
            )}
            {!showText && val.text && (
              <div className="text-[11px] text-slate-700 leading-tight max-w-[200px] mx-auto">{val.text}</div>
            )}
            {!val.text && !val.hasFeature && (
              <span className="text-xs text-slate-400">—</span>
            )}
          </td>
        );
      })}
    </tr>
  );
}
