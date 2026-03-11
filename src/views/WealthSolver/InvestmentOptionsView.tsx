import { useState } from 'react';
import { X, ExternalLink, FileText } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWealthSolver } from '@/context/WealthSolverContext';
import type { WsPlan, WsInvestmentOption, WsAssetAllocation, WsFee } from '@/types/wealthsolver';
import { allocGrowth, allocDefensive, allocOther, allocTotal } from '@/types/wealthsolver';
import { fmtPct } from './components';

// ── Asset allocation helpers ──────────────────────────────────────────────────

const ALLOC_KEYS: Array<{ key: keyof WsAssetAllocation; label: string; color: string }> = [
  { key: 'domEq',   label: 'Domestic Equity',             color: '#EAB308' },
  { key: 'intlEq',  label: 'International Equity',        color: '#22C55E' },
  { key: 'domProp', label: 'Domestic Property',           color: '#F97316' },
  { key: 'intlProp',label: 'International Property',      color: '#FB923C' },
  { key: 'domFI',   label: 'Domestic Fixed Interest',     color: '#3B82F6' },
  { key: 'intlFI',  label: 'International Fixed Interest',color: '#60A5FA' },
  { key: 'domCash', label: 'Domestic Cash',               color: '#10B981' },
  { key: 'intlCash',label: 'International Cash',          color: '#34D399' },
  { key: 'dirProp', label: 'Direct Property',             color: '#A78BFA' },
  { key: 'alt',     label: 'Alternative',                 color: '#F43F5E' },
  { key: 'other',   label: 'Other',                       color: '#94A3B8' },
];

const EMPTY_ALLOC: WsAssetAllocation = {
  domEq: 0, intlEq: 0, domProp: 0, intlProp: 0, domFI: 0,
  intlFI: 0, domCash: 0, intlCash: 0, dirProp: 0, alt: 0, other: 0,
};

function primaryAlloc(alloc: WsAssetAllocation): string {
  const entries = Object.entries(alloc) as Array<[keyof WsAssetAllocation, number]>;
  const keyMap: Record<keyof WsAssetAllocation, string> = {
    domEq: 'Domestic Equity', intlEq: 'International Equity', domProp: 'Domestic Property',
    intlProp: 'International Property', domFI: 'Domestic Fixed Interest', intlFI: 'International Fixed Interest',
    domCash: 'Domestic Cash', intlCash: 'International Cash', dirProp: 'Direct Property',
    alt: 'Alternative', other: 'Other',
  };
  const max = entries.reduce((a, b) => (a[1] >= b[1] ? a : b), entries[0]);
  return keyMap[max[0]] ?? 'Other';
}

// ── Deterministic pseudo-random past performance ──────────────────────────────

function hashCode(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const PERF_PERIODS = ['1 Month', '3 Month', '6 Month', '1 Year', '2 Year', '3 Year', '5 Year', '7 Year'] as const;

function getPerformanceData(optId: string): { period: string; value: number }[] {
  return PERF_PERIODS.map((period) => {
    const h = hashCode(optId + period);
    // Produce plausible annual-type returns: -5% to 30%
    const value = ((h % 350) - 50) / 10;
    return { period, value };
  });
}

// ── Pie chart ─────────────────────────────────────────────────────────────────

interface PieSlice { label: string; value: number; color: string }

function PieChart({ slices, size = 130 }: { slices: PieSlice[]; size?: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const nonZero = slices.filter((s) => s.value > 0);
  const total = nonZero.reduce((t, s) => t + s.value, 0);

  if (total === 0 || nonZero.length === 0) {
    return (
      <div style={{ width: size, height: size }} className="rounded-full bg-gray-100 flex items-center justify-center">
        <span className="text-xs text-muted-foreground">0%</span>
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;

  let angle = -Math.PI / 2;
  const paths = nonZero.map((slice, i) => {
    const sa = angle;
    const da = (slice.value / total) * 2 * Math.PI;
    angle += da;
    const ea = angle;
    const x1 = cx + r * Math.cos(sa);
    const y1 = cy + r * Math.sin(sa);
    const x2 = cx + r * Math.cos(ea);
    const y2 = cy + r * Math.sin(ea);
    const largeArc = da > Math.PI ? 1 : 0;
    const mid = sa + da / 2;
    return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, slice, i, mid };
  });

  const hov = hovered !== null ? nonZero[hovered] : null;

  return (
    <div className="relative inline-block">
      <svg width={size} height={size} className="overflow-visible">
        {paths.map(({ d, slice, i }) => (
          <path
            key={i}
            d={d}
            fill={slice.color}
            stroke="white"
            strokeWidth={1.5}
            style={{ opacity: hovered === null || hovered === i ? 1 : 0.65, cursor: 'pointer' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </svg>
      {hov && (
        <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20 shadow">
          {hov.label}: {hov.value.toFixed(3)}%
        </div>
      )}
    </div>
  );
}

// ── Bar chart (past performance) ──────────────────────────────────────────────

function BarChart({ data }: { data: { period: string; value: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxAbsVal = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  const chartH = 160;
  const barW = 40;
  const gap = 16;
  const totalW = data.length * (barW + gap);

  return (
    <div className="overflow-x-auto">
      <svg width={totalW} height={chartH + 50} className="block">
        {/* Gridlines */}
        {[0, 25, 50, 75, 100].map((pct) => {
          const y = chartH * (1 - pct / 100);
          return (
            <line key={pct} x1={0} y1={y} x2={totalW} y2={y} stroke="#E5E7EB" strokeWidth={1} />
          );
        })}
        {data.map((d, i) => {
          const x = i * (barW + gap);
          const pctH = (Math.abs(d.value) / maxAbsVal) * chartH;
          const y = d.value >= 0 ? chartH - pctH : chartH;
          const fill = d.value >= 0 ? '#EAB308' : '#F87171';
          const isHov = hovered === i;
          return (
            <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
              <rect x={x} y={y} width={barW} height={pctH} fill={fill} opacity={isHov ? 1 : 0.85} />
              {isHov && (
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={10} fill="#111827" fontWeight="600">
                  {d.value.toFixed(2)}%
                </text>
              )}
              <text x={x + barW / 2} y={chartH + 18} textAnchor="middle" fontSize={9} fill="#6B7280">
                {d.period}
              </text>
            </g>
          );
        })}
        {/* Zero line */}
        <line x1={0} y1={chartH} x2={totalW} y2={chartH} stroke="#9CA3AF" strokeWidth={1.5} />
      </svg>
    </div>
  );
}

// ── Investment Options View ───────────────────────────────────────────────────

interface Props { plan: WsPlan }

export function InvestmentOptionsView({ plan }: Props) {
  const { state, dispatch } = useWealthSolver();
  const [search, setSearch] = useState('');
  const [showAddExisting, setShowAddExisting] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [viewingOption, setViewingOption] = useState<WsInvestmentOption | null>(null);

  const existingIds = new Set(plan.investmentOptions.map((o) => o.id));

  const filtered = plan.investmentOptions.filter(
    (o) => !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.apir.toLowerCase().includes(search.toLowerCase())
  );

  function handleRemove(optionId: string) {
    if (!confirm('Remove this investment option from the plan?')) return;
    dispatch({ type: 'REMOVE_INVESTMENT_OPTION', planId: plan.id, optionId });
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="border border-border rounded px-2 py-1.5 text-xs w-48 focus:outline-none focus:ring-1 focus:ring-teal-600"
            placeholder="filter by name or APIR"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="text-xs text-muted-foreground border border-border rounded px-2 py-1.5">
            Show: All ({plan.investmentOptions.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white h-8 text-xs">
              Add Investments ▾
            </Button>
            <div className="absolute right-0 top-full z-10 hidden group-focus-within:block group-hover:block bg-white border border-border rounded shadow-md py-1 min-w-44">
              <button className="block w-full text-left px-4 py-2 text-xs hover:bg-gray-100" onClick={() => setShowAddExisting(true)}>
                Add Existing Option
              </button>
              <button className="block w-full text-left px-4 py-2 text-xs hover:bg-gray-100" onClick={() => setShowAddCustom(true)}>
                Add Custom Option
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-border rounded">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-white border-b-2 border-border">
              <th className="px-3 py-2 text-left text-muted-foreground font-semibold w-16">Action</th>
              <th className="px-3 py-2 text-left text-muted-foreground font-semibold">Name</th>
              <th className="px-3 py-2 text-left text-muted-foreground font-semibold w-24">APIR</th>
              <th className="px-3 py-2 text-left text-muted-foreground font-semibold w-24">Type</th>
              <th className="px-3 py-2 text-left text-muted-foreground font-semibold w-36">Asset Allocation</th>
              <th className="px-3 py-2 text-right text-muted-foreground font-semibold w-32">Investment Fees and Costs</th>
              <th className="px-3 py-2 text-right text-muted-foreground font-semibold w-28">Performance Fees</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((opt) => (
              <tr key={opt.id} className="border-b border-border hover:bg-gray-50">
                <td className="px-3 py-2">
                  <span className="flex items-center gap-1.5">
                    <button
                      className="text-teal-700 hover:text-teal-900"
                      title={opt.custom ? 'View / Edit investment details' : 'View investment details'}
                      onClick={() => setViewingOption(opt)}
                    >
                      <ExternalLink size={13} />
                    </button>
                    <button
                      className="text-red-400 hover:text-red-600"
                      title="Remove"
                      onClick={() => handleRemove(opt.id)}
                    >
                      ✕
                    </button>
                  </span>
                </td>
                <td className="px-3 py-2 font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => setViewingOption(opt)}>
                  {opt.name}
                </td>
                <td className="px-3 py-2 font-mono text-muted-foreground">{opt.apir}</td>
                <td className="px-3 py-2 text-muted-foreground">{opt.type || '—'}</td>
                <td className="px-3 py-2 text-muted-foreground">{opt.assetAllocation}</td>
                <td className="px-3 py-2 text-right text-blue-600 cursor-pointer hover:underline" onClick={() => setViewingOption(opt)}>
                  {fmtPct(opt.investFees)}
                </td>
                <td className="px-3 py-2 text-right">{fmtPct(opt.perfFees)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  No investment options found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Investment Details Modal (view / edit custom) */}
      {viewingOption && (
        <InvestmentViewModal
          option={viewingOption}
          plan={plan}
          onClose={() => setViewingOption(null)}
          onUpdate={(opt) => {
            dispatch({ type: 'UPDATE_INVESTMENT_OPTION', planId: plan.id, option: opt });
            setViewingOption(opt);
          }}
        />
      )}

      {/* Add Existing Modal */}
      {showAddExisting && (
        <AddExistingModal
          globalOptions={state.globalOptions.filter((o) => !existingIds.has(o.id))}
          onAdd={(opt) => {
            dispatch({ type: 'ADD_INVESTMENT_OPTION', planId: plan.id, option: { ...opt, investmentRebate: 0 } });
            setShowAddExisting(false);
          }}
          onClose={() => setShowAddExisting(false)}
        />
      )}

      {/* Add Custom Modal */}
      {showAddCustom && (
        <AddCustomModal
          plan={plan}
          onAdd={(opt) => {
            dispatch({ type: 'ADD_INVESTMENT_OPTION', planId: plan.id, option: opt });
            setShowAddCustom(false);
          }}
          onClose={() => setShowAddCustom(false)}
        />
      )}
    </div>
  );
}

// ── Investment View Modal (read-only, tabbed) ─────────────────────────────────

type ViewTab = 'assetAllocation' | 'fees' | 'pastPerformance' | 'researchReports' | 'editCustomFund' | 'type' | 'admin' | 'tmd';

const VIEW_TABS_STANDARD: { key: ViewTab; label: string }[] = [
  { key: 'assetAllocation',  label: 'Asset Allocation' },
  { key: 'fees',             label: 'Fees' },
  { key: 'pastPerformance',  label: 'Past Performance' },
  { key: 'researchReports',  label: 'Research Reports' },
  { key: 'type',             label: 'Type' },
  { key: 'admin',            label: 'Admin' },
  { key: 'tmd',              label: 'TMD' },
];

const VIEW_TABS_CUSTOM: { key: ViewTab; label: string }[] = [
  { key: 'assetAllocation',  label: 'Asset Allocation' },
  { key: 'fees',             label: 'Fees' },
  { key: 'pastPerformance',  label: 'Past Performance' },
  { key: 'researchReports',  label: 'Research Reports' },
  { key: 'editCustomFund',   label: 'Edit Custom Fund' },
  { key: 'type',             label: 'Type' },
  { key: 'tmd',              label: 'TMD' },
];

function getFeeSetForOption(fee: WsFee, optionId: string): string {
  const effectiveFee = fee.overrideFee ?? fee;
  for (const set of effectiveFee.feeSets) {
    if ((set.investmentOptionIds ?? []).includes(optionId)) {
      return set.name;
    }
  }
  return 'Excluded';
}

function getAllPlanFees(plan: WsPlan): WsFee[] {
  return [
    ...plan.fees.ongoing,
    ...plan.fees.rebates,
    ...plan.fees.transactional,
    ...plan.fees.commissions,
  ];
}

function InvestmentViewModal({
  option,
  plan,
  onClose,
  onUpdate,
}: {
  option: WsInvestmentOption;
  plan: WsPlan;
  onClose: () => void;
  onUpdate?: (opt: WsInvestmentOption) => void;
}) {
  const tabs = option.custom ? VIEW_TABS_CUSTOM : VIEW_TABS_STANDARD;
  const [tab, setTab] = useState<ViewTab>('assetAllocation');
  const alloc = option.alloc;

  const growth = allocGrowth(alloc);
  const defensive = allocDefensive(alloc);
  const other = allocOther(alloc);
  const total = allocTotal(alloc);

  // Summary pie: growth / defensive / other
  const summarySlices: PieSlice[] = [
    { label: 'Growth',    value: growth,    color: '#EAB308' },
    { label: 'Defensive', value: defensive, color: '#3B82F6' },
    { label: 'Other',     value: other,     color: '#22C55E' },
  ].filter((s) => s.value > 0);

  // Detail pie: each non-zero alloc component
  const detailSlices: PieSlice[] = ALLOC_KEYS
    .filter(({ key }) => alloc[key] > 0)
    .map(({ key, label, color }) => ({ label, value: alloc[key], color }));

  // Past performance
  const perfData = getPerformanceData(option.id);

  // Plan fees (for Fees tab)
  const planFees = getAllPlanFees(plan);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-3 bg-teal-700 text-white flex-shrink-0">
          <span className="text-sm font-semibold">Investment Details</span>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Fund info header */}
          <div className="px-5 py-4 border-b border-border">
            <div className="grid grid-cols-[160px_1fr] gap-y-1.5 text-sm mb-3">
              <span className="text-muted-foreground">Fund Name</span>
              <span className="font-semibold">{option.name}</span>
              <span className="text-muted-foreground">APIR, ASX or other code</span>
              <span className="font-semibold">{option.apir}</span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">Broad Objectives</span>
              <span className="text-sm">{option.broadObjectives || 'n/a'}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border px-5">
            <div className="flex gap-0 flex-wrap">
              {tabs.map(({ key, label }) => (
                <button
                  key={key}
                  className={`px-3 py-2.5 text-xs border-b-2 -mb-px transition-colors ${
                    tab === key
                      ? 'border-teal-700 text-teal-700 font-semibold'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="px-5 py-4">
            {/* ── Asset Allocation ── */}
            {tab === 'assetAllocation' && (
              <div className="flex gap-8">
                {/* Table */}
                <div className="flex-1 min-w-0">
                  <table className="w-full text-sm">
                    <tbody>
                      {ALLOC_KEYS.slice(0, 4).map(({ key, label }) => (
                        <tr key={key} className="border-b border-border/50">
                          <td className="py-1.5 text-muted-foreground">{label}</td>
                          <td className="py-1.5 text-right">{alloc[key].toFixed(3)}%</td>
                        </tr>
                      ))}
                      <tr className="border-b border-border font-semibold">
                        <td className="py-1.5">Total Growth</td>
                        <td className="py-1.5 text-right">{growth.toFixed(3)}%</td>
                      </tr>
                      {ALLOC_KEYS.slice(4, 9).map(({ key, label }) => (
                        <tr key={key} className="border-b border-border/50">
                          <td className="py-1.5 text-muted-foreground">{label}</td>
                          <td className="py-1.5 text-right">{alloc[key].toFixed(3)}%</td>
                        </tr>
                      ))}
                      <tr className="border-b border-border font-semibold">
                        <td className="py-1.5">Total Defensive</td>
                        <td className="py-1.5 text-right">{defensive.toFixed(3)}%</td>
                      </tr>
                      {ALLOC_KEYS.slice(9).map(({ key, label }) => (
                        <tr key={key} className="border-b border-border/50">
                          <td className="py-1.5 text-muted-foreground">{label}</td>
                          <td className="py-1.5 text-right">{alloc[key].toFixed(3)}%</td>
                        </tr>
                      ))}
                      <tr className="border-b border-border font-semibold">
                        <td className="py-1.5">Total Other</td>
                        <td className="py-1.5 text-right">{other.toFixed(3)}%</td>
                      </tr>
                      <tr className="font-bold border-t-2 border-border">
                        <td className="py-1.5">TOTAL</td>
                        <td className="py-1.5 text-right">{total.toFixed(3)}%</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-xs text-muted-foreground mt-3 italic">
                    Note: Allocation and performance data for this Investment Option is automatically updated.
                  </p>
                </div>

                {/* Charts */}
                <div className="flex-shrink-0 flex flex-col items-center gap-6">
                  {summarySlices.length > 0 && (
                    <div className="flex flex-col items-center gap-2">
                      <PieChart slices={summarySlices} size={130} />
                      <div className="flex gap-3 flex-wrap justify-center">
                        {summarySlices.map((s) => (
                          <span key={s.label} className="flex items-center gap-1 text-xs">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                            {s.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {detailSlices.length > 1 && (
                    <div className="flex flex-col items-center gap-2">
                      <PieChart slices={detailSlices} size={160} />
                      <p className="text-xs text-muted-foreground text-center">
                        Overall Asset Allocation: {primaryAlloc(alloc)}
                      </p>
                      <div className="flex gap-2 flex-wrap justify-center max-w-[200px]">
                        {detailSlices.map((s) => (
                          <span key={s.label} className="flex items-center gap-1 text-xs">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                            <span className="truncate max-w-[80px]">{s.label}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Fees ── */}
            {tab === 'fees' && (
              <div>
                <table className="w-full text-sm">
                  <tbody>
                    {/* Plan fee assignments */}
                    {planFees.map((fee) => {
                      const setAssignment = getFeeSetForOption(fee, option.id);
                      return (
                        <tr key={fee.xplanId} className="border-b border-border/60 even:bg-gray-50">
                          <td className="py-1.5 pr-4 text-muted-foreground">{fee.name}</td>
                          <td className="py-1.5">{setAssignment}</td>
                        </tr>
                      );
                    })}

                    {/* Divider */}
                    <tr><td colSpan={2} className="py-2" /></tr>

                    {/* Investment-level fees */}
                    {[
                      { label: 'Investment Fees and Costs', value: fmtPct(option.investFees) },
                      { label: 'Performance Fee',           value: fmtPct(option.perfFees) },
                      { label: 'Transaction Cost',          value: fmtPct(option.transCost) },
                      { label: 'Buy Cost',                  value: fmtPct(option.buyCost) },
                      { label: 'Sell Cost',                 value: fmtPct(option.sellCost) },
                      { label: 'Investment Rebate',         value: fmtPct(option.investmentRebate ?? 0) },
                    ].map(({ label, value }) => (
                      <tr key={label} className="border-b border-border/60 even:bg-gray-50">
                        <td className="py-1.5 pr-4 text-muted-foreground">{label}</td>
                        <td className="py-1.5 text-right">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Past Performance ── */}
            {tab === 'pastPerformance' && (
              <div>
                {/* Performance table */}
                <div className="border border-border rounded overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-border">
                        {perfData.map(({ period }) => (
                          <th key={period} className="px-3 py-2 text-center text-xs font-semibold">{period}</th>
                        ))}
                        <th className="px-3 py-2 text-center text-xs font-semibold">Effective Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {perfData.map(({ period, value }) => (
                          <td key={period} className="px-3 py-2 text-center text-xs">
                            {value.toFixed(2)}%
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center text-xs">31/01/2026</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="px-3 py-1 text-xs text-muted-foreground border-t border-border">Source: FundData</div>
                </div>
                {/* Bar chart */}
                <div className="border border-border rounded p-3">
                  <BarChart data={perfData} />
                </div>
              </div>
            )}

            {/* ── Research Reports ── */}
            {tab === 'researchReports' && (
              <div className="py-4 text-sm text-muted-foreground">
                No research reports available for this investment option.
              </div>
            )}

            {/* ── Edit Custom Fund ── */}
            {tab === 'editCustomFund' && option.custom && onUpdate && (
              <EditCustomFundTab option={option} onUpdate={onUpdate} />
            )}

            {/* ── Type ── */}
            {tab === 'type' && (
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      { label: 'Cash account',       value: option.cashAccount ? 'Yes' : 'No' },
                      { label: 'Ethical investment',  value: option.ethical ? 'Yes' : 'No' },
                      { label: 'SMA',                 value: option.sma ? 'Yes' : 'N/A' },
                    ].map(({ label, value }) => (
                      <tr key={label} className="border-b border-border last:border-0 even:bg-gray-50">
                        <td className="px-4 py-2 text-muted-foreground">{label}</td>
                        <td className="px-4 py-2">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Admin ── */}
            {tab === 'admin' && (
              <div className="text-sm text-muted-foreground py-4">
                No admin details available.
              </div>
            )}

            {/* ── TMD ── */}
            {tab === 'tmd' && (
              <div className="border border-border rounded p-3">
                <div className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer hover:underline">
                  <FileText size={16} />
                  <span>{option.name}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-white flex-shrink-0">
          <span className="text-xs font-bold text-muted-foreground italic">
            Fund<span className="text-blue-600">Data</span>
          </span>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Existing Modal ────────────────────────────────────────────────────────

function AddExistingModal({
  globalOptions,
  onAdd,
  onClose,
}: {
  globalOptions: WsInvestmentOption[];
  onAdd: (opt: WsInvestmentOption) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = globalOptions.filter(
    (o) => !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.apir.toLowerCase().includes(search.toLowerCase())
  );
  const selectedOpt = globalOptions.find((o) => o.id === selected);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <h3 className="text-sm font-semibold mb-3">Add Existing Option</h3>
        <input
          type="text"
          className="border border-border rounded px-2 py-1.5 text-sm w-full mb-3 focus:outline-none focus:ring-1 focus:ring-teal-600"
          placeholder="Search name or APIR…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="border border-border rounded max-h-56 overflow-y-auto mb-3">
          {filtered.map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center gap-3 px-3 py-2 border-b border-border last:border-0 cursor-pointer hover:bg-gray-50 ${selected === opt.id ? 'bg-teal-50' : ''}`}
            >
              <input type="radio" name="existing-opt" className="accent-teal-700" checked={selected === opt.id} onChange={() => setSelected(opt.id)} />
              <span className="flex-1 text-sm">{opt.name}</span>
              <span className="text-xs text-muted-foreground font-mono">{opt.apir}</span>
            </label>
          ))}
          {filtered.length === 0 && <p className="px-3 py-3 text-sm text-muted-foreground">No options available.</p>}
        </div>
        {selectedOpt && (
          <div className="bg-gray-50 border border-border rounded px-3 py-2 text-xs mb-3 grid grid-cols-3 gap-2">
            <span><span className="text-muted-foreground">Invest Fees:</span> {fmtPct(selectedOpt.investFees)}</span>
            <span><span className="text-muted-foreground">Perf Fees:</span> {fmtPct(selectedOpt.perfFees)}</span>
            <span><span className="text-muted-foreground">Trans Cost:</span> {fmtPct(selectedOpt.transCost)}</span>
          </div>
        )}
        <div className="flex gap-2">
          <Button className="bg-teal-700 hover:bg-teal-800 text-white h-8 text-sm" disabled={!selected} onClick={() => selectedOpt && onAdd(selectedOpt)}>
            Add to Plan
          </Button>
          <Button variant="outline" className="h-8 text-sm" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Custom Modal ──────────────────────────────────────────────────────────

// Percent input that shows 4 decimal places on blur and tracks raw string during edit
function PctInput({
  value,
  onChange,
  decimals = 4,
  className = '',
}: {
  value: number;
  onChange: (v: number) => void;
  decimals?: number;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');

  return (
    <input
      type="text"
      inputMode="decimal"
      className={`border border-border rounded px-2 py-0.5 text-right text-xs focus:outline-none focus:ring-1 focus:ring-teal-600 ${className}`}
      value={editing ? raw : `${value.toFixed(decimals)}%`}
      onFocus={() => { setEditing(true); setRaw(String(value)); }}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={() => {
        setEditing(false);
        const n = parseFloat(raw);
        onChange(isNaN(n) ? 0 : n);
      }}
    />
  );
}

function AddCustomModal({
  plan,
  onAdd,
  onClose,
}: {
  plan: WsPlan;
  onAdd: (opt: WsInvestmentOption) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [apir, setApir] = useState('');
  const [investFees, setInvestFees] = useState(0);
  const [perfFees, setPerfFees] = useState(0);
  const [transCost, setTransCost] = useState(0);
  const [buyCost, setBuyCost] = useState(0);
  const [sellCost, setSellCost] = useState(0);
  const [alloc, setAlloc] = useState<WsAssetAllocation>({ ...EMPTY_ALLOC });

  const growth = allocGrowth(alloc);
  const defensive = allocDefensive(alloc);
  const other = allocOther(alloc);
  const total = allocTotal(alloc);
  const canAdd = name.trim() && apir.trim();

  const planFees = getAllPlanFees(plan);

  // For brand-new custom option, no id yet so all fees will show as "Excluded"
  const TEMP_ID = '__new__';

  const fieldCls = 'border border-border rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-600 w-full';
  const computedCls = 'border border-border rounded px-2 py-0.5 text-xs w-full text-right bg-gray-50 text-muted-foreground';

  function setAllocKey(key: keyof WsAssetAllocation, val: number) {
    setAlloc((a) => ({ ...a, [key]: val }));
  }

  function handleOK() {
    const opt: WsInvestmentOption = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      apir: apir.trim(),
      type: '',
      assetAllocation: primaryAlloc(alloc),
      investFees,
      perfFees,
      transCost,
      buyCost,
      sellCost,
      custom: true,
      broadObjectives: '',
      alloc,
      cashAccount: false,
      ethical: false,
      sma: false,
      restricted: false,
      redemptionFreq: 'Daily',
      netAssets: 0,
      incomeDistributions: '',
      managerBackground: '',
      investmentRebate: 0,
    };
    onAdd(opt);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-teal-700 text-white flex-shrink-0">
          <span className="text-sm font-semibold">Add New Investment Option</span>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Name + APIR */}
          <div className="grid grid-cols-[160px_1fr] gap-y-2 gap-x-3 mb-4">
            <label className="text-sm self-center">Name</label>
            <input
              type="text"
              className={`${fieldCls} col-span-1`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Fund name"
            />
            <label className="text-sm self-center">APIR, ASX or other code</label>
            <input
              type="text"
              className={`${fieldCls} w-40`}
              value={apir}
              onChange={(e) => setApir(e.target.value)}
              placeholder="e.g. ABC0001AU"
            />
          </div>

          {/* Two-column: fee inputs (left) + fee set assignments (right) */}
          <div className="flex gap-8 mb-4">
            {/* Left: fee inputs */}
            <div className="flex-shrink-0 w-72">
              {[
                { label: 'Investment Fees and Costs', val: investFees, set: setInvestFees, dec: 4 },
                { label: 'Performance Fee',           val: perfFees,   set: setPerfFees,   dec: 3 },
                { label: '',                          val: null,       set: null,          dec: 0 },
                { label: 'Transaction Cost',          val: transCost,  set: setTransCost,  dec: 4 },
                { label: 'Buy Cost',                  val: buyCost,    set: setBuyCost,    dec: 3 },
                { label: 'Sell Cost',                 val: sellCost,   set: setSellCost,   dec: 3 },
              ].map(({ label, val, set, dec }, i) =>
                label ? (
                  <div key={label} className="flex items-center gap-3 mb-2">
                    <span className="text-sm w-52 flex-shrink-0">{label}</span>
                    <PctInput value={val!} onChange={set!} decimals={dec} className="w-24" />
                  </div>
                ) : (
                  <div key={i} className="h-3" />
                )
              )}
            </div>

            {/* Right: plan fee assignments (informational) */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
                {planFees.map((fee) => {
                  const assignment = getFeeSetForOption(fee, TEMP_ID);
                  return (
                    <div key={fee.xplanId} className="contents">
                      <span className="text-xs text-muted-foreground">{fee.name}:</span>
                      <span className="text-xs text-right">{assignment}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Asset Allocation */}
          <div>
            {/* Growth group */}
            {[
              { key: 'domEq',   label: 'Domestic Equity' },
              { key: 'intlEq',  label: 'International Equity' },
              { key: 'domProp', label: 'Domestic Property' },
              { key: 'intlProp',label: 'International Property' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center mb-1">
                <span className="text-sm w-56">{label}</span>
                <PctInput value={alloc[key as keyof WsAssetAllocation]} onChange={(v) => setAllocKey(key as keyof WsAssetAllocation, v)} decimals={3} className="w-24" />
              </div>
            ))}
            <div className="flex items-center mb-2">
              <span className="text-sm font-bold w-56">Total Growth</span>
              <input readOnly className={`${computedCls} w-24`} value={`${growth.toFixed(3)}%`} />
            </div>

            {/* Defensive group */}
            {[
              { key: 'domFI',   label: 'Domestic Fixed Interest' },
              { key: 'intlFI',  label: 'International Fixed Interest' },
              { key: 'domCash', label: 'Domestic Cash' },
              { key: 'intlCash',label: 'International Cash' },
              { key: 'dirProp', label: 'Direct Property' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center mb-1">
                <span className="text-sm w-56">{label}</span>
                <PctInput value={alloc[key as keyof WsAssetAllocation]} onChange={(v) => setAllocKey(key as keyof WsAssetAllocation, v)} decimals={3} className="w-24" />
              </div>
            ))}
            <div className="flex items-center mb-2">
              <span className="text-sm font-bold w-56">Total Defensive</span>
              <input readOnly className={`${computedCls} w-24`} value={`${defensive.toFixed(3)}%`} />
            </div>

            {/* Other group */}
            {[
              { key: 'alt',   label: 'Alternative' },
              { key: 'other', label: 'Other' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center mb-1">
                <span className="text-sm w-56">{label}</span>
                <PctInput value={alloc[key as keyof WsAssetAllocation]} onChange={(v) => setAllocKey(key as keyof WsAssetAllocation, v)} decimals={3} className="w-24" />
              </div>
            ))}
            <div className="flex items-center mb-2">
              <span className="text-sm font-bold w-56">Total Other</span>
              <input readOnly className={`${computedCls} w-24`} value={`${other.toFixed(3)}%`} />
            </div>

            {/* Grand total */}
            <div className="flex items-center">
              <span className="text-sm font-bold w-56">TOTAL</span>
              <input
                readOnly
                className={`w-24 border border-border rounded px-2 py-0.5 text-xs text-right font-semibold ${
                  Math.abs(total - 100) > 0.001 ? 'bg-red-100 text-red-700 border-red-300' : 'bg-green-50 text-green-700 border-green-300'
                }`}
                value={`${total.toFixed(3)}%`}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-white flex-shrink-0">
          <Button className="bg-white border border-border text-foreground hover:bg-gray-50 h-7 text-xs px-4" disabled={!canAdd} onClick={handleOK}>OK</Button>
          <Button variant="outline" className="h-7 text-xs px-4" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Custom Fund Tab (inside Investment Details modal) ────────────────────

function EditCustomFundTab({
  option,
  onUpdate,
}: {
  option: WsInvestmentOption;
  onUpdate: (opt: WsInvestmentOption) => void;
}) {
  const [form, setForm] = useState<WsInvestmentOption>({ ...option, alloc: { ...option.alloc } });

  const growth = allocGrowth(form.alloc);
  const defensive = allocDefensive(form.alloc);
  const other = allocOther(form.alloc);
  const total = allocTotal(form.alloc);

  const computedCls = 'border border-border rounded px-2 py-0.5 text-xs text-right bg-gray-50 text-muted-foreground w-full';

  function setAllocKey(key: keyof WsAssetAllocation, val: number) {
    setForm((f) => ({ ...f, alloc: { ...f.alloc, [key]: val } }));
  }

  // Column 1: domEq, intlEq, domProp, intlProp
  const col1: Array<keyof WsAssetAllocation> = ['domEq', 'intlEq', 'domProp', 'intlProp'];
  // Column 2: domFI, intlFI, domCash, intlCash, dirProp
  const col2: Array<keyof WsAssetAllocation> = ['domFI', 'intlFI', 'domCash', 'intlCash', 'dirProp'];
  // Column 3: alt, other
  const col3: Array<keyof WsAssetAllocation> = ['alt', 'other'];

  const keyLabel: Record<keyof WsAssetAllocation, string> = {
    domEq: 'Domestic Equity', intlEq: 'International Equity', domProp: 'Domestic Property',
    intlProp: 'International Property', domFI: 'Domestic Fixed Interest', intlFI: 'International Fixed Interest',
    domCash: 'Domestic Cash', intlCash: 'International Cash', dirProp: 'Direct Property',
    alt: 'Alternative', other: 'Other',
  };

  return (
    <div>
      {/* Fees edit row */}
      <div className="border border-border rounded overflow-x-auto mb-5">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              <th className="px-3 py-2 text-left font-semibold">Name</th>
              <th className="px-3 py-2 text-left font-semibold">Code / APIR</th>
              <th className="px-3 py-2 text-right font-semibold">Invest Costs</th>
              <th className="px-3 py-2 text-right font-semibold">Transaction Cost</th>
              <th className="px-3 py-2 text-right font-semibold">Buy Cost</th>
              <th className="px-3 py-2 text-right font-semibold">Sell Cost</th>
              <th className="px-3 py-2 text-right font-semibold">Perf Fee</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-2 py-1.5">
                <input
                  type="text"
                  className="border border-border rounded px-2 py-0.5 text-xs w-40 focus:outline-none focus:ring-1 focus:ring-teal-600"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </td>
              <td className="px-2 py-1.5">
                <input
                  type="text"
                  className="border border-border rounded px-2 py-0.5 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-teal-600"
                  value={form.apir}
                  onChange={(e) => setForm((f) => ({ ...f, apir: e.target.value }))}
                />
              </td>
              <td className="px-2 py-1.5 text-right">
                <PctInput value={form.investFees} onChange={(v) => setForm((f) => ({ ...f, investFees: v }))} decimals={4} className="w-20" />
              </td>
              <td className="px-2 py-1.5 text-right">
                <PctInput value={form.transCost ?? 0} onChange={(v) => setForm((f) => ({ ...f, transCost: v }))} decimals={4} className="w-20" />
              </td>
              <td className="px-2 py-1.5 text-right">
                <PctInput value={form.buyCost ?? 0} onChange={(v) => setForm((f) => ({ ...f, buyCost: v }))} decimals={3} className="w-20" />
              </td>
              <td className="px-2 py-1.5 text-right">
                <PctInput value={form.sellCost ?? 0} onChange={(v) => setForm((f) => ({ ...f, sellCost: v }))} decimals={3} className="w-20" />
              </td>
              <td className="px-2 py-1.5 text-right">
                <PctInput value={form.perfFees ?? 0} onChange={(v) => setForm((f) => ({ ...f, perfFees: v }))} decimals={3} className="w-20" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Asset Allocation */}
      <h4 className="text-sm font-semibold mb-3">Asset Allocation</h4>
      <div className="grid grid-cols-3 gap-x-6 gap-y-1 mb-3">
        {/* Column 1 */}
        <div>
          {col1.map((key) => (
            <div key={key} className="flex items-center gap-2 mb-1">
              <label className="text-xs w-36 flex-shrink-0">{keyLabel[key]}</label>
              <PctInput value={form.alloc[key]} onChange={(v) => setAllocKey(key, v)} decimals={3} className="w-20" />
            </div>
          ))}
        </div>
        {/* Column 2 */}
        <div>
          {col2.map((key) => (
            <div key={key} className="flex items-center gap-2 mb-1">
              <label className="text-xs w-40 flex-shrink-0">{keyLabel[key]}</label>
              <PctInput value={form.alloc[key]} onChange={(v) => setAllocKey(key, v)} decimals={3} className="w-20" />
            </div>
          ))}
        </div>
        {/* Column 3 */}
        <div>
          {col3.map((key) => (
            <div key={key} className="flex items-center gap-2 mb-1">
              <label className="text-xs w-24 flex-shrink-0">{keyLabel[key]}</label>
              <PctInput value={form.alloc[key]} onChange={(v) => setAllocKey(key, v)} decimals={3} className="w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Totals row */}
      <div className="flex items-center gap-6 text-xs border-t border-border pt-2 mb-4">
        <span className="font-semibold">Growth total</span>
        <input readOnly className={`${computedCls} w-20`} value={`${growth.toFixed(3)}%`} />
        <span className="font-semibold ml-4">Defensive total</span>
        <input readOnly className={`${computedCls} w-20`} value={`${defensive.toFixed(3)}%`} />
        <span className="font-semibold ml-4">Other total</span>
        <input readOnly className={`${computedCls} w-20`} value={`${other.toFixed(3)}%`} />
        <span className="font-semibold ml-4">Total</span>
        <input
          readOnly
          className={`w-20 border rounded px-2 py-0.5 text-xs text-right font-semibold ${
            Math.abs(total - 100) > 0.001 ? 'bg-red-100 text-red-700 border-red-300' : 'bg-green-50 text-green-700 border-green-300'
          }`}
          value={`${total.toFixed(3)}%`}
        />
      </div>

      <Button
        className="bg-white border border-border text-foreground hover:bg-gray-50 h-7 text-xs px-4"
        onClick={() => onUpdate({ ...form, assetAllocation: primaryAlloc(form.alloc) })}
      >
        Update
      </Button>
    </div>
  );
}
