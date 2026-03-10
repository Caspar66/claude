import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useWealthSolver } from '@/context/WealthSolverContext';
import type { WsPlan, WsFee, WsFeeSet, WsFeeTier } from '@/types/wealthsolver';

const REMAINING = 99999999999;

interface Props {
  plan: WsPlan;
}

export function EditFees({ plan }: Props) {
  const [editingFee, setEditingFee] = useState<{ fee: WsFee; category: 'ongoing' | 'rebates' | 'transactional' | 'commissions' } | null>(null);

  function allFees() {
    return [
      { label: 'Ongoing Costs', fees: plan.fees.ongoing, category: 'ongoing' as const },
      { label: 'Rebates', fees: plan.fees.rebates, category: 'rebates' as const },
      { label: 'Transactional Costs', fees: plan.fees.transactional, category: 'transactional' as const },
      { label: 'Commission Details', fees: plan.fees.commissions, category: 'commissions' as const },
    ];
  }

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-base font-semibold mb-4">Edit Fees — {plan.name}</h2>

      {allFees().map(({ label, fees, category }) => (
        <div key={label} className="mb-6">
          <h3 className="text-sm font-semibold text-white bg-gradient-to-r from-teal-700 to-teal-600 px-3 py-1.5 rounded-t">
            {label}
          </h3>
          <div className="border border-t-0 border-border rounded-b divide-y divide-border">
            {fees.map((fee) => (
              <div key={fee.xplanId} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium">{fee.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{fee.prodCostDesc}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setEditingFee({ fee, category })}
                >
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {editingFee && (
        <FeeEditModal
          planId={plan.id}
          fee={editingFee.fee}
          category={editingFee.category}
          onClose={() => setEditingFee(null)}
        />
      )}
    </div>
  );
}

// ── Fee Edit Modal ────────────────────────────────────────────────────────────

const EXCHANGES = ['ASX', 'AXW', 'FND', 'CASH', 'TD'];
const FEE_BASES = ['Account balance', 'Investment balance', 'Fixed'];
const AGGREGATION_OPTIONS = [
  { value: 'plan_balance', label: 'Plan balance' },
  { value: 'set', label: 'Total allocation for set' },
  { value: 'investment_allocation', label: 'Investment Allocation' },
  { value: 'member_balance', label: 'Balance of members accounts' },
  { value: 'family_balance', label: 'Balance of family accounts' },
];
const MIN_MAX_OPTIONS = [
  { value: 'none', label: 'No min/max' },
  { value: 'plan', label: 'Plan (old method)' },
  { value: 'set', label: 'Set' },
];

function FeeEditModal({
  planId,
  fee: initialFee,
  category,
  onClose,
}: {
  planId: string;
  fee: WsFee;
  category: 'ongoing' | 'rebates' | 'transactional' | 'commissions';
  onClose: () => void;
}) {
  const { dispatch } = useWealthSolver();
  const [tab, setTab] = useState<'tiers' | 'allocation' | 'structure'>('tiers');
  const [fee, setFee] = useState<WsFee>(JSON.parse(JSON.stringify(initialFee)));

  function updateFee<K extends keyof WsFee>(key: K, value: WsFee[K]) {
    setFee((f) => ({ ...f, [key]: value }));
  }

  function updateSet(setIdx: number, patch: Partial<WsFeeSet>) {
    setFee((f) => ({
      ...f,
      feeSets: f.feeSets.map((s, i) => (i === setIdx ? { ...s, ...patch } : s)),
    }));
  }

  function updateTier(setIdx: number, tierIdx: number, patch: Partial<WsFeeTier>) {
    setFee((f) => ({
      ...f,
      feeSets: f.feeSets.map((s, i) =>
        i !== setIdx
          ? s
          : { ...s, tiers: s.tiers.map((t, j) => (j === tierIdx ? { ...t, ...patch } : t)) }
      ),
    }));
  }

  function addTier(setIdx: number) {
    setFee((f) => ({
      ...f,
      feeSets: f.feeSets.map((s, i) =>
        i !== setIdx
          ? s
          : {
              ...s,
              tiers: [
                ...s.tiers.slice(0, -1).map((t) => ({ ...t })),
                { feePercent: 0, feeDollar: 0, tierLimit: 1000000 },
                { ...s.tiers[s.tiers.length - 1] },
              ],
            }
      ),
    }));
  }

  function removeTier(setIdx: number, tierIdx: number) {
    setFee((f) => ({
      ...f,
      feeSets: f.feeSets.map((s, i) =>
        i !== setIdx || s.tiers.length <= 1
          ? s
          : { ...s, tiers: s.tiers.filter((_, j) => j !== tierIdx) }
      ),
    }));
  }

  function handleSave() {
    dispatch({ type: 'UPDATE_PLAN_FEES', planId, category, fee });
    onClose();
  }

  const inputSm = 'border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-600';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-1">
          <h3 className="text-sm font-semibold mb-3">{fee.name}</h3>

          {/* Tabs */}
          <div className="flex border-b border-border mb-4">
            {(['tiers', 'allocation', 'structure'] as const).map((t) => (
              <button
                key={t}
                className={`px-4 py-2 text-xs capitalize border-b-2 -mb-px ${tab === t ? 'border-teal-700 text-teal-700 font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* ── Tiers Tab ── */}
          {tab === 'tiers' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Fee ID</label>
                  <p className="text-xs font-mono mt-0.5">{fee.xplanId}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Fee Basis</label>
                  <select className={`${inputSm} w-full mt-0.5`} value={fee.feeBasis} onChange={(e) => updateFee('feeBasis', e.target.value)}>
                    {FEE_BASES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Base Fee ($)</label>
                <input type="number" className={`${inputSm} w-32 block mt-0.5`} value={fee.baseDollar} onChange={(e) => updateFee('baseDollar', Number(e.target.value))} />
              </div>

              {fee.feeSets.map((feeSet, si) => (
                <div key={feeSet.shortId} className="border border-border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold">Set {feeSet.shortId} — {feeSet.name}</p>
                  </div>
                  <table className="w-full text-xs mb-2">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1 pr-2 text-muted-foreground">{fee.isDollar ? 'Amount ($)' : 'Fee (%)'}</th>
                        <th className="text-left py-1 pr-2 text-muted-foreground">Tier Limit ($)</th>
                        <th className="w-6" />
                      </tr>
                    </thead>
                    <tbody>
                      {feeSet.tiers.map((tier, ti) => (
                        <tr key={ti} className="border-b border-border last:border-0">
                          <td className="py-1 pr-2">
                            <input
                              type="number"
                              className={`${inputSm} w-24`}
                              value={fee.isDollar ? tier.feeDollar : tier.feePercent}
                              onChange={(e) =>
                                updateTier(si, ti, fee.isDollar ? { feeDollar: Number(e.target.value) } : { feePercent: Number(e.target.value) })
                              }
                            />
                          </td>
                          <td className="py-1 pr-2">
                            {tier.tierLimit === REMAINING ? (
                              <span className="text-muted-foreground italic">Remaining</span>
                            ) : (
                              <input
                                type="number"
                                className={`${inputSm} w-28`}
                                value={tier.tierLimit}
                                onChange={(e) => updateTier(si, ti, { tierLimit: Number(e.target.value) })}
                              />
                            )}
                          </td>
                          <td>
                            {feeSet.tiers.length > 1 && (
                              <button className="text-red-500 hover:text-red-700 text-xs" onClick={() => removeTier(si, ti)}>✕</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="text-xs text-teal-700 hover:underline" onClick={() => addTier(si)}>+ Add tier</button>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Set Min ($)</label>
                      <input type="number" className={`${inputSm} w-full mt-0.5`} value={feeSet.minDollar} onChange={(e) => updateSet(si, { minDollar: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Set Max ($)</label>
                      <input type="number" className={`${inputSm} w-full mt-0.5`} value={feeSet.maxDollar} onChange={(e) => updateSet(si, { maxDollar: Number(e.target.value) })} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Allocation Tab ── */}
          {tab === 'allocation' && (
            <div>
              <p className="text-xs text-muted-foreground mb-3">Assign each exchange to a fee set or mark as Excluded.</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 pr-3 text-xs text-muted-foreground">Exchange</th>
                    {fee.feeSets.map((s) => (
                      <th key={s.shortId} className="text-left py-1.5 pr-3 text-xs text-muted-foreground">Set {s.shortId}</th>
                    ))}
                    <th className="text-left py-1.5 text-xs text-muted-foreground">Excluded</th>
                  </tr>
                </thead>
                <tbody>
                  {EXCHANGES.map((ex) => {
                    const assignedSet = fee.feeSets.find((s) => s.shareExchanges?.some((e) => e.code === ex))?.shortId ?? 'excluded';
                    return (
                      <tr key={ex} className="border-b border-border last:border-0">
                        <td className="py-1.5 pr-3 text-xs font-mono">{ex}</td>
                        {fee.feeSets.map((s) => (
                          <td key={s.shortId} className="py-1.5 pr-3">
                            <input
                              type="radio"
                              name={`ex-${ex}`}
                              checked={assignedSet === s.shortId}
                              className="accent-teal-700"
                              onChange={() => {
                                setFee((f) => ({
                                  ...f,
                                  feeSets: f.feeSets.map((fs) => ({
                                    ...fs,
                                    shareExchanges: fs.shortId === s.shortId
                                      ? [...(fs.shareExchanges ?? []).filter((e) => e.code !== ex), { code: ex }]
                                      : (fs.shareExchanges ?? []).filter((e) => e.code !== ex),
                                  })),
                                }));
                              }}
                            />
                          </td>
                        ))}
                        <td className="py-1.5">
                          <input
                            type="radio"
                            name={`ex-${ex}`}
                            checked={assignedSet === 'excluded'}
                            className="accent-teal-700"
                            onChange={() => {
                              setFee((f) => ({
                                ...f,
                                feeSets: f.feeSets.map((fs) => ({
                                  ...fs,
                                  shareExchanges: (fs.shareExchanges ?? []).filter((e) => e.code !== ex),
                                })),
                              }));
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Structure Tab ── */}
          {tab === 'structure' && (
            <div className="space-y-4 text-sm">
              <StructureSelect label="Aggregation Method" value={fee.aggregationOption} options={AGGREGATION_OPTIONS} onChange={(v) => updateFee('aggregationOption', v)} />
              <StructureSelect label="Min/Max Applied" value={fee.minMaxApplied} options={MIN_MAX_OPTIONS} onChange={(v) => updateFee('minMaxApplied', v)} />
              <div>
                <label className="text-xs text-muted-foreground">Fee Type</label>
                <div className="flex gap-4 mt-1">
                  {['Flat', 'Progressive'].map((v) => (
                    <label key={v} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input type="radio" className="accent-teal-700" name="feeType" checked={fee.isFlat === (v === 'Flat')} onChange={() => updateFee('isFlat', v === 'Flat')} />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Amount Type</label>
                <div className="flex gap-4 mt-1">
                  {['Percentage', 'Dollar'].map((v) => (
                    <label key={v} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input type="radio" className="accent-teal-700" name="amtType" checked={fee.isDollar === (v === 'Dollar')} onChange={() => updateFee('isDollar', v === 'Dollar')} />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Include Base Fee in min/max</label>
                <div className="flex gap-4 mt-1">
                  {['Yes', 'No'].map((v) => (
                    <label key={v} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input type="radio" className="accent-teal-700" name="baseInMM" checked={fee.includeBaseInMinMax === (v === 'Yes')} onChange={() => updateFee('includeBaseInMinMax', v === 'Yes')} />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Plan-level Min ($)</label>
                  <input type="number" className="border border-border rounded px-2 py-1 text-xs w-full mt-0.5 focus:outline-none focus:ring-1 focus:ring-teal-600" value={fee.minDollar} onChange={(e) => updateFee('minDollar', Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Plan-level Max ($)</label>
                  <input type="number" className="border border-border rounded px-2 py-1 text-xs w-full mt-0.5 focus:outline-none focus:ring-1 focus:ring-teal-600" value={fee.maxDollar} onChange={(e) => updateFee('maxDollar', Number(e.target.value))} />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-6 pt-4 border-t border-border">
            <Button onClick={handleSave} className="bg-teal-700 hover:bg-teal-800 text-white h-8 text-sm">Save</Button>
            <Button variant="outline" className="h-8 text-sm" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StructureSelect({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <select
        className="border border-border rounded px-2 py-1 text-xs w-full mt-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
