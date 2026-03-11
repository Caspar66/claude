import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useWealthSolver } from '@/context/WealthSolverContext';
import type { WsInvestmentOption, WsAssetAllocation } from '@/types/wealthsolver';
import { allocGrowth, allocDefensive, allocOther, allocTotal } from '@/types/wealthsolver';
import { fmtPct, fmtAssets, ColHead, DRow, YN } from './components';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────

const EMPTY_ALLOC: WsAssetAllocation = {
  domEq: 0, intlEq: 0, domProp: 0, intlProp: 0,
  domFI: 0, intlFI: 0, domCash: 0, intlCash: 0,
  dirProp: 0, alt: 0, other: 0,
};

function primaryAlloc(a: WsAssetAllocation): string {
  const entries = Object.entries(a) as [keyof WsAssetAllocation, number][];
  const top = entries.reduce((best, cur) => cur[1] > best[1] ? cur : best, entries[0]);
  const labels: Record<string, string> = {
    domEq: 'Australian Equity', intlEq: 'International Equity',
    domProp: 'Property', intlProp: 'Property', domFI: 'Fixed Interest',
    intlFI: 'Fixed Interest', domCash: 'Cash', intlCash: 'Cash',
    dirProp: 'Property', alt: 'Alternative', other: 'Diversified',
  };
  return labels[top[0]] ?? 'Diversified';
}

function PctInput({
  value, onChange, decimals = 4, className = '',
}: { value: number; onChange: (v: number) => void; decimals?: number; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');
  return (
    <input
      type="text" inputMode="decimal"
      className={`border border-border rounded px-2 py-0.5 text-right text-xs focus:outline-none focus:ring-1 focus:ring-teal-600 ${className}`}
      value={editing ? raw : `${value.toFixed(decimals)}%`}
      onFocus={() => { setEditing(true); setRaw(String(value)); }}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={() => { setEditing(false); const n = parseFloat(raw); onChange(isNaN(n) ? 0 : n); }}
    />
  );
}

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
  const { state, dispatch } = useWealthSolver();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(state.globalOptions[0]?.id ?? null);
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

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

        {/* Toolbar */}
        <div className="px-3 py-2 border-b border-border flex gap-2">
          <Button className="h-7 text-xs px-3 bg-teal-700 hover:bg-teal-800 text-white" onClick={() => setShowAdd(true)}>
            Add
          </Button>
          <Button
            variant="outline" className="h-7 text-xs px-3"
            disabled={!selected}
            onClick={() => setShowEdit(true)}
          >
            Edit
          </Button>
          <Button
            variant="outline" className="h-7 text-xs px-3 text-red-600 border-red-300 hover:bg-red-50"
            disabled={!selected}
            onClick={() => setShowRemoveConfirm(true)}
          >
            Remove
          </Button>
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
      {/* Add Modal */}
      {showAdd && (
        <InvestmentFormModal
          title="Add Investment Product"
          onSave={(opt) => {
            const newId = `custom-${Date.now()}`;
            dispatch({ type: 'ADD_GLOBAL_OPTION', option: { ...opt, id: newId } });
            setSelectedId(newId);
            setShowAdd(false);
          }}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* Edit Modal */}
      {showEdit && selected && (
        <InvestmentFormModal
          title="Edit Investment Product"
          initial={selected}
          onSave={(opt) => {
            dispatch({ type: 'UPDATE_GLOBAL_OPTION', option: opt });
            setShowEdit(false);
          }}
          onClose={() => setShowEdit(false)}
        />
      )}

      {/* Remove Confirm */}
      {showRemoveConfirm && selected && (
        <Dialog open onOpenChange={() => setShowRemoveConfirm(false)}>
          <DialogContent className="max-w-sm p-0 gap-0">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <span className="text-sm font-semibold">Remove Investment Product</span>
              <DialogClose asChild>
                <button className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
              </DialogClose>
            </div>
            <div className="px-4 py-4 text-sm">
              <p>Are you sure you want to remove <span className="font-semibold">{selected.name}</span>?</p>
              <p className="text-muted-foreground text-xs mt-1">This will not affect plans that already use this option.</p>
            </div>
            <div className="flex justify-end gap-2 px-4 py-2.5 border-t border-border">
              <Button
                className="h-8 text-sm px-4 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  dispatch({ type: 'REMOVE_GLOBAL_OPTION', optionId: selected.id });
                  setSelectedId(state.globalOptions.find((o) => o.id !== selected.id)?.id ?? null);
                  setShowRemoveConfirm(false);
                }}
              >
                Remove
              </Button>
              <Button variant="outline" className="h-8 text-sm px-4" onClick={() => setShowRemoveConfirm(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ── Investment Form Modal (Add / Edit) ────────────────────────────────────────

const ALLOC_FIELDS: { key: keyof WsAssetAllocation; label: string; group: 'growth' | 'defensive' | 'other' }[] = [
  { key: 'domEq',    label: 'Domestic Equity',              group: 'growth'    },
  { key: 'intlEq',   label: 'International Equity',         group: 'growth'    },
  { key: 'domProp',  label: 'Domestic Property',            group: 'growth'    },
  { key: 'intlProp', label: 'International Property',       group: 'growth'    },
  { key: 'domFI',    label: 'Domestic Fixed Interest',      group: 'defensive' },
  { key: 'intlFI',   label: 'International Fixed Interest', group: 'defensive' },
  { key: 'domCash',  label: 'Domestic Cash',                group: 'defensive' },
  { key: 'intlCash', label: 'International Cash',           group: 'defensive' },
  { key: 'dirProp',  label: 'Direct Property',              group: 'defensive' },
  { key: 'alt',      label: 'Alternative',                  group: 'other'     },
  { key: 'other',    label: 'Other',                        group: 'other'     },
];

function InvestmentFormModal({
  title,
  initial,
  onSave,
  onClose,
}: {
  title: string;
  initial?: WsInvestmentOption;
  onSave: (opt: WsInvestmentOption) => void;
  onClose: () => void;
}) {
  const [name, setName]     = useState(initial?.name ?? '');
  const [apir, setApir]     = useState(initial?.apir ?? '');
  const [investFees, setInvestFees] = useState(initial?.investFees ?? 0);
  const [perfFees,   setPerfFees]   = useState(initial?.perfFees   ?? 0);
  const [transCost,  setTransCost]  = useState(initial?.transCost  ?? 0);
  const [buyCost,    setBuyCost]    = useState(initial?.buyCost    ?? 0);
  const [sellCost,   setSellCost]   = useState(initial?.sellCost   ?? 0);
  const [broadObjectives,   setBroadObjectives]   = useState(initial?.broadObjectives   ?? '');
  const [redemptionFreq,    setRedemptionFreq]    = useState(initial?.redemptionFreq    ?? 'Daily');
  const [incomeDistributions, setIncomeDist]      = useState(initial?.incomeDistributions ?? '');
  const [managerBackground, setManagerBackground] = useState(initial?.managerBackground  ?? '');
  const [ethical,     setEthical]     = useState(initial?.ethical     ?? false);
  const [sma,         setSma]         = useState(initial?.sma         ?? false);
  const [cashAccount, setCashAccount] = useState(initial?.cashAccount ?? false);
  const [restricted,  setRestricted]  = useState(initial?.restricted  ?? false);
  const [alloc, setAlloc] = useState<WsAssetAllocation>({ ...EMPTY_ALLOC, ...initial?.alloc });

  const growth    = allocGrowth(alloc);
  const defensive = allocDefensive(alloc);
  const other     = allocOther(alloc);
  const total     = allocTotal(alloc);

  const fieldCls    = 'border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-600 w-full';
  const computedCls = 'border border-border rounded px-2 py-1 text-xs w-full text-right bg-gray-50 text-muted-foreground';

  function handleSave() {
    if (!name.trim() || !apir.trim()) return;
    const opt: WsInvestmentOption = {
      id: initial?.id ?? '',
      name: name.trim(),
      apir: apir.trim(),
      type: ethical ? 'Ethical' : '',
      assetAllocation: primaryAlloc(alloc),
      investFees,
      perfFees,
      transCost,
      buyCost,
      sellCost,
      custom: initial?.custom ?? true,
      broadObjectives,
      alloc,
      cashAccount,
      ethical,
      sma,
      restricted,
      redemptionFreq,
      netAssets: initial?.netAssets ?? 0,
      incomeDistributions,
      managerBackground,
      investmentRebate: initial?.investmentRebate ?? 0,
    };
    onSave(opt);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="flex flex-col p-0 gap-0 overflow-hidden" style={{ width: 760, maxWidth: '95vw', height: 620, maxHeight: '95vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-teal-700 text-white shrink-0">
          <span className="text-sm font-semibold">{title}</span>
          <DialogClose asChild>
            <button className="text-white/80 hover:text-white"><X size={16} /></button>
          </DialogClose>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Name + APIR */}
          <div className="grid grid-cols-[160px_1fr] gap-y-2 gap-x-3 mb-4">
            <label className="text-xs self-center text-muted-foreground">Name</label>
            <input className={fieldCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Fund name" autoFocus />
            <label className="text-xs self-center text-muted-foreground">APIR / Code</label>
            <input className={`${fieldCls} w-40`} value={apir} onChange={(e) => setApir(e.target.value)} placeholder="e.g. ABC0001AU" />
          </div>

          {/* Two-column: fees + booleans */}
          <div className="flex gap-8 mb-4">
            <div className="flex-shrink-0">
              {([
                { label: 'Investment Fees',    val: investFees, set: setInvestFees, dec: 4 },
                { label: 'Performance Fees',   val: perfFees,   set: setPerfFees,   dec: 3 },
                { label: 'Transaction Cost',   val: transCost,  set: setTransCost,  dec: 4 },
                { label: 'Buy Cost',           val: buyCost,    set: setBuyCost,    dec: 3 },
                { label: 'Sell Cost',          val: sellCost,   set: setSellCost,   dec: 3 },
              ] as { label: string; val: number; set: (v: number) => void; dec: number }[]).map(({ label, val, set, dec }) => (
                <div key={label} className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-muted-foreground w-40 flex-shrink-0">{label}</span>
                  <PctInput value={val} onChange={set} decimals={dec} className="w-24" />
                </div>
              ))}
            </div>
            <div className="flex-shrink-0">
              {([
                { label: 'Ethical',      val: ethical,     set: setEthical     },
                { label: 'SMA',          val: sma,         set: setSma         },
                { label: 'Cash Account', val: cashAccount, set: setCashAccount },
                { label: 'Restricted',   val: restricted,  set: setRestricted  },
              ] as { label: string; val: boolean; set: (v: boolean) => void }[]).map(({ label, val, set }) => (
                <label key={label} className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input type="checkbox" className="accent-teal-700" checked={val} onChange={(e) => set(e.target.checked)} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </label>
              ))}
              <div className="mt-1">
                <label className="text-xs text-muted-foreground block mb-1">Redemption Frequency</label>
                <select
                  className="border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-600"
                  value={redemptionFreq}
                  onChange={(e) => setRedemptionFreq(e.target.value)}
                >
                  {['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually'].map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Broad Objectives */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground block mb-1">Broad Objectives</label>
            <textarea
              className="border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-600 w-full h-16 resize-none"
              value={broadObjectives}
              onChange={(e) => setBroadObjectives(e.target.value)}
            />
          </div>

          {/* Asset Allocation */}
          <div className="mb-4">
            <p className="text-xs font-semibold mb-2">Asset Allocation</p>
            <div className="grid grid-cols-2 gap-x-8">
              <div>
                {ALLOC_FIELDS.filter((f) => f.group === 'growth').map(({ key, label }) => (
                  <div key={key} className="flex items-center mb-1">
                    <span className="text-xs text-muted-foreground w-44">{label}</span>
                    <PctInput value={alloc[key]} onChange={(v) => setAlloc((a) => ({ ...a, [key]: v }))} decimals={3} className="w-20" />
                  </div>
                ))}
                <div className="flex items-center mb-2">
                  <span className="text-xs font-semibold w-44">Total Growth</span>
                  <input readOnly className={`${computedCls} w-20`} value={`${growth.toFixed(3)}%`} />
                </div>
                {ALLOC_FIELDS.filter((f) => f.group === 'other').map(({ key, label }) => (
                  <div key={key} className="flex items-center mb-1">
                    <span className="text-xs text-muted-foreground w-44">{label}</span>
                    <PctInput value={alloc[key]} onChange={(v) => setAlloc((a) => ({ ...a, [key]: v }))} decimals={3} className="w-20" />
                  </div>
                ))}
                <div className="flex items-center">
                  <span className="text-xs font-semibold w-44">Total Other</span>
                  <input readOnly className={`${computedCls} w-20`} value={`${other.toFixed(3)}%`} />
                </div>
              </div>
              <div>
                {ALLOC_FIELDS.filter((f) => f.group === 'defensive').map(({ key, label }) => (
                  <div key={key} className="flex items-center mb-1">
                    <span className="text-xs text-muted-foreground w-44">{label}</span>
                    <PctInput value={alloc[key]} onChange={(v) => setAlloc((a) => ({ ...a, [key]: v }))} decimals={3} className="w-20" />
                  </div>
                ))}
                <div className="flex items-center mb-2">
                  <span className="text-xs font-semibold w-44">Total Defensive</span>
                  <input readOnly className={`${computedCls} w-20`} value={`${defensive.toFixed(3)}%`} />
                </div>
                <div className="flex items-center">
                  <span className="text-xs font-semibold w-44">Grand Total</span>
                  <input readOnly className={`${computedCls} w-20`} value={`${total.toFixed(3)}%`} />
                </div>
              </div>
            </div>
          </div>

          {/* Manager Background + Income Distributions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Income Distributions</label>
              <input
                className={fieldCls}
                value={incomeDistributions}
                onChange={(e) => setIncomeDist(e.target.value)}
                placeholder="e.g. Quarterly"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Manager Background</label>
              <textarea
                className="border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-600 w-full h-14 resize-none"
                value={managerBackground}
                onChange={(e) => setManagerBackground(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-2.5 border-t border-border shrink-0">
          <Button
            className="h-8 text-sm px-5 bg-teal-700 hover:bg-teal-800 text-white"
            disabled={!name.trim() || !apir.trim()}
            onClick={handleSave}
          >
            {initial ? 'Save Changes' : 'Add'}
          </Button>
          <Button variant="outline" className="h-8 text-sm px-5" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
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
