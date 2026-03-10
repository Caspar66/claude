import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWealthSolver } from '@/context/WealthSolverContext';
import type { WsPlan, WsInvestmentOption, WsAssetAllocation } from '@/types/wealthsolver';
import { allocGrowth, allocDefensive, allocOther, allocTotal } from '@/types/wealthsolver';
import { fmtPct } from './components';

interface Props {
  plan: WsPlan;
}

const ALLOC_KEYS: Array<{ key: keyof WsAssetAllocation; label: string }> = [
  { key: 'domEq', label: 'Domestic Equity' },
  { key: 'intlEq', label: 'International Equity' },
  { key: 'domProp', label: 'Domestic Property' },
  { key: 'intlProp', label: 'International Property' },
  { key: 'domFI', label: 'Domestic Fixed Interest' },
  { key: 'intlFI', label: 'International Fixed Interest' },
  { key: 'domCash', label: 'Domestic Cash' },
  { key: 'intlCash', label: 'International Cash' },
  { key: 'dirProp', label: 'Direct Property' },
  { key: 'alt', label: 'Alternative' },
  { key: 'other', label: 'Other' },
];

const EMPTY_ALLOC: WsAssetAllocation = { domEq: 0, intlEq: 0, domProp: 0, intlProp: 0, domFI: 0, intlFI: 0, domCash: 0, intlCash: 0, dirProp: 0, alt: 0, other: 0 };

export function InvestmentOptionsView({ plan }: Props) {
  const { state, dispatch } = useWealthSolver();
  const [search, setSearch] = useState('');
  const [showAddExisting, setShowAddExisting] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [editingOption, setEditingOption] = useState<WsInvestmentOption | null>(null);

  const existingIds = new Set(plan.investmentOptions.map((o) => o.id));

  const filtered = plan.investmentOptions.filter((o) =>
    !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.apir.toLowerCase().includes(search.toLowerCase())
  );

  function handleRemove(optionId: string) {
    if (!confirm('Remove this investment option from the plan?')) return;
    dispatch({ type: 'REMOVE_INVESTMENT_OPTION', planId: plan.id, optionId });
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="border border-border rounded px-2 py-1.5 text-sm w-56 focus:outline-none focus:ring-1 focus:ring-teal-600"
            placeholder="Search name or APIR…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative group">
          <Button className="bg-teal-700 hover:bg-teal-800 text-white h-8 text-sm">+ Add ▾</Button>
          <div className="absolute right-0 top-full z-10 hidden group-focus-within:block group-hover:block bg-white border border-border rounded shadow-md py-1 min-w-40">
            <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setShowAddExisting(true)}>Add Existing Option</button>
            <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setShowAddCustom(true)}>Add Custom Option</button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-border bg-gray-50">
              <th className="px-2 py-2 text-left text-muted-foreground w-14">Action</th>
              <th className="px-2 py-2 text-left text-muted-foreground">Name</th>
              <th className="px-2 py-2 text-left text-muted-foreground w-24">APIR</th>
              <th className="px-2 py-2 text-left text-muted-foreground w-20">Type</th>
              <th className="px-2 py-2 text-left text-muted-foreground w-36">Asset Allocation</th>
              <th className="px-2 py-2 text-right text-muted-foreground w-32">Invest Fees &amp; Costs</th>
              <th className="px-2 py-2 text-right text-muted-foreground w-24">Perf Fees</th>
              <th className="px-2 py-2 text-right text-muted-foreground w-24">Trans Cost</th>
              <th className="px-2 py-2 text-right text-muted-foreground w-20">Buy</th>
              <th className="px-2 py-2 text-right text-muted-foreground w-20">Sell</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((opt) => (
              <tr key={opt.id} className="border-b border-border hover:bg-gray-50">
                <td className="px-2 py-1.5">
                  <span className="flex items-center gap-1">
                    <button className="text-teal-700 hover:underline" title="Edit" onClick={() => setEditingOption(opt)}>✎</button>
                    <button className="text-red-500 hover:text-red-700" title="Remove" onClick={() => handleRemove(opt.id)}>✕</button>
                  </span>
                </td>
                <td className="px-2 py-1.5 font-medium">{opt.name}</td>
                <td className="px-2 py-1.5 font-mono text-muted-foreground">{opt.apir}</td>
                <td className="px-2 py-1.5 text-muted-foreground">{opt.type || '—'}</td>
                <td className="px-2 py-1.5 text-muted-foreground">{opt.assetAllocation}</td>
                <td className="px-2 py-1.5 text-right">{fmtPct(opt.investFees)}</td>
                <td className="px-2 py-1.5 text-right">{fmtPct(opt.perfFees)}</td>
                <td className="px-2 py-1.5 text-right">{fmtPct(opt.transCost)}</td>
                <td className="px-2 py-1.5 text-right">{fmtPct(opt.buyCost)}</td>
                <td className="px-2 py-1.5 text-right">{fmtPct(opt.sellCost)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-4 text-center text-muted-foreground">No investment options found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

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
          onAdd={(opt) => {
            dispatch({ type: 'ADD_INVESTMENT_OPTION', planId: plan.id, option: opt });
            setShowAddCustom(false);
          }}
          onClose={() => setShowAddCustom(false)}
        />
      )}

      {/* Edit Modal */}
      {editingOption && (
        <InvestmentDetailModal
          option={editingOption}
          onSave={(opt) => {
            dispatch({ type: 'UPDATE_INVESTMENT_OPTION', planId: plan.id, option: opt });
            setEditingOption(null);
          }}
          onClose={() => setEditingOption(null)}
        />
      )}
    </div>
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
            <label key={opt.id} className={`flex items-center gap-3 px-3 py-2 border-b border-border last:border-0 cursor-pointer hover:bg-gray-50 ${selected === opt.id ? 'bg-teal-50' : ''}`}>
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

function AddCustomModal({ onAdd, onClose }: { onAdd: (opt: WsInvestmentOption) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [apir, setApir] = useState('');
  const [investFees, setInvestFees] = useState(0);
  const [perfFees, setPerfFees] = useState<string>('');
  const [transCost, setTransCost] = useState<string>('');
  const [buyCost, setBuyCost] = useState<string>('');
  const [sellCost, setSellCost] = useState<string>('');
  const [alloc, setAlloc] = useState<WsAssetAllocation>({ ...EMPTY_ALLOC });

  const total = allocTotal(alloc);
  const canAdd = name.trim() && apir.trim();

  function handleAdd() {
    const opt: WsInvestmentOption = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      apir: apir.trim(),
      type: '',
      assetAllocation: primaryAlloc(alloc),
      investFees,
      perfFees: perfFees === '' ? null : Number(perfFees),
      transCost: transCost === '' ? null : Number(transCost),
      buyCost: buyCost === '' ? null : Number(buyCost),
      sellCost: sellCost === '' ? null : Number(sellCost),
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

  const inputSm = 'border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-600 w-full';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-sm font-semibold mb-3">Add Custom Option</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-muted-foreground">Name *</label>
            <input className={`${inputSm} mt-0.5`} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">APIR / Code *</label>
            <input className={`${inputSm} mt-0.5`} value={apir} onChange={(e) => setApir(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Invest Fees %</label>
            <input type="number" className={`${inputSm} mt-0.5`} value={investFees} onChange={(e) => setInvestFees(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Perf Fee %</label>
            <input type="number" className={`${inputSm} mt-0.5`} value={perfFees} onChange={(e) => setPerfFees(e.target.value)} placeholder="—" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Trans Cost %</label>
            <input type="number" className={`${inputSm} mt-0.5`} value={transCost} onChange={(e) => setTransCost(e.target.value)} placeholder="—" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Buy Cost %</label>
            <input type="number" className={`${inputSm} mt-0.5`} value={buyCost} onChange={(e) => setBuyCost(e.target.value)} placeholder="—" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Sell Cost %</label>
            <input type="number" className={`${inputSm} mt-0.5`} value={sellCost} onChange={(e) => setSellCost(e.target.value)} placeholder="—" />
          </div>
        </div>

        <h4 className="text-xs font-semibold mb-2">Asset Allocation</h4>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {ALLOC_KEYS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground w-44 flex-shrink-0">{label}</label>
              <input
                type="number"
                className="border border-border rounded px-2 py-1 text-xs w-16 focus:outline-none focus:ring-1 focus:ring-teal-600"
                value={alloc[key]}
                onChange={(e) => setAlloc((a) => ({ ...a, [key]: Number(e.target.value) }))}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          ))}
        </div>
        <div className="text-xs flex gap-6 mb-4">
          <span>Growth: <strong>{allocGrowth(alloc).toFixed(2)}%</strong></span>
          <span>Defensive: <strong>{allocDefensive(alloc).toFixed(2)}%</strong></span>
          <span>Other: <strong>{allocOther(alloc).toFixed(2)}%</strong></span>
          <span className={total !== 100 ? 'text-red-600 font-semibold' : 'text-green-700 font-semibold'}>Total: {total.toFixed(2)}%</span>
        </div>

        <div className="flex gap-2">
          <Button className="bg-teal-700 hover:bg-teal-800 text-white h-8 text-sm" disabled={!canAdd} onClick={handleAdd}>Add</Button>
          <Button variant="outline" className="h-8 text-sm" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Investment Detail Modal (Edit) ────────────────────────────────────────────

function InvestmentDetailModal({
  option,
  onSave,
  onClose,
}: {
  option: WsInvestmentOption;
  onSave: (opt: WsInvestmentOption) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<WsInvestmentOption>({ ...option, alloc: { ...option.alloc } });

  const total = allocTotal(form.alloc);
  const inputSm = 'border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-600 w-full';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-sm font-semibold mb-3">Edit — {option.name}</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: 'Invest Fees %', val: form.investFees, set: (v: number) => setForm((f) => ({ ...f, investFees: v })) },
            { label: 'Perf Fee %', val: form.perfFees ?? '', set: (v: number) => setForm((f) => ({ ...f, perfFees: v || null })) },
            { label: 'Trans Cost %', val: form.transCost ?? '', set: (v: number) => setForm((f) => ({ ...f, transCost: v || null })) },
            { label: 'Buy Cost %', val: form.buyCost ?? '', set: (v: number) => setForm((f) => ({ ...f, buyCost: v || null })) },
            { label: 'Sell Cost %', val: form.sellCost ?? '', set: (v: number) => setForm((f) => ({ ...f, sellCost: v || null })) },
            { label: 'Investment Rebate %', val: form.investmentRebate ?? 0, set: (v: number) => setForm((f) => ({ ...f, investmentRebate: v })) },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="text-xs text-muted-foreground">{label}</label>
              <input type="number" className={`${inputSm} mt-0.5`} value={val} onChange={(e) => set(Number(e.target.value))} />
            </div>
          ))}
        </div>

        <h4 className="text-xs font-semibold mb-2">Asset Allocation</h4>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {ALLOC_KEYS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground w-44 flex-shrink-0">{label}</label>
              <input
                type="number"
                className="border border-border rounded px-2 py-1 text-xs w-16 focus:outline-none focus:ring-1 focus:ring-teal-600"
                value={form.alloc[key]}
                onChange={(e) => setForm((f) => ({ ...f, alloc: { ...f.alloc, [key]: Number(e.target.value) } }))}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          ))}
        </div>
        <div className="text-xs flex gap-6 mb-4">
          <span>Growth: <strong>{allocGrowth(form.alloc).toFixed(2)}%</strong></span>
          <span>Defensive: <strong>{allocDefensive(form.alloc).toFixed(2)}%</strong></span>
          <span>Other: <strong>{allocOther(form.alloc).toFixed(2)}%</strong></span>
          <span className={total !== 100 ? 'text-red-600 font-semibold' : 'text-green-700 font-semibold'}>Total: {total.toFixed(2)}%</span>
        </div>

        <div className="flex gap-2">
          <Button className="bg-teal-700 hover:bg-teal-800 text-white h-8 text-sm" onClick={() => onSave(form)}>Save</Button>
          <Button variant="outline" className="h-8 text-sm" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
