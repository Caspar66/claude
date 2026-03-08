import { X, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { Investment } from '@/types/domain';

// ── SVG Pie Chart ─────────────────────────────────────────────────────────────

interface PieSeg {
  value: number;
  color: string;
  label: string;
}

function polarToCart(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function PieChart({ segs, size = 120 }: { segs: PieSeg[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const total = segs.reduce((s, seg) => s + (seg.value || 0), 0);
  if (total === 0) return <div className="text-xs text-muted-foreground p-4">No data</div>;

  let angle = 0;
  const rendered = segs
    .filter((s) => s.value > 0)
    .map((seg) => {
      const sweep = (seg.value / total) * 360;
      const start = angle;
      const end = angle + sweep;
      angle = end;
      const mid = start + sweep / 2;

      const s = polarToCart(cx, cy, r, start);
      const e = polarToCart(cx, cy, r, end);
      const la = sweep > 180 ? 1 : 0;

      let d: string;
      if (sweep >= 359.9) {
        d = `M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx + r - 0.001} ${cy} Z`;
      } else {
        d = `M ${cx} ${cy} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${la} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`;
      }

      const labelR = r + 24;
      const lp = polarToCart(cx, cy, labelR, mid);
      const ip = polarToCart(cx, cy, r + 2, mid);

      return { ...seg, d, mid, lp, ip, sweep };
    });

  const pad = 55;
  const vSize = (r + pad) * 2;

  return (
    <svg
      width={vSize}
      height={vSize}
      viewBox={`${cx - r - pad} ${cy - r - pad} ${vSize} ${vSize}`}
    >
      {rendered.map((seg, i) => (
        <g key={i}>
          <path d={seg.d} fill={seg.color} stroke="white" strokeWidth="0.8" />
          {seg.label && seg.sweep > 3 && (
            <>
              <line
                x1={seg.ip.x}
                y1={seg.ip.y}
                x2={seg.lp.x}
                y2={seg.lp.y}
                stroke="#555"
                strokeWidth="0.7"
              />
              <text
                x={seg.lp.x + (seg.lp.x < cx ? -3 : 3)}
                y={seg.lp.y}
                fontSize="8"
                textAnchor={seg.lp.x < cx ? 'end' : 'start'}
                dominantBaseline="middle"
                fill="#333"
              >
                {seg.label}
              </text>
            </>
          )}
        </g>
      ))}
    </svg>
  );
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────

interface BarDatum {
  label: string;
  value?: number;
}

function BarChart({ data }: { data: BarDatum[] }) {
  const W = 560;
  const H = 220;
  const pl = 58;
  const pr = 10;
  const pt = 10;
  const pb = 30;
  const plotW = W - pl - pr;
  const plotH = H - pt - pb;

  const maxVal = Math.max(...data.filter((d) => d.value !== undefined).map((d) => d.value!), 0);
  const yMax = Math.ceil((maxVal + 3) / 5) * 5;
  const gridLines: number[] = [];
  for (let v = 5; v <= yMax; v += 5) gridLines.push(v);

  const colW = plotW / data.length;
  const barW = Math.max(18, colW * 0.55);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {/* Grid lines */}
      {gridLines.map((v) => {
        const y = pt + plotH * (1 - v / yMax);
        return (
          <g key={v}>
            <line x1={pl} y1={y} x2={W - pr} y2={y} stroke="#e5e7eb" strokeWidth="1" />
            <text x={pl - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="#6b7280">
              {v.toFixed(2)}%
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const cx = pl + colW * i + colW / 2;
        const barH = d.value !== undefined ? (d.value / yMax) * plotH : 0;
        const y = pt + plotH - barH;
        return (
          <g key={d.label}>
            {d.value !== undefined && barH > 0 && (
              <rect x={cx - barW / 2} y={y} width={barW} height={barH} fill="#CCFF00" />
            )}
            <text x={cx} y={H - pb + 13} textAnchor="middle" fontSize="9" fill="#374151">
              {d.label}
            </text>
          </g>
        );
      })}

      {/* Axes */}
      <line x1={pl} y1={pt} x2={pl} y2={H - pb} stroke="#9ca3af" strokeWidth="1" />
      <line x1={pl} y1={H - pb} x2={W - pr} y2={H - pb} stroke="#9ca3af" strokeWidth="1" />
    </svg>
  );
}

// ── Asset Allocation Tab ──────────────────────────────────────────────────────

const GROWTH_KEYS = [
  'Domestic Equity',
  'International Equity',
  'Domestic Property',
  'International Property',
] as const;
const DEF_KEYS = [
  'Domestic Fixed Interest',
  'International Fixed Interest',
  'Domestic Cash',
  'International Cash',
  'Direct Property',
] as const;
const OTHER_KEYS = ['Alternative', 'Other'] as const;

const DETAIL_COLORS: Record<string, string> = {
  'Domestic Equity': '#33bb55',
  'International Equity': '#00cc44',
  'Domestic Property': '#88dd99',
  'International Property': '#aaeebb',
  'Domestic Fixed Interest': '#2255aa',
  'International Fixed Interest': '#4477cc',
  'Domestic Cash': '#005500',
  'International Cash': '#cc4400',
  'Direct Property': '#aa8800',
  Alternative: '#8800aa',
  Other: '#aaaaaa',
};

function allocVal(inv: Investment, key: string): number {
  return (inv.allocation as Record<string, number>)[key] ?? 0;
}

function AssetAllocationTab({ inv }: { inv: Investment }) {
  const growthTotal = GROWTH_KEYS.reduce((s, k) => s + allocVal(inv, k), 0);
  const defTotal = DEF_KEYS.reduce((s, k) => s + allocVal(inv, k), 0);
  const otherTotal = OTHER_KEYS.reduce((s, k) => s + allocVal(inv, k), 0);
  const grandTotal = growthTotal + defTotal + otherTotal;

  const pct = (v: number) => v.toFixed(3) + '%';

  const pie1: PieSeg[] = [
    { value: growthTotal, color: '#EFEF00', label: 'Growth' },
    { value: defTotal, color: '#2d8a4e', label: 'Defensive' },
    ...(otherTotal > 0 ? [{ value: otherTotal, color: '#888', label: 'Other' }] : []),
  ];

  const pie2: PieSeg[] = [
    ...GROWTH_KEYS.map((k) => ({
      value: allocVal(inv, k),
      color: DETAIL_COLORS[k],
      label: allocVal(inv, k) > 0 ? k.replace('International', 'Intl').replace('Domestic', 'Dom') : '',
    })),
    ...DEF_KEYS.map((k) => ({
      value: allocVal(inv, k),
      color: DETAIL_COLORS[k],
      label: allocVal(inv, k) > 0 ? k.replace('International', 'Intl').replace('Domestic', 'Dom') : '',
    })),
    ...OTHER_KEYS.map((k) => ({
      value: allocVal(inv, k),
      color: DETAIL_COLORS[k],
      label: allocVal(inv, k) > 0 ? k : '',
    })),
  ].filter((s) => s.value > 0);

  function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
    return (
      <tr className={cn('border-b border-gray-100', bold && 'bg-gray-50')}>
        <td className={cn('py-1.5 pr-4 text-sm', bold && 'font-semibold')}>{label}</td>
        <td className={cn('py-1.5 text-right text-sm tabular-nums', bold && 'font-semibold')}>
          {pct(value)}
        </td>
      </tr>
    );
  }

  return (
    <div className="flex gap-6 p-4">
      {/* Table */}
      <div className="flex-1 min-w-0">
        <table className="w-full">
          <tbody>
            {GROWTH_KEYS.map((k) => (
              <Row key={k} label={k} value={allocVal(inv, k)} />
            ))}
            <Row label="Total Growth" value={growthTotal} bold />
            {DEF_KEYS.map((k) => (
              <Row key={k} label={k} value={allocVal(inv, k)} />
            ))}
            <Row label="Total Defensive" value={defTotal} bold />
            {OTHER_KEYS.map((k) => (
              <Row key={k} label={k} value={allocVal(inv, k)} />
            ))}
            <Row label="Total Other" value={otherTotal} bold />
            <tr className="border-t-2 border-gray-300">
              <td className="py-1.5 pr-4 text-sm font-bold">TOTAL</td>
              <td className="py-1.5 text-right text-sm font-bold tabular-nums">{pct(grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pie charts */}
      <div className="flex flex-col items-center gap-2 shrink-0">
        <PieChart segs={pie1} size={120} />
        <div className="text-xs text-center text-muted-foreground -mt-2">
          Overall Asset Allocation: {pie1.find((s) => s.value === Math.max(...pie1.map((x) => x.value)))?.label}
        </div>
        <PieChart segs={pie2} size={120} />
      </div>
    </div>
  );
}

// ── Fees Tab ──────────────────────────────────────────────────────────────────

function FeesTab({ inv }: { inv: Investment }) {
  const arrangements = inv.feeArrangements ?? [
    { label: 'Adviser Service Fee', value: 'Set A' },
    { label: 'Brokerage Fee', value: 'Excluded' },
    { label: 'Contribution Fee', value: 'Set A' },
    { label: 'Human Financial SMA Fee', value: 'Excluded' },
    { label: 'Initial Contribution Fee', value: 'Set A' },
    { label: 'Listed Securities Fees', value: 'Set A' },
    { label: 'Managed Funds Fee', value: 'Set A' },
    { label: 'Portfolio Balance Rebate', value: 'Excluded' },
  ];

  const numerical = [
    { label: 'Investment Fees and Costs', value: inv.investCosts },
    { label: 'Performance Fee', value: inv.perfFee },
    { label: 'Transaction Cost', value: inv.transactionCost },
    { label: 'Buy Cost', value: inv.buyCost },
    { label: 'Sell Cost', value: inv.sellCost },
    { label: 'Investment Rebate', value: inv.investmentRebate ?? 0 },
  ];

  const allRows = [
    ...arrangements.map((r) => ({ label: r.label, right: r.value, isNumeric: false })),
    ...numerical.map((r) => ({
      label: r.label,
      right: r.value !== undefined ? r.value.toFixed(2) + '%' : '-',
      isNumeric: true,
    })),
  ];

  return (
    <div className="p-4">
      <div className="border border-border rounded overflow-hidden">
        {allRows.map((row, i) => (
          <div
            key={row.label}
            className={cn(
              'flex justify-between items-center px-4 py-2 text-sm border-b border-gray-100 last:border-0',
              i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
            )}
          >
            <span>{row.label}</span>
            <span className={cn(row.isNumeric && 'tabular-nums')}>{row.right}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Past Performance Tab ──────────────────────────────────────────────────────

function PastPerformanceTab({ inv }: { inv: Investment }) {
  const p = inv.pastPerformance;

  if (!p) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        No performance data available.
      </div>
    );
  }

  const cols = [
    { label: '1 Month', value: p.oneMonth },
    { label: '3 Month', value: p.threeMonth },
    { label: '6 Month', value: p.sixMonth },
    { label: '1 Year', value: p.oneYear },
    { label: '2 Year', value: p.twoYear },
    { label: '3 Year', value: p.threeYear },
    { label: '5 Year', value: p.fiveYear },
    { label: '7 Year', value: p.sevenYear },
  ];

  return (
    <div className="p-4">
      {/* Table */}
      <div className="border border-border rounded overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              {cols.map((c) => (
                <th key={c.label} className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">
                  {c.label}
                </th>
              ))}
              <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">
                Effective Date
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {cols.map((c) => (
                <td key={c.label} className="px-3 py-2 text-right tabular-nums">
                  {c.value !== undefined ? c.value.toFixed(2) + '%' : ''}
                </td>
              ))}
              <td className="px-3 py-2 text-right">{p.effectiveDate ?? ''}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bar chart */}
      <div className="border border-border rounded p-4">
        <BarChart data={cols} />
      </div>
    </div>
  );
}

// ── Type Tab ──────────────────────────────────────────────────────────────────

function TypeTab({ inv }: { inv: Investment }) {
  const rows = [
    { label: 'Cash account', value: inv.isCashAccount ? 'Yes' : 'No' },
    { label: 'Ethical investment', value: inv.isEthical ? 'Yes' : 'No' },
    { label: 'SMA', value: inv.fundType === 'SMA' ? 'Yes' : 'No' },
  ];

  return (
    <div className="p-4">
      <div className="border border-border rounded overflow-hidden">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={cn(
              'flex items-center px-4 py-2.5 text-sm border-b border-gray-100 last:border-0',
              i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
            )}
          >
            <span className="w-48">{row.label}</span>
            <span>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TMD Tab ───────────────────────────────────────────────────────────────────

function TMDTab({ inv }: { inv: Investment }) {
  return (
    <div className="p-4">
      <div className="border border-border rounded overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 cursor-pointer">
          <FileText size={15} className="text-blue-600 shrink-0" />
          <span className="text-blue-600 hover:underline">{inv.name}</span>
        </div>
      </div>
    </div>
  );
}

// ── FundData Logo ─────────────────────────────────────────────────────────────

function FundDataLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="32" height="32" viewBox="0 0 32 32">
        {/* Dot grid approximating the FundData logo */}
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3].map((col) => {
            const opacity = 0.5 + ((row + col) % 3) * 0.17;
            const color = row === 0 || col === 0 ? '#1a3a6b' : '#2d7d7d';
            return (
              <circle
                key={`${row}-${col}`}
                cx={col * 8 + 4}
                cy={row * 8 + 4}
                r={2.5}
                fill={color}
                opacity={opacity}
              />
            );
          })
        )}
      </svg>
      <span className="text-sm font-bold" style={{ color: '#1a3a6b' }}>
        Fund<span style={{ color: '#2d7d7d' }}>Data</span>
      </span>
    </div>
  );
}

// ── Main Dialog ───────────────────────────────────────────────────────────────

interface Props {
  investment: Investment | null;
  open: boolean;
  onClose: () => void;
}

const TABS = [
  { value: 'allocation', label: 'Asset Allocation' },
  { value: 'fees', label: 'Fees' },
  { value: 'performance', label: 'Past Performance' },
  { value: 'research', label: 'Research Reports' },
  { value: 'type', label: 'Type' },
  { value: 'tmd', label: 'TMD' },
];

export function InvestmentDetailsDialog({ investment, open, onClose }: Props) {
  if (!investment) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-4xl w-full p-0 overflow-hidden rounded-lg flex flex-col"
        style={{ maxHeight: '88vh' }}
      >
        {/* Teal header */}
        <div className="flex items-center justify-between px-5 py-3 bg-teal-700 text-white shrink-0">
          <span className="font-semibold text-sm">Investment Details</span>
          <DialogClose className="text-white/80 hover:text-white rounded p-0.5">
            <X size={16} />
          </DialogClose>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {/* Fund info */}
          <div className="px-6 py-5 border-b border-border">
            <div className="grid grid-cols-[170px_1fr] gap-x-6 gap-y-3">
              <span className="text-sm text-muted-foreground">Fund Name</span>
              <span className="text-sm font-semibold">{investment.name}</span>
              <span className="text-sm text-muted-foreground">APIR, ASX or other code</span>
              <span className="text-sm font-semibold">{investment.apirCode || '—'}</span>
              {investment.broadObjectives && (
                <>
                  <span className="text-sm text-muted-foreground pt-0.5">Broad Objectives</span>
                  <span className="text-sm leading-relaxed">{investment.broadObjectives}</span>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="allocation">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-white h-auto px-6 py-0 gap-0">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-700 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent text-xs py-2.5 px-3 h-auto font-normal text-muted-foreground"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="allocation" className="mt-0">
              <AssetAllocationTab inv={investment} />
            </TabsContent>
            <TabsContent value="fees" className="mt-0">
              <FeesTab inv={investment} />
            </TabsContent>
            <TabsContent value="performance" className="mt-0">
              <PastPerformanceTab inv={investment} />
            </TabsContent>
            <TabsContent value="research" className="mt-0">
              <div className="p-6 text-center text-sm text-muted-foreground">
                No research reports available.
              </div>
            </TabsContent>
            <TabsContent value="type" className="mt-0">
              <TypeTab inv={investment} />
            </TabsContent>
            <TabsContent value="tmd" className="mt-0">
              <TMDTab inv={investment} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border shrink-0 bg-white">
          <FundDataLogo />
          <button
            onClick={onClose}
            className="border border-border rounded px-4 py-1.5 text-sm hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
