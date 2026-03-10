import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWealthSolver } from '@/context/WealthSolverContext';
import type { WsInvestmentOption } from '@/types/wealthsolver';
import { allocGrowth, allocDefensive, allocOther, allocTotal } from '@/types/wealthsolver';
import { fmtPct, fmtAssets, ColHead, DRow, YN } from './components';

const PAGE_SIZE = 20;

// ── SVG Pie Chart ─────────────────────────────────────────────────────────────

function PieChart({ slices }: { slices: Array<{ value: number; color: string; label: string }> }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return <circle cx="60" cy="60" r="50" fill="#e5e7eb" />;

  let angle = -Math.PI / 2;
  const paths: React.ReactElement[] = [];

  slices.forEach((s, i) => {
    if (s.value <= 0) return;
    const sweep = (s.value / total) * 2 * Math.PI;
    const x1 = 60 + 50 * Math.cos(angle);
    const y1 = 60 + 50 * Math.sin(angle);
    angle += sweep;
    const x2 = 60 + 50 * Math.cos(angle);
    const y2 = 60 + 50 * Math.sin(angle);
    const largeArc = sweep > Math.PI ? 1 : 0;
    paths.push(
      <path
        key={i}
        d={`M60,60 L${x1},${y1} A50,50 0 ${largeArc},1 ${x2},${y2} Z`}
        fill={s.color}
      />
    );
  });

  return <>{paths}</>;
}

const ALLOC_COLORS: Record<string, string> = {
  domEq: '#2563eb', intlEq: '#7c3aed', domProp: '#059669', intlProp: '#10b981',
  domFI: '#d97706', intlFI: '#f59e0b', domCash: '#6b7280', intlCash: '#9ca3af',
  dirProp: '#dc2626', alt: '#ec4899', other: '#94a3b8',
};
const ALLOC_LABELS: Record<string, string> = {
  domEq: 'Dom Equity', intlEq: 'Intl Equity', domProp: 'Dom Property', intlProp: 'Intl Property',
  domFI: 'Dom Fixed Int', intlFI: 'Intl Fixed Int', domCash: 'Dom Cash', intlCash: 'Intl Cash',
  dirProp: 'Dir Property', alt: 'Alternative', other: 'Other',
};

export function InvestmentDataPage() {
  const { state } = useWealthSolver();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(state.globalOptions[0]?.id ?? null);
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!search) return state.globalOptions;
    const q = search.toLowerCase();
    return state.globalOptions.filter((o) =>
      o.name.toLowerCase().includes(q) || o.apir.toLowerCase().includes(q)
    );
  }, [state.globalOptions, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selected = state.globalOptions.find((o) => o.id === selectedId);

  // Plans that include the selected option
  const usedByPlans = selected
    ? state.plans.filter((p) => p.investmentOptions.some((o) => o.id === selected.id || o.apir === selected.apir))
    : [];

  function handleSearch() {
    setSearch(searchInput);
    setPage(1);
  }

  function toggleCompare(id: string) {
    setCompareSet((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function allocSlices(opt: WsInvestmentOption) {
    return Object.entries(opt.alloc)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ value: v, color: ALLOC_COLORS[k] ?? '#94a3b8', label: ALLOC_LABELS[k] ?? k }));
  }

  const gdSlices = selected
    ? [
        { value: allocGrowth(selected.alloc), color: '#2563eb', label: 'Growth' },
        { value: allocDefensive(selected.alloc), color: '#d97706', label: 'Defensive' },
        { value: allocOther(selected.alloc), color: '#94a3b8', label: 'Other' },
      ]
    : [];

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left Panel ─────────────────────────── */}
      <div className="w-80 flex-shrink-0 border-r border-border flex flex-col">
        {/* Search */}
        <div className="p-3 border-b border-border flex gap-2">
          <input
            type="text"
            className="flex-1 border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-600"
            placeholder="Name or APIR…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            className="px-3 py-1.5 bg-teal-700 text-white text-sm rounded hover:bg-teal-800"
            onClick={handleSearch}
          >
            Search
          </button>
        </div>

        {/* Fund list */}
        <div className="flex-1 overflow-y-auto">
          {paged.map((opt) => (
            <button
              key={opt.id}
              className={`w-full text-left px-3 py-2 border-b border-border hover:bg-gray-50 ${selectedId === opt.id ? 'border-l-4 border-l-teal-700 bg-teal-50' : 'border-l-4 border-l-transparent'}`}
              onClick={() => setSelectedId(opt.id)}
            >
              <p className="text-sm font-medium leading-tight">{opt.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground font-mono">{opt.apir}</span>
                <span className="text-xs text-muted-foreground">{opt.assetAllocation}</span>
                {opt.ethical && <span className="text-xs bg-green-100 text-green-700 px-1 rounded">Ethical</span>}
              </div>
            </button>
          ))}
          {paged.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">No results.</p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-2 border-t border-border flex items-center justify-center gap-1 flex-wrap">
            <PaginationBtn label="«" onClick={() => setPage(1)} disabled={page === 1} />
            <PaginationBtn label="‹" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} />
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return <PaginationBtn key={p} label={String(p)} onClick={() => setPage(p)} active={p === page} />;
            })}
            <PaginationBtn label="›" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
            <PaginationBtn label="»" onClick={() => setPage(totalPages)} disabled={page === totalPages} />
          </div>
        )}
      </div>

      {/* ── Right Panel ────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4">
        {!selected ? (
          <p className="text-muted-foreground text-sm">Select a fund to view details.</p>
        ) : (
          <>
            {/* Fund Profile */}
            <ColHead title="Fund Profile" defaultOpen>
              <DRow label="Name" value={selected.name} />
              <DRow label="APIR Code" value={<span className="font-mono">{selected.apir}</span>} />
              <DRow label="Net Assets" value={fmtAssets(selected.netAssets)} />
              <DRow label="Broad Objectives" value={selected.broadObjectives} />
              <DRow label="Investment Fees" value={fmtPct(selected.investFees)} />
              <DRow label="Performance Fees" value={fmtPct(selected.perfFees)} />
              <DRow label="Transaction Cost" value={fmtPct(selected.transCost)} />
              <DRow label="Buy Cost" value={fmtPct(selected.buyCost)} />
              <DRow label="Sell Cost" value={fmtPct(selected.sellCost)} />
              <DRow label="Redemption Frequency" value={selected.redemptionFreq} />
              <DRow label="Income Distributions" value={selected.incomeDistributions} />
              <DRow label="Ethical" value={<YN value={selected.ethical} />} />
              <DRow label="SMA" value={<YN value={selected.sma} />} />
              <DRow label="Cash Account" value={<YN value={selected.cashAccount} />} />
              <DRow label="Manager Background" value={selected.managerBackground} />
            </ColHead>

            {/* Asset Allocation */}
            <ColHead title="Asset Allocation" defaultOpen>
              <div className="px-4 py-3 flex gap-8 flex-wrap">
                {/* Growth/Defensive pie */}
                <div className="flex flex-col items-center gap-2">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <PieChart slices={gdSlices} />
                  </svg>
                  <div className="flex flex-col gap-1">
                    {gdSlices.map((s) => (
                      <div key={s.label} className="flex items-center gap-1.5 text-xs">
                        <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                        {s.label}: {s.value.toFixed(1)}%
                      </div>
                    ))}
                  </div>
                </div>
                {/* Detailed pie */}
                <div className="flex flex-col items-center gap-2">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <PieChart slices={allocSlices(selected)} />
                  </svg>
                  <div className="flex flex-col gap-1">
                    {allocSlices(selected).map((s) => (
                      <div key={s.label} className="flex items-center gap-1.5 text-xs">
                        <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                        {s.label}: {s.value.toFixed(1)}%
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Allocation table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <tbody>
                    {Object.entries(selected.alloc).map(([k, v]) => (
                      <tr key={k} className="border-b border-border last:border-0">
                        <td className="px-3 py-1 text-muted-foreground w-48">{ALLOC_LABELS[k] ?? k}</td>
                        <td className="px-3 py-1 text-right">{v.toFixed(2)}%</td>
                      </tr>
                    ))}
                    <tr className="font-semibold border-t-2 border-border">
                      <td className="px-3 py-1">Total</td>
                      <td className="px-3 py-1 text-right">{allocTotal(selected.alloc).toFixed(2)}%</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1 text-muted-foreground">Growth</td>
                      <td className="px-3 py-1 text-right">{allocGrowth(selected.alloc).toFixed(2)}%</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1 text-muted-foreground">Defensive</td>
                      <td className="px-3 py-1 text-right">{allocDefensive(selected.alloc).toFixed(2)}%</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1 text-muted-foreground">Other</td>
                      <td className="px-3 py-1 text-right">{allocOther(selected.alloc).toFixed(2)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ColHead>

            {/* Used By Plans */}
            <ColHead title="Used By Plans" defaultOpen>
              {usedByPlans.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">Not used by any plans.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-gray-50">
                      <th className="px-3 py-1.5 text-left text-xs text-muted-foreground w-8">
                        <input
                          type="checkbox"
                          className="accent-teal-700"
                          checked={usedByPlans.every((p) => compareSet.has(p.id))}
                          onChange={(e) => {
                            setCompareSet((s) => {
                              const next = new Set(s);
                              usedByPlans.forEach((p) => e.target.checked ? next.add(p.id) : next.delete(p.id));
                              return next;
                            });
                          }}
                        />
                      </th>
                      <th className="px-3 py-1.5 text-left text-xs text-muted-foreground">Plan Name</th>
                      <th className="px-3 py-1.5 text-left text-xs text-muted-foreground">Manager</th>
                      <th className="px-3 py-1.5 text-left text-xs text-muted-foreground">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usedByPlans.map((p) => (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                        <td className="px-3 py-1.5">
                          <input type="checkbox" className="accent-teal-700" checked={compareSet.has(p.id)} onChange={() => toggleCompare(p.id)} />
                        </td>
                        <td className="px-3 py-1.5">
                          <button className="text-teal-700 hover:underline text-sm" onClick={() => navigate(`/research/plans/${p.id}`)}>
                            {p.name}
                          </button>
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground text-sm">{p.manager}</td>
                        <td className="px-3 py-1.5 text-muted-foreground text-sm">{p.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {compareSet.size >= 2 && (
                <div className="px-3 py-2 border-t border-border">
                  <button className="px-3 py-1.5 bg-teal-700 text-white text-sm rounded hover:bg-teal-800">
                    Compare ({compareSet.size})
                  </button>
                </div>
              )}
            </ColHead>
          </>
        )}
      </div>
    </div>
  );
}

function PaginationBtn({
  label,
  onClick,
  disabled,
  active,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      className={`px-2 py-1 text-xs rounded border ${active ? 'bg-teal-700 text-white border-teal-700' : 'border-border hover:bg-gray-100'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
