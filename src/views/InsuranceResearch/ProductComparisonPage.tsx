import { useState } from 'react';
import { ArrowUp, ArrowDown, Minus, Search, Download, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuoteResultRow } from './quoteResultsData';

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

  return [
    { key: 'coverTypes', label: 'PRODUCT COVER TYPES', type: 'coverTypes', coverRows: coverTypes },
    { key: 'netPolicyRevenue', label: 'NET POLICY REVENUE ($MILLION)', type: 'metrics', metricRows: netPolicyRevenue },
    { key: 'netTotalRevenue', label: 'NET TOTAL REVENUE ($MILLION)', type: 'metrics', metricRows: netTotalRevenue },
    { key: 'netProfit', label: 'NET PROFIT ($MILLION)', type: 'metrics', metricRows: netProfit },
    { key: 'totalAssets', label: 'TOTAL ASSETS ($MILLION)', type: 'metrics', metricRows: totalAssets },
    { key: 'netAssets', label: 'NET ASSETS ($MILLION)', type: 'metrics', metricRows: netAssets },
  ];
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

  const columns: ComparisonColumn[] = selectedRows.map((row) => ({
    row,
    isExisting: row.id === existingRowId,
  }));

  const categories = generateComparisonData(columns);

  function toggleCategory(key: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Filter categories / rows by search
  const filteredCategories = categories.map((cat) => {
    if (!searchTerm) return cat;
    const term = searchTerm.toLowerCase();
    if (cat.label.toLowerCase().includes(term)) return cat; // whole category matches

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

  const colWidth = Math.max(180, Math.min(220, Math.floor(700 / columns.length)));

  return (
    <div className="flex flex-col h-full bg-white">
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
      </div>

      {/* Scrollable comparison table */}
      <div className="flex-1 overflow-auto">
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
                    <span className={`text-sm font-bold ${col.row.insurerColor}`}>
                      {col.row.insurerShort}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight line-clamp-2 max-w-[180px]">
                      {col.row.product}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      {fmt(col.row.annualPremium)} p.a.
                    </span>
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold ${scoreBg(col.row.featureScore)}`}>
                      Feature: {col.row.featureScore}
                    </span>
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
                />
              );
            })}
            {filteredCategories.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-muted-foreground">
                  No comparison parameters match "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-gray-50">
        <span className="text-xs text-slate-500">
          Comparing {columns.length} product{columns.length !== 1 ? 's' : ''}
        </span>
        <Button
          size="sm"
          className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-7 gap-1.5"
        >
          <Download size={12} />
          Download Comparison Report
        </Button>
      </div>
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
}: {
  category: ComparisonCategory;
  columns: ComparisonColumn[];
  collapsed: boolean;
  onToggle: () => void;
  colWidth: number;
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
        <CoverTypeRowComp key={row.key} row={row} columns={columns} colWidth={colWidth} />
      ))}
      {!collapsed && category.type === 'metrics' && category.metricRows?.map((row) => (
        <MetricRowComp key={row.key} row={row} columns={columns} colWidth={colWidth} />
      ))}
    </>
  );
}

// ── Cover type row ───────────────────────────────────────────────────────────

function CoverTypeRowComp({
  row,
  columns,
  colWidth,
}: {
  row: CoverTypeRow;
  columns: ComparisonColumn[];
  colWidth: number;
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
}: {
  row: MetricRow;
  columns: ComparisonColumn[];
  colWidth: number;
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
          </td>
        );
      })}
    </tr>
  );
}
