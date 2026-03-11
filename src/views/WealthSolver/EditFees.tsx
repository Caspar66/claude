import { useState } from 'react';
import { Pencil, RotateCcw, BarChart2, Settings, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWealthSolver } from '@/context/WealthSolverContext';
import type { WsPlan, WsFee, WsFeeSet } from '@/types/wealthsolver';
import {
  AGGREGATION_OPTIONS,
  BALANCE_AGGREGATION_TYPES,
  TIER_COUNT_OPTIONS,
  SHARE_EXCHANGES,
  generateFeeDescription,
  numTiersFromOption,
} from '@/types/wealthsolver';

// ── Constants ─────────────────────────────────────────────────────────────────

const REMAINING = 99999999999;

type FeeCategory = 'ongoing' | 'rebates' | 'transactional' | 'commissions';

const FEE_SECTIONS: { label: string; category: FeeCategory }[] = [
  { label: 'Ongoing costs', category: 'ongoing' },
  { label: 'Rebates', category: 'rebates' },
  { label: 'Transactional Costs', category: 'transactional' },
  { label: 'Commission Details', category: 'commissions' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDollar(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);
}

function fmtPct(n: number) {
  return `${n.toFixed(4).replace(/\.?0+$/, '')}%`;
}

function getFeeDisplayDesc(fee: WsFee): string {
  if (fee.researchDescription) return fee.researchDescription;
  if (fee.prodCostDesc) return fee.prodCostDesc;
  return generateFeeDescription(fee);
}

// ── Edit Fees Root ────────────────────────────────────────────────────────────

interface Props {
  plan: WsPlan;
  onBack: () => void;
}

export function EditFees({ plan, onBack }: Props) {
  const [editingFee, setEditingFee] = useState<{ fee: WsFee; category: FeeCategory } | null>(null);

  if (editingFee) {
    return (
      <FeeEditPage
        plan={plan}
        fee={editingFee.fee}
        category={editingFee.category}
        onClose={() => setEditingFee(null)}
      />
    );
  }

  return <FeeListPage plan={plan} onBack={onBack} onEdit={setEditingFee} />;
}

// ── Fee List Page ─────────────────────────────────────────────────────────────

function FeeListPage({
  plan,
  onBack,
  onEdit,
}: {
  plan: WsPlan;
  onBack: () => void;
  onEdit: (entry: { fee: WsFee; category: FeeCategory }) => void;
}) {
  const { state, dispatch } = useWealthSolver();
  const isDerived = !!plan.derivedFromId;
  const sourcePlan = isDerived ? state.plans.find((p) => p.id === plan.derivedFromId) : undefined;

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleSection(label: string) {
    setCollapsed((c) => ({ ...c, [label]: !c[label] }));
  }

  function getResearchFee(fee: WsFee, category: FeeCategory): WsFee | undefined {
    if (!sourcePlan) return undefined;
    return sourcePlan.fees[category].find((f) => f.xplanId === fee.xplanId);
  }

  function handleUndo(fee: WsFee, category: FeeCategory) {
    dispatch({ type: 'UNDO_DERIVED_PLAN_FEE_OVERRIDE', planId: plan.id, category, feeId: fee.xplanId });
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-end px-4 py-2 border-b border-border">
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onBack}>
          Back
        </Button>
      </div>

      <div className="p-4">
        <h2 className="text-sm font-semibold mb-4">
          Edit Fees: <span className="font-bold">{plan.name}{isDerived ? ' <Derived>' : ''}</span>
        </h2>

        {FEE_SECTIONS.map(({ label, category }) => {
          const fees = plan.fees[category];
          const isCollapsed = collapsed[label];

          return (
            <div key={label} className="mb-4 border border-border rounded overflow-hidden">
              {/* Section header */}
              <div
                className="flex items-center justify-between px-4 py-2.5 bg-teal-700 text-white cursor-pointer select-none"
                onClick={() => toggleSection(label)}
              >
                <span className="text-sm font-semibold">{label}</span>
                {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </div>

              {!isCollapsed && (
                <>
                  {/* Add button row */}
                  <div className="flex justify-end px-3 py-1.5 border-b border-border bg-white">
                    <div className="flex items-center gap-1 border border-border rounded text-xs px-2 py-1 cursor-pointer hover:bg-gray-50">
                      Add <ChevronDown size={12} />
                    </div>
                  </div>

                  {/* Column headers */}
                  <div className="grid text-xs font-semibold text-foreground px-4 py-2 bg-white border-b border-border"
                    style={{ gridTemplateColumns: isDerived ? '48px 1fr 1fr 1fr 40px' : '48px 1fr 1fr 40px' }}
                  >
                    <div>Action</div>
                    <div>Fee name</div>
                    <div>{isDerived ? 'Research' : 'Value'}</div>
                    {isDerived && <div>Custom/Override</div>}
                    <div />
                  </div>

                  {/* Fee rows */}
                  {fees.map((fee) => {
                    const researchFee = getResearchFee(fee, category);
                    const hasOverride = !!fee.overrideFee;
                    const displayFee = isDerived && hasOverride ? fee.overrideFee! : fee;
                    const researchDesc = researchFee ? getFeeDisplayDesc(researchFee) : getFeeDisplayDesc(fee);
                    const overrideDesc = hasOverride ? getFeeDisplayDesc(fee.overrideFee!) : '';

                    return (
                      <div
                        key={fee.xplanId}
                        className="grid items-start px-4 py-2.5 border-b border-border last:border-0 hover:bg-gray-50"
                        style={{ gridTemplateColumns: isDerived ? '48px 1fr 1fr 1fr 40px' : '48px 1fr 1fr 40px' }}
                      >
                        {/* Action icons */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <button
                            className="text-teal-700 hover:text-teal-900"
                            title="Edit fee"
                            onClick={() => onEdit({ fee, category })}
                          >
                            <Pencil size={14} />
                          </button>
                          {isDerived && hasOverride && (
                            <button
                              className="text-orange-500 hover:text-orange-700"
                              title="Undo override — revert to original plan fee"
                              onClick={() => handleUndo(fee, category)}
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                        </div>

                        {/* Fee name */}
                        <div className="text-sm">{fee.name}</div>

                        {/* Research / Value */}
                        <div className="text-xs text-muted-foreground whitespace-pre-line">
                          {researchDesc}
                        </div>

                        {/* Custom/Override (derived only) */}
                        {isDerived && (
                          <div className="text-xs text-muted-foreground whitespace-pre-line">
                            {overrideDesc}
                          </div>
                        )}

                        {/* Chart icon */}
                        <div className="flex justify-end pt-0.5">
                          <button className="text-teal-700 hover:text-teal-900" title="View chart">
                            <BarChart2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Fee Edit Page ─────────────────────────────────────────────────────────────

type FeeTab = 'feeValue' | 'investmentOptions' | 'sharesExchanges' | 'feeStructure';

function FeeEditPage({
  plan,
  fee: initialFee,
  category,
  onClose,
}: {
  plan: WsPlan;
  fee: WsFee;
  category: FeeCategory;
  onClose: () => void;
}) {
  const { dispatch } = useWealthSolver();
  const isDerived = !!plan.derivedFromId;

  // For derived plans, edit the existing override or start from current fee
  const startingFee: WsFee = isDerived
    ? JSON.parse(JSON.stringify(initialFee.overrideFee ?? initialFee))
    : JSON.parse(JSON.stringify(initialFee));

  const [fee, setFee] = useState<WsFee>(startingFee);
  const [tab, setTab] = useState<FeeTab>('feeValue');

  function updateFee<K extends keyof WsFee>(key: K, value: WsFee[K]) {
    setFee((f) => ({ ...f, [key]: value }));
  }

  function updateSet(setIdx: number, patch: Partial<WsFeeSet>) {
    setFee((f) => ({
      ...f,
      feeSets: f.feeSets.map((s, i) => (i === setIdx ? { ...s, ...patch } : s)),
    }));
  }

  function updateTier(setIdx: number, tierIdx: number, patch: Partial<import('@/types/wealthsolver').WsFeeTier>) {
    setFee((f) => ({
      ...f,
      feeSets: f.feeSets.map((s, i) =>
        i !== setIdx ? s : { ...s, tiers: s.tiers.map((t, j) => (j === tierIdx ? { ...t, ...patch } : t)) }
      ),
    }));
  }

  function addSet() {
    const nextLetter = String.fromCharCode(65 + fee.feeSets.length); // A, B, C...
    const newSet: WsFeeSet = {
      shortId: nextLetter,
      name: `Set ${nextLetter}`,
      isDefault: false,
      minDollar: 0,
      maxDollar: 0,
      numTiers: 'Flat rate',
      tiers: [{ feePercent: 0, feeDollar: 0, tierLimit: REMAINING }],
      shareExchanges: [],
      investmentOptionIds: [],
    };
    setFee((f) => ({ ...f, feeSets: [...f.feeSets, newSet] }));
  }

  function removeSet(setIdx: number) {
    setFee((f) => ({
      ...f,
      feeSets: f.feeSets.filter((_, i) => i !== setIdx),
    }));
  }

  function changeNumTiers(setIdx: number, opt: string) {
    const count = numTiersFromOption(opt);
    setFee((f) => ({
      ...f,
      feeSets: f.feeSets.map((s, i) => {
        if (i !== setIdx) return s;
        // Build tiers array of the right length, preserving existing values where possible
        const newTiers: import('@/types/wealthsolver').WsFeeTier[] = [];
        for (let t = 0; t < count; t++) {
          const existing = s.tiers[t];
          if (t === count - 1) {
            newTiers.push({ feePercent: existing?.feePercent ?? 0, feeDollar: existing?.feeDollar ?? 0, tierLimit: REMAINING });
          } else {
            newTiers.push({ feePercent: existing?.feePercent ?? 0, feeDollar: existing?.feeDollar ?? 0, tierLimit: existing?.tierLimit !== REMAINING ? (existing?.tierLimit ?? 100000) : 100000 });
          }
        }
        return { ...s, numTiers: opt, tiers: newTiers };
      }),
    }));
  }

  function setDefaultSet(shortId: string) {
    setFee((f) => ({
      ...f,
      defaultSetId: shortId,
      feeSets: f.feeSets.map((s) => ({ ...s, isDefault: s.shortId === shortId })),
    }));
  }

  function assignExchangeToSet(code: string, targetSetId: string | 'excluded') {
    setFee((f) => ({
      ...f,
      feeSets: f.feeSets.map((s) => ({
        ...s,
        shareExchanges:
          targetSetId === s.shortId
            ? [...(s.shareExchanges ?? []).filter((e) => e.code !== code), { code }]
            : (s.shareExchanges ?? []).filter((e) => e.code !== code),
      })),
    }));
  }

  function assignOptionToSet(optId: string, targetSetId: string | 'excluded') {
    setFee((f) => ({
      ...f,
      feeSets: f.feeSets.map((s) => ({
        ...s,
        investmentOptionIds:
          targetSetId === s.shortId
            ? [...(s.investmentOptionIds ?? []).filter((id) => id !== optId), optId]
            : (s.investmentOptionIds ?? []).filter((id) => id !== optId),
      })),
    }));
  }

  function handleSave() {
    if (isDerived) {
      dispatch({ type: 'OVERRIDE_DERIVED_PLAN_FEE', planId: plan.id, category, feeId: initialFee.xplanId, override: fee });
    } else {
      dispatch({ type: 'UPDATE_PLAN_FEES', planId: plan.id, category, fee });
    }
    onClose();
  }

  const isBalanceAggregation = BALANCE_AGGREGATION_TYPES.includes(fee.aggregationOption);
  const showMinMax = fee.minMaxApplied === 'Plan';
  const showAggregatedMinMax = showMinMax && isBalanceAggregation;
  const showBasePerAccount = isBalanceAggregation;

  const inp = 'border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-600';
  const sel = `${inp} bg-white`;

  const tabs: { key: FeeTab; label: string }[] = [
    { key: 'feeValue', label: 'Fee Value' },
    { key: 'investmentOptions', label: 'Investment Options' },
    { key: 'sharesExchanges', label: 'Shares Exchanges' },
    { key: 'feeStructure', label: 'Fee Structure' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-xs text-muted-foreground font-medium">
          WealthSolver: <span className="text-foreground">{plan.name}{isDerived ? ' <Derived>' : ''}</span>
        </span>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} size="sm" className="h-7 text-xs bg-teal-700 hover:bg-teal-800 text-white">
            Save
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>

      {/* Card header */}
      <div className="mx-4 mt-4 flex items-center justify-between px-4 py-2.5 bg-teal-700 text-white rounded-t">
        <span className="text-sm font-semibold">Edit Fee: {initialFee.name}</span>
        <Settings size={16} className="text-white/80" />
      </div>

      {/* Tabs */}
      <div className="mx-4 border-b border-border bg-white px-4">
        <div className="flex">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              className={`px-4 py-2.5 text-xs border-b-2 -mb-px transition-colors ${
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
      <div className="mx-4 border border-t-0 border-border rounded-b p-4 bg-white">
        {/* ── Fee Value Tab ── */}
        {tab === 'feeValue' && (
          <div className="space-y-4 max-w-3xl">
            {/* Base Fee */}
            <div className="grid grid-cols-[160px_1fr] items-center gap-4">
              <label className="text-sm font-medium">Base Fee</label>
              <input
                type="number"
                className={`${inp} w-28`}
                value={fee.baseDollar}
                onChange={(e) => updateFee('baseDollar', Number(e.target.value))}
              />
            </div>

            <div className="text-sm font-bold">PLUS</div>

            {/* Min/max fields (shown when minMaxApplied === 'Plan') */}
            {showMinMax && (
              <>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4">
                  <label className="text-sm">Fee minimum</label>
                  <input type="number" className={`${inp} w-28`} value={fee.minDollar} onChange={(e) => updateFee('minDollar', Number(e.target.value))} />
                </div>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4">
                  <label className="text-sm">Fee maximum</label>
                  <input type="number" className={`${inp} w-28`} value={fee.maxDollar} onChange={(e) => updateFee('maxDollar', Number(e.target.value))} />
                </div>
              </>
            )}
            {showAggregatedMinMax && (
              <>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4">
                  <label className="text-sm">Fee minimum (aggregated)</label>
                  <input type="number" className={`${inp} w-28`} value={fee.minAggregated} onChange={(e) => updateFee('minAggregated', Number(e.target.value))} />
                </div>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4">
                  <label className="text-sm">Fee maximum (aggregated)</label>
                  <input type="number" className={`${inp} w-28`} value={fee.maxAggregated} onChange={(e) => updateFee('maxAggregated', Number(e.target.value))} />
                </div>
              </>
            )}

            {/* Fee sets */}
            {fee.feeSets.map((feeSet, si) => {
              const tierCount = numTiersFromOption(feeSet.numTiers);
              return (
                <div key={feeSet.shortId}>
                  <h3 className="text-sm font-semibold mb-2">
                    {feeSet.name}{feeSet.isDefault ? ' (Default)' : ''}
                  </h3>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1.5 w-8 text-muted-foreground" />
                        <th className="text-center py-1.5 pr-3 w-28 text-muted-foreground">
                          {fee.isDollar ? 'Fee amount ($)' : 'Fee percent'}
                        </th>
                        <th className="text-left py-1.5 pr-3 text-muted-foreground" />
                        {tierCount > 1 && (
                          <th className="text-right py-1.5 w-36 text-muted-foreground">Amount</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {feeSet.tiers.map((tier, ti) => {
                        const isLast = ti === feeSet.tiers.length - 1;
                        const isFirst = ti === 0;
                        return (
                          <tr key={ti} className="border-b border-border last:border-0">
                            <td className="py-1.5 text-muted-foreground text-center pr-2">{ti + 1}</td>
                            <td className="py-1.5 pr-3">
                              <input
                                type="number"
                                step={fee.isDollar ? '1' : '0.0001'}
                                className={`${inp} w-24 text-right`}
                                value={fee.isDollar ? tier.feeDollar : tier.feePercent}
                                onChange={(e) =>
                                  updateTier(si, ti, fee.isDollar ? { feeDollar: Number(e.target.value) } : { feePercent: Number(e.target.value) })
                                }
                              />
                              {!fee.isDollar && <span className="ml-1 text-muted-foreground">%</span>}
                            </td>
                            <td className="py-1.5 pr-3 text-muted-foreground">
                              {isLast ? 'for the remaining balance' : isFirst ? 'for the first' : 'for the next'}
                            </td>
                            {tierCount > 1 && (
                              <td className="py-1.5">
                                {!isLast ? (
                                  <input
                                    type="number"
                                    className={`${inp} w-32 text-right`}
                                    value={tier.tierLimit === REMAINING ? '' : tier.tierLimit}
                                    onChange={(e) => updateTier(si, ti, { tierLimit: Number(e.target.value) })}
                                  />
                                ) : null}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}

            {/* Research Description */}
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Research Description</label>
              <p className="text-xs text-muted-foreground mb-1 italic">
                This text will be displayed as the research description of the fee. If blank the description will be automatically generated from the fee structure.
              </p>
              <textarea
                className={`${inp} w-full`}
                rows={5}
                value={fee.researchDescription}
                onChange={(e) => updateFee('researchDescription', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── Investment Options Tab ── */}
        {tab === 'investmentOptions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-semibold">Name</th>
                  <th className="text-left py-2 pr-4 font-semibold">SPIR</th>
                  {fee.feeSets.map((s) => (
                    <th key={s.shortId} className="text-center py-2 pr-4 font-semibold min-w-[120px]">
                      {s.name}{s.isDefault ? ' (Default)' : ''}
                    </th>
                  ))}
                  <th className="text-center py-2 font-semibold">Excluded</th>
                </tr>
              </thead>
              <tbody>
                {plan.investmentOptions.map((opt) => {
                  const assignedSet = fee.feeSets.find((s) => (s.investmentOptionIds ?? []).includes(opt.id))?.shortId ?? 'excluded';
                  return (
                    <tr key={opt.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                      <td className="py-2 pr-4 text-blue-600">{opt.name}</td>
                      <td className="py-2 pr-4 font-mono text-muted-foreground">{opt.apir}</td>
                      {fee.feeSets.map((s) => (
                        <td key={s.shortId} className="py-2 pr-4 text-center">
                          <input
                            type="radio"
                            name={`opt-${opt.id}`}
                            className="accent-teal-700"
                            checked={assignedSet === s.shortId}
                            onChange={() => assignOptionToSet(opt.id, s.shortId)}
                          />
                        </td>
                      ))}
                      <td className="py-2 text-center">
                        <input
                          type="radio"
                          name={`opt-${opt.id}`}
                          className="accent-teal-700"
                          checked={assignedSet === 'excluded'}
                          onChange={() => assignOptionToSet(opt.id, 'excluded')}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Shares Exchanges Tab ── */}
        {tab === 'sharesExchanges' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-semibold">Name</th>
                  <th className="text-left py-2 pr-4 font-semibold">Code</th>
                  {fee.feeSets.map((s) => (
                    <th key={s.shortId} className="text-center py-2 pr-4 font-semibold min-w-[120px]">
                      {s.name}{s.isDefault ? ' (Default)' : ''}
                    </th>
                  ))}
                  <th className="text-center py-2 font-semibold">Excluded</th>
                </tr>
              </thead>
              <tbody>
                {SHARE_EXCHANGES.map((ex) => {
                  const assignedSet = fee.feeSets.find((s) => (s.shareExchanges ?? []).some((e) => e.code === ex.code))?.shortId ?? 'excluded';
                  return (
                    <tr key={ex.code} className="border-b border-border last:border-0 hover:bg-gray-50">
                      <td className="py-2 pr-4">{ex.name}</td>
                      <td className="py-2 pr-4 font-mono font-semibold">{ex.code}</td>
                      {fee.feeSets.map((s) => (
                        <td key={s.shortId} className="py-2 pr-4 text-center">
                          <input
                            type="radio"
                            name={`ex-${ex.code}`}
                            className="accent-teal-700"
                            checked={assignedSet === s.shortId}
                            onChange={() => assignExchangeToSet(ex.code, s.shortId)}
                          />
                        </td>
                      ))}
                      <td className="py-2 text-center">
                        <input
                          type="radio"
                          name={`ex-${ex.code}`}
                          className="accent-teal-700"
                          checked={assignedSet === 'excluded'}
                          onChange={() => assignExchangeToSet(ex.code, 'excluded')}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Fee Structure Tab ── */}
        {tab === 'feeStructure' && (
          <div className="space-y-4 max-w-2xl text-sm">
            {/* Read-only fields */}
            <StructureRow label="Fee ID">
              <span className="text-xs font-mono">{fee.xplanId}</span>
            </StructureRow>
            <StructureRow label="Fee basis">
              <span className="text-xs">{fee.feeBasis}</span>
            </StructureRow>

            {/* Aggregation method */}
            <StructureRow label="Aggregation method">
              <select
                className={`${sel} w-full max-w-sm`}
                value={fee.aggregationOption}
                onChange={(e) => updateFee('aggregationOption', e.target.value)}
              >
                {AGGREGATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </StructureRow>

            {/* Tier type */}
            <StructureRow label="Tier type">
              <select
                className={`${sel} w-40`}
                value={fee.isFlat ? 'Flat' : 'Progressive'}
                onChange={(e) => updateFee('isFlat', e.target.value === 'Flat')}
              >
                <option value="Progressive">Progressive</option>
                <option value="Flat">Flat</option>
              </select>
            </StructureRow>

            {/* Percent or dollar fee */}
            <StructureRow label="Percent or dollar fee">
              <select
                className={`${sel} w-40`}
                value={fee.isDollar ? 'Dollar' : 'Percentage'}
                onChange={(e) => updateFee('isDollar', e.target.value === 'Dollar')}
              >
                <option value="Percentage">Percentage</option>
                <option value="Dollar">Dollar</option>
              </select>
            </StructureRow>

            {/* Min/max applies to */}
            <StructureRow label="Min/max applies to">
              <select
                className={`${sel} w-40`}
                value={fee.minMaxApplied}
                onChange={(e) => updateFee('minMaxApplied', e.target.value)}
              >
                <option value="Plan">Plan</option>
                <option value="No min/max">No min/max</option>
              </select>
            </StructureRow>

            {/* Include Base Fee in min/max */}
            <StructureRow label="Include Base Fee in min/max?">
              <select
                className={`${sel} w-24`}
                value={fee.includeBaseInMinMax ? 'Yes' : 'No'}
                onChange={(e) => updateFee('includeBaseInMinMax', e.target.value === 'Yes')}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </StructureRow>

            {/* Base Fee applies per account (only for balance aggregation types) */}
            {showBasePerAccount && (
              <StructureRow label="Base Fee applies per account?">
                <select
                  className={`${sel} w-24`}
                  value={fee.basePerAccount ? 'Yes' : 'No'}
                  onChange={(e) => updateFee('basePerAccount', e.target.value === 'Yes')}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </StructureRow>
            )}

            {/* Default set for investment options */}
            <StructureRow label="Default set for investment options">
              <select
                className={`${sel} w-64`}
                value={fee.defaultSetId}
                onChange={(e) => setDefaultSet(e.target.value)}
              >
                {fee.feeSets.map((s) => (
                  <option key={s.shortId} value={s.shortId}>{s.name}</option>
                ))}
              </select>
            </StructureRow>

            {/* Sets table */}
            <div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="w-8 py-1.5" />
                    <th className="text-left py-1.5 pr-3 font-semibold">Set name</th>
                    <th className="text-left py-1.5 pr-3 font-semibold w-20">Short ID</th>
                    <th className="text-left py-1.5 pr-3 font-semibold w-36">Number of tiers</th>
                    <th className="w-8 py-1.5" />
                  </tr>
                </thead>
                <tbody>
                  {fee.feeSets.map((s, si) => (
                    <tr key={s.shortId} className="border-b border-border last:border-0">
                      <td className="py-1.5 pr-2">
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeSet(si)}
                          disabled={fee.feeSets.length <= 1}
                          title="Remove set"
                        >
                          <X size={12} />
                        </button>
                      </td>
                      <td className="py-1.5 pr-3">
                        <input
                          type="text"
                          className={`${inp} w-full`}
                          value={s.name}
                          onChange={(e) => updateSet(si, { name: e.target.value })}
                        />
                      </td>
                      <td className="py-1.5 pr-3">
                        <input
                          type="text"
                          className={`${inp} w-14`}
                          value={s.shortId}
                          onChange={(e) => updateSet(si, { shortId: e.target.value })}
                        />
                      </td>
                      <td className="py-1.5 pr-3">
                        <select
                          className={`${sel} w-full`}
                          value={s.numTiers}
                          onChange={(e) => changeNumTiers(si, e.target.value)}
                        >
                          {TIER_COUNT_OPTIONS.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-1.5">
                        <button
                          className="text-teal-700 hover:text-teal-900"
                          onClick={addSet}
                          title="Add set"
                        >
                          <Plus size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StructureRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[240px_1fr] items-center gap-4">
      <label className="text-sm font-medium">{label}</label>
      <div>{children}</div>
    </div>
  );
}
