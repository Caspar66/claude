import { useState, useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, Minus, Search, Download, ArrowLeft, ChevronDown, ChevronRight, SlidersHorizontal, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuoteResultRow } from './quoteResultsData';
import { computePremiumTotal } from './quoteResultsData';

// ── Types ────────────────────────────────────────────────────────────────────

interface ComparisonColumn {
  row: QuoteResultRow;
  isExisting: boolean;
}

interface MetricValue {
  score: number;
  dollarAmount: number;
}

interface MetricRow {
  key: string;
  label: string;
  values: Record<string, MetricValue>; // keyed by QuoteResultRow.id
}

interface CoverTypeRow {
  key: string;
  label: string;
  values: Record<string, 'Optional' | 'Included' | 'Not available'>;
}

interface ComparisonCategory {
  key: string;
  label: string;
  type: 'coverTypes' | 'metrics';
  coverRows?: CoverTypeRow[];
  metricRows?: MetricRow[];
}

// ── Score helpers ────────────────────────────────────────────────────────────

function scoreBg(score: number): string {
  if (score >= 85) return 'bg-emerald-100 text-emerald-800';
  if (score >= 70) return 'bg-green-50 text-green-700';
  if (score >= 55) return 'bg-yellow-50 text-yellow-800';
  if (score >= 40) return 'bg-orange-50 text-orange-700';
  return 'bg-red-50 text-red-700';
}

function scoreCellBg(score: number): string {
  if (score >= 85) return 'bg-emerald-50/60';
  if (score >= 70) return 'bg-green-50/40';
  if (score >= 55) return 'bg-yellow-50/40';
  if (score >= 40) return 'bg-orange-50/40';
  return 'bg-red-50/40';
}

function TrendArrow({ score, avg }: { score: number; avg: number }) {
  if (Math.abs(score - avg) < 3) return <Minus size={12} className="text-gray-400" />;
  if (score > avg) return <ArrowUp size={12} className="text-emerald-600" />;
  return <ArrowDown size={12} className="text-red-500" />;
}

function fmt(n: number) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtM(n: number) {
  return `$${(n / 1_000_000).toFixed(1)}M`;
}

function coverBadge(val: 'Optional' | 'Included' | 'Not available') {
  if (val === 'Included') return <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Included</span>;
  if (val === 'Optional') return <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Optional</span>;
  return <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Not available</span>;
}

// ── Mock comparison data generator ───────────────────────────────────────────

function generateComparisonData(columns: ComparisonColumn[]): ComparisonCategory[] {
  const ids = columns.map((c) => c.row.id);

  // Seed-based pseudo-random per id
  function hashScore(id: string, seed: number): number {
    let h = seed;
    for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
    return Math.abs(h % 60) + 35; // 35-94
  }

  function hashDollar(id: string, seed: number, base: number): number {
    const s = hashScore(id, seed);
    return base * (0.5 + s / 100);
  }

  // Cover types
  const coverTypes: CoverTypeRow[] = [
    {
      key: 'supportsTpd',
      label: 'Supports TPD',
      values: Object.fromEntries(ids.map((id) => {
        const s = hashScore(id, 101);
        return [id, s > 60 ? 'Optional' : s > 40 ? 'Included' : 'Not available'] as const;
      })),
    },
    {
      key: 'supportsTrauma',
      label: 'Supports Trauma',
      values: Object.fromEntries(ids.map((id) => {
        const s = hashScore(id, 202);
        return [id, s > 65 ? 'Optional' : s > 45 ? 'Included' : 'Not available'] as const;
      })),
    },
  ];

  // Financial metrics
  function makeMetricRow(key: string, label: string, seed: number, baseDollar: number): MetricRow {
    const values: Record<string, MetricValue> = {};
    ids.forEach((id) => {
      values[id] = {
        score: hashScore(id, seed),
        dollarAmount: hashDollar(id, seed, baseDollar),
      };
    });
    return { key, label, values };
  }

  const netPolicyRevenue: MetricRow[] = [
    makeMetricRow('netPolicyRev', 'Net Policy Revenue', 301, 4_200_000),
  ];

  const netTotalRevenue: MetricRow[] = [
    makeMetricRow('netTotalRev', 'Net Total Revenue', 401, 6_800_000),
  ];

  const netProfit: MetricRow[] = [
    makeMetricRow('netProfit', 'Net Profit', 501, 1_200_000),
  ];

  const totalAssets: MetricRow[] = [
    makeMetricRow('totalAssets', 'Total Assets', 601, 45_000_000),
  ];

  const netAssets: MetricRow[] = [
    makeMetricRow('netAssets', 'Net Assets', 701, 18_000_000),
  ];

  const totalClaimsPaid: MetricRow[] = [
    makeMetricRow('totalClaims', 'Total Claims Paid', 801, 2_800_000),
  ];

  const avgClaimTime: MetricRow[] = [
    makeMetricRow('avgClaimTime', 'Average Time to Process a Claim', 901, 3),
  ];

  const disputesPerThousand: MetricRow[] = [
    makeMetricRow('disputes', 'Disputes per 1,000 Lives Insured', 1001, 12),
  ];

  const percentDisputed: MetricRow[] = [
    makeMetricRow('pctDisputed', 'Percentage of Claims Disputed', 1101, 8),
  ];

  const productCombos: CoverTypeRow[] = [
    {
      key: 'lifeAndTpd',
      label: 'Life + TPD Bundle',
      values: Object.fromEntries(ids.map((id) => {
        const s = hashScore(id, 1201);
        return [id, s > 55 ? 'Included' : s > 35 ? 'Optional' : 'Not available'] as const;
      })),
    },
    {
      key: 'lifeTraumaBundle',
      label: 'Life + Trauma Bundle',
      values: Object.fromEntries(ids.map((id) => {
        const s = hashScore(id, 1202);
        return [id, s > 60 ? 'Optional' : s > 40 ? 'Included' : 'Not available'] as const;
      })),
    },
  ];

  const healthyLives: CoverTypeRow[] = [
    {
      key: 'healthyDiscount',
      label: 'Healthy Lives Premium Discount',
      values: Object.fromEntries(ids.map((id) => {
        const s = hashScore(id, 1301);
        return [id, s > 65 ? 'Included' : 'Not available'] as const;
      })),
    },
    {
      key: 'wellnessProgram',
      label: 'Wellness Program Benefit',
      values: Object.fromEntries(ids.map((id) => {
        const s = hashScore(id, 1302);
        return [id, s > 50 ? 'Included' : s > 35 ? 'Optional' : 'Not available'] as const;
      })),
    },
  ];

  const financialPlanning: CoverTypeRow[] = [
    {
      key: 'fpBenefit',
      label: 'Financial Planning Benefit',
      values: Object.fromEntries(ids.map((id) => {
        const s = hashScore(id, 1401);
        return [id, s > 60 ? 'Included' : s > 40 ? 'Optional' : 'Not available'] as const;
      })),
    },
  ];

  return [
    { key: 'coverTypes', label: 'PRODUCT COVER TYPES', type: 'coverTypes' as const, coverRows: coverTypes },
    { key: 'netPolicyRevenue', label: 'NET POLICY REVENUE ($MILLION)', type: 'metrics' as const, metricRows: netPolicyRevenue },
    { key: 'netTotalRevenue', label: 'NET TOTAL REVENUE ($MILLION)', type: 'metrics' as const, metricRows: netTotalRevenue },
    { key: 'netProfit', label: 'NET PROFIT ($MILLION)', type: 'metrics' as const, metricRows: netProfit },
    { key: 'totalAssets', label: 'TOTAL ASSETS ($MILLION)', type: 'metrics' as const, metricRows: totalAssets },
    { key: 'netAssets', label: 'NET ASSETS ($MILLION)', type: 'metrics' as const, metricRows: netAssets },
    { key: 'totalClaimsPaid', label: 'TOTAL CLAIMS PAID ($MILLION)', type: 'metrics' as const, metricRows: totalClaimsPaid },
    { key: 'avgClaimTime', label: 'AVERAGE TIME TO PROCESS A CLAIM (MONTHS)', type: 'metrics' as const, metricRows: avgClaimTime },
    { key: 'disputesPerThousand', label: 'DISPUTES PER 1,000 LIVES INSURED', type: 'metrics' as const, metricRows: disputesPerThousand },
    { key: 'percentDisputed', label: 'PERCENTAGE OF CLAIMS DISPUTED', type: 'metrics' as const, metricRows: percentDisputed },
    { key: 'productCombinations', label: 'PRODUCT COMBINATIONS', type: 'coverTypes' as const, coverRows: productCombos },
    { key: 'healthyLives', label: 'HEALTHY LIVES DISCOUNTS AND BENEFITS', type: 'coverTypes' as const, coverRows: healthyLives },
    { key: 'financialPlanning', label: 'FINANCIAL PLANNING BENEFIT', type: 'coverTypes' as const, coverRows: financialPlanning },
  ];
}

// ── Filter state ─────────────────────────────────────────────────────────────

export interface ComparisonFilters {
  saveForFuture: boolean;
  featureText: boolean;
  differencesOnly: boolean;
  featureScore: boolean;
  sortBy: 'differences' | 'similarities';
  enabledCategories: Set<string>;
}

export function getDefaultFilters(allKeys: string[]): ComparisonFilters {
  return {
    saveForFuture: false,
    featureText: false,
    differencesOnly: true,
    featureScore: true,
    sortBy: 'differences',
    enabledCategories: new Set(allKeys),
  };
}

const ALL_CATEGORY_KEYS = [
  'coverTypes',
  'netPolicyRevenue',
  'netTotalRevenue',
  'netProfit',
  'totalAssets',
  'netAssets',
  'totalClaimsPaid',
  'avgClaimTime',
  'disputesPerThousand',
  'percentDisputed',
  'productCombinations',
  'healthyLives',
  'financialPlanning',
];

const CATEGORY_DISPLAY: Record<string, string> = {
  coverTypes: 'Product cover types',
  netPolicyRevenue: 'Net policy revenue ($million)',
  netTotalRevenue: 'Net total revenue ($million)',
  netProfit: 'Net profit ($million)',
  totalAssets: 'Total assets ($million)',
  netAssets: 'Net assets ($million)',
  totalClaimsPaid: 'Total claims paid ($million)',
  avgClaimTime: 'Average time to process a claim (months)',
  disputesPerThousand: 'Disputes per 1,000 lives insured',
  percentDisputed: 'Percentage of claims disputed',
  productCombinations: 'Product combinations',
  healthyLives: 'Healthy lives discounts and benefits',
  financialPlanning: 'Financial planning benefit',
};

// ── Filters slide-out panel ──────────────────────────────────────────────────

function FiltersPanel({
  open,
  filters,
  onChange,
  onClose,
  onReset,
}: {
  open: boolean;
  filters: ComparisonFilters;
  onChange: (f: ComparisonFilters) => void;
  onClose: () => void;
  onReset: () => void;
}) {
  const [catSearch, setCatSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
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
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange({ ...filters, enabledCategories: next });
  }

  function toggleAll() {
    const allEnabled = ALL_CATEGORY_KEYS.every((k) => filters.enabledCategories.has(k));
    onChange({
      ...filters,
      enabledCategories: allEnabled ? new Set<string>() : new Set(ALL_CATEGORY_KEYS),
    });
  }

  const filteredCats = catSearch
    ? ALL_CATEGORY_KEYS.filter((k) => CATEGORY_DISPLAY[k]?.toLowerCase().includes(catSearch.toLowerCase()))
    : ALL_CATEGORY_KEYS;

  const allChecked = ALL_CATEGORY_KEYS.every((k) => filters.enabledCategories.has(k));

  return (
    <div
      ref={ref}
      className="absolute right-0 top-0 bottom-0 w-[320px] bg-white border-l border-gray-200 shadow-xl z-30 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-slate-50">
        <h3 className="text-sm font-bold text-slate-800">Comparison Filters</h3>
        <button className="text-slate-400 hover:text-slate-600" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Save for future */}
        <FilterChk
          label="Save filter for future comparisons"
          checked={filters.saveForFuture}
          onChange={(v) => onChange({ ...filters, saveForFuture: v })}
        />

        {/* Toggles */}
        <div className="space-y-2">
          <FilterToggle label="Feature Text" value={filters.featureText} onChange={(v) => onChange({ ...filters, featureText: v })} />
          <FilterToggle label="Differences Only" value={filters.differencesOnly} onChange={(v) => onChange({ ...filters, differencesOnly: v })} />
          <FilterToggle label="Feature Score" value={filters.featureScore} onChange={(v) => onChange({ ...filters, featureScore: v })} />
        </div>

        {/* Sort by */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">Sort By</label>
          <div className="space-y-1">
            <FilterRadio label="Differences" checked={filters.sortBy === 'differences'} onChange={() => onChange({ ...filters, sortBy: 'differences' })} />
            <FilterRadio label="Similarities" checked={filters.sortBy === 'similarities'} onChange={() => onChange({ ...filters, sortBy: 'similarities' })} />
          </div>
        </div>

        {/* Categories */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">Categories</label>
          <div className="relative mb-2">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
            />
          </div>
          <div className="space-y-0.5 max-h-[240px] overflow-y-auto border border-gray-200 rounded p-2">
            {!catSearch && (
              <FilterChk label="Select All" checked={allChecked} onChange={toggleAll} bold />
            )}
            {filteredCats.map((key) => (
              <FilterChk
                key={key}
                label={CATEGORY_DISPLAY[key] || key}
                checked={filters.enabledCategories.has(key)}
                onChange={() => toggleCat(key)}
              />
            ))}
            {filteredCats.length === 0 && (
              <span className="text-[11px] text-muted-foreground">No categories match</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-200 bg-gray-50">
        <Button variant="outline" size="sm" className="text-xs h-7" onClick={onReset}>Reset</Button>
        <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-7" onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}

function FilterChk({ label, checked, onChange, bold }: { label: string; checked: boolean; onChange: (v: boolean) => void; bold?: boolean }) {
  return (
    <button className="flex items-center gap-2 py-0.5 w-full text-left" onClick={() => onChange(!checked)}>
      <div className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${checked ? 'bg-teal-600 border-teal-600 text-white' : 'border-gray-300 bg-white'}`}>
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
      <div className="flex rounded border border-gray-300 overflow-hidden">
        <button
          className={`px-2.5 py-0.5 text-[11px] font-medium ${!value ? 'bg-slate-600 text-white' : 'bg-white text-slate-500 hover:bg-gray-50'}`}
          onClick={() => onChange(false)}
        >NO</button>
        <button
          className={`px-2.5 py-0.5 text-[11px] font-medium ${value ? 'bg-teal-600 text-white' : 'bg-white text-slate-500 hover:bg-gray-50'}`}
          onClick={() => onChange(true)}
        >YES</button>
      </div>
    </div>
  );
}

function FilterRadio({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button className="flex items-center gap-2 py-0.5 w-full text-left" onClick={onChange}>
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${checked ? 'border-teal-600' : 'border-gray-300'}`}>
        {checked && <div className="w-2 h-2 rounded-full bg-teal-600" />}
      </div>
      <span className="text-xs text-slate-700">{label}</span>
    </button>
  );
}

// ── PDF download ─────────────────────────────────────────────────────────────

function downloadComparisonPdf(
  tableRef: React.RefObject<HTMLDivElement | null>,
  columns: ComparisonColumn[],
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const insurerHeaders = columns.map((col) => {
    const existing = col.isExisting ? ' <span style="background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:8px;font-size:9px;font-weight:bold;">EXISTING</span>' : '';
    return `<th style="padding:8px 12px;text-align:center;border:1px solid #e5e7eb;background:${col.isExisting ? '#fffbeb' : '#f9fafb'};min-width:150px;">
      ${existing}
      <div style="font-weight:bold;font-size:13px;color:#334155;">${col.row.supplierName}</div>
      <div style="font-size:10px;color:#64748b;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${col.row.products}</div>
      <div style="font-size:11px;font-weight:600;color:#1e293b;">$${(computePremiumTotal(col.row, 'Y', 'Y')).toLocaleString('en-AU', { minimumFractionDigits: 2 })} p.a.</div>
      <div style="font-size:10px;font-weight:bold;color:${col.row.featureScore >= 70 ? '#15803d' : '#b45309'};">Feature: ${col.row.featureScore}</div>
    </th>`;
  }).join('');

  // Extract table body HTML
  const tableHtml = tableRef.current?.querySelector('table')?.innerHTML || '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Insurance Product Comparison Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 20px; color: #334155; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .subtitle { font-size: 12px; color: #64748b; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { padding: 6px 10px; border: 1px solid #e5e7eb; }
    th { background: #f1f5f9; font-weight: 600; text-align: left; }
    .cat-header { background: #f1f5f9; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
    @media print { body { margin: 10px; } }
  </style>
</head>
<body>
  <h1>Insurance Product Comparison Report</h1>
  <div class="subtitle">Generated ${new Date().toLocaleDateString('en-AU')} — ${columns.length} products compared</div>
  <table>
    <thead>
      <tr>
        <th style="min-width:200px;background:#f1f5f9;">Comparison Parameter</th>
        ${insurerHeaders}
      </tr>
    </thead>
    ${tableHtml}
  </table>
  <script>window.print(); setTimeout(() => window.close(), 1000);</script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  selectedRows: QuoteResultRow[];
  existingRowId: string | null; // id of the existing policy column, if any
  onBack: () => void;
}

export function ProductComparisonPage({ selectedRows, existingRowId, onBack }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<ComparisonFilters>(getDefaultFilters(ALL_CATEGORY_KEYS));
  const tableRef = useRef<HTMLDivElement>(null);

  const columns: ComparisonColumn[] = selectedRows.map((row) => ({
    row,
    isExisting: row.id === existingRowId,
  }));

  const allCategories = generateComparisonData(columns);

  function toggleCategory(key: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Apply filters: enabled categories
  const enabledCategories = allCategories.filter((cat) => filters.enabledCategories.has(cat.key));

  // Apply search
  const filteredCategories = enabledCategories.map((cat) => {
    if (!searchTerm) return cat;
    const term = searchTerm.toLowerCase();
    if (cat.label.toLowerCase().includes(term)) return cat;

    if (cat.type === 'coverTypes' && cat.coverRows) {
      const filtered = cat.coverRows.filter((r) => r.label.toLowerCase().includes(term));
      if (filtered.length === 0) return null;
      return { ...cat, coverRows: filtered };
    }
    if (cat.type === 'metrics' && cat.metricRows) {
      const filtered = cat.metricRows.filter((r) => r.label.toLowerCase().includes(term));
      if (filtered.length === 0) return null;
      return { ...cat, metricRows: filtered };
    }
    return cat;
  }).filter(Boolean) as ComparisonCategory[];

  const activeFilterCount = ALL_CATEGORY_KEYS.length - filters.enabledCategories.size
    + (filters.differencesOnly ? 0 : 1)
    + (filters.featureText ? 1 : 0)
    + (!filters.featureScore ? 1 : 0);

  const colWidth = Math.max(180, Math.min(220, Math.floor(700 / columns.length)));

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-200 bg-gray-50">
        <button
          className="flex items-center gap-1 text-sm text-teal-700 hover:underline font-medium"
          onClick={onBack}
        >
          <ArrowLeft size={14} />
          Back to Quotes
        </button>
        <div className="flex-1" />
        <h2 className="text-sm font-bold text-slate-800">Product Comparison</h2>
        <div className="flex-1" />
        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search comparison parameters..."
            className="pl-7 pr-3 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 w-56"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Filter icon */}
        <button
          className={`relative p-1.5 rounded border transition-colors ${filtersOpen ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-500 border-gray-300 hover:border-teal-400 hover:text-teal-600'}`}
          title="Comparison Filters"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <SlidersHorizontal size={14} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Scrollable comparison table */}
      <div className="flex-1 overflow-auto" ref={tableRef}>
        <table className="w-full text-sm border-collapse">
          {/* Column headers — sticky */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-white border-b-2 border-gray-200">
              {/* Label column */}
              <th className="text-left px-4 py-3 bg-gray-50 border-r border-gray-200 min-w-[220px] sticky left-0 z-20">
                <span className="text-xs font-semibold text-slate-600">Comparison Parameter</span>
              </th>
              {/* Product columns */}
              {columns.map((col) => (
                <th
                  key={col.row.id}
                  className={`px-3 py-3 text-center border-r border-gray-200 ${col.isExisting ? 'bg-amber-50' : 'bg-white'}`}
                  style={{ minWidth: colWidth, maxWidth: colWidth + 40 }}
                >
                  <div className="flex flex-col items-center gap-1">
                    {col.isExisting && (
                      <span className="text-[9px] font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Existing
                      </span>
                    )}
                    <span className="text-sm font-bold text-slate-800">
                      {col.row.supplierName}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight line-clamp-2 max-w-[180px]">
                      {col.row.products}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      {fmt(computePremiumTotal(col.row, 'Y', 'Y'))} p.a.
                    </span>
                    {filters.featureScore && (
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold ${scoreBg(col.row.featureScore)}`}>
                        Feature: {col.row.featureScore}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredCategories.map((cat) => {
              const collapsed = collapsedCategories.has(cat.key);
              return (
                <CategoryGroup
                  key={cat.key}
                  category={cat}
                  columns={columns}
                  collapsed={collapsed}
                  onToggle={() => toggleCategory(cat.key)}
                  colWidth={colWidth}
                  showFeatureText={filters.featureText}
                />
              );
            })}
            {filteredCategories.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-muted-foreground">
                  No comparison parameters match your search or filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-gray-50">
        <span className="text-xs text-slate-500">
          Comparing {columns.length} product{columns.length !== 1 ? 's' : ''} across {filteredCategories.length} categor{filteredCategories.length === 1 ? 'y' : 'ies'}
        </span>
        <Button
          size="sm"
          className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-7 gap-1.5"
          onClick={() => downloadComparisonPdf(tableRef, columns)}
        >
          <Download size={12} />
          Download Comparison Report
        </Button>
      </div>

      {/* Filters slide-out panel */}
      <FiltersPanel
        open={filtersOpen}
        filters={filters}
        onChange={setFilters}
        onClose={() => setFiltersOpen(false)}
        onReset={() => setFilters(getDefaultFilters(ALL_CATEGORY_KEYS))}
      />
    </div>
  );
}

// ── Category group (collapsible) ─────────────────────────────────────────────

function CategoryGroup({
  category,
  columns,
  collapsed,
  onToggle,
  colWidth,
  showFeatureText,
}: {
  category: ComparisonCategory;
  columns: ComparisonColumn[];
  collapsed: boolean;
  onToggle: () => void;
  colWidth: number;
  showFeatureText: boolean;
}) {
  return (
    <>
      {/* Category header row */}
      <tr className="bg-slate-100 border-y border-gray-200">
        <td
          className="px-4 py-2 bg-slate-100 sticky left-0 z-10 cursor-pointer select-none"
          colSpan={columns.length + 1}
          onClick={onToggle}
        >
          <div className="flex items-center gap-2">
            {collapsed
              ? <ChevronRight size={14} className="text-slate-500" />
              : <ChevronDown size={14} className="text-slate-500" />
            }
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              {category.label}
            </span>
          </div>
        </td>
      </tr>

      {/* Rows */}
      {!collapsed && category.type === 'coverTypes' && category.coverRows?.map((row) => (
        <CoverTypeRowComp key={row.key} row={row} columns={columns} colWidth={colWidth} showFeatureText={showFeatureText} />
      ))}
      {!collapsed && category.type === 'metrics' && category.metricRows?.map((row) => (
        <MetricRowComp key={row.key} row={row} columns={columns} colWidth={colWidth} showFeatureText={showFeatureText} />
      ))}
    </>
  );
}

// ── Cover type row ───────────────────────────────────────────────────────────

function CoverTypeRowComp({
  row,
  columns,
  colWidth,
  showFeatureText,
}: {
  row: CoverTypeRow;
  columns: ComparisonColumn[];
  colWidth: number;
  showFeatureText: boolean;
}) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50">
      <td className="px-4 py-2.5 bg-white sticky left-0 z-10 border-r border-gray-200">
        <span className="text-xs text-slate-700 font-medium">{row.label}</span>
      </td>
      {columns.map((col) => {
        const val = row.values[col.row.id] || 'Not available';
        return (
          <td
            key={col.row.id}
            className={`px-3 py-2.5 text-center border-r border-gray-100 ${col.isExisting ? 'bg-amber-50/30' : ''}`}
            style={{ minWidth: colWidth }}
          >
            {coverBadge(val)}
            {showFeatureText && (
              <div className="text-[10px] text-slate-400 mt-0.5">
                {val === 'Included' ? 'Bundled with policy' : val === 'Optional' ? 'Available as add-on' : 'Not offered'}
              </div>
            )}
          </td>
        );
      })}
    </tr>
  );
}

// ── Metric row ───────────────────────────────────────────────────────────────

function MetricRowComp({
  row,
  columns,
  colWidth,
  showFeatureText,
}: {
  row: MetricRow;
  columns: ComparisonColumn[];
  colWidth: number;
  showFeatureText: boolean;
}) {
  const allScores = columns.map((c) => row.values[c.row.id]?.score ?? 0);
  const avg = allScores.reduce((a, b) => a + b, 0) / (allScores.length || 1);

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50">
      <td className="px-4 py-2.5 bg-white sticky left-0 z-10 border-r border-gray-200">
        <span className="text-xs text-slate-700 font-medium">{row.label}</span>
      </td>
      {columns.map((col) => {
        const val = row.values[col.row.id];
        if (!val) {
          return (
            <td key={col.row.id} className="px-3 py-2.5 text-center border-r border-gray-100 text-xs text-slate-400" style={{ minWidth: colWidth }}>
              —
            </td>
          );
        }
        return (
          <td
            key={col.row.id}
            className={`px-3 py-2.5 border-r border-gray-100 ${col.isExisting ? 'bg-amber-50/30' : scoreCellBg(val.score)}`}
            style={{ minWidth: colWidth }}
          >
            <div className="flex items-center justify-center gap-2">
              <TrendArrow score={val.score} avg={avg} />
              <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-xs font-bold ${scoreBg(val.score)}`}>
                {val.score}
              </span>
            </div>
            <div className="text-[11px] text-slate-600 text-center mt-0.5 font-medium">
              {fmtM(val.dollarAmount)}
            </div>
            {showFeatureText && (
              <div className="text-[10px] text-slate-400 mt-0.5">
                {val.score >= 70 ? 'Above industry average' : val.score >= 50 ? 'Near industry average' : 'Below industry average'}
              </div>
            )}
          </td>
        );
      })}
    </tr>
  );
}
