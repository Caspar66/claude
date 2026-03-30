import { useState } from 'react';
import { X, Lock } from 'lucide-react';
import type { WsFee, WsFeeSet, WsFeeTier } from '@/types/wealthsolver';
import { AGGREGATION_OPTIONS } from '@/types/wealthsolver';

const REMAINING = 99999999999;

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtDollar(n: number) {
  return `$${n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(n: number) {
  return `${n.toFixed(4).replace(/\.?0+$/, '')}%`;
}

function fmtTierLimit(tier: WsFeeTier, isLast: boolean) {
  return isLast ? 'MAX' : fmtDollar(tier.tierLimit);
}

// ── Calculation helpers ───────────────────────────────────────────────────────

interface TierCalc {
  tierBalance: number;
  tierAmount: number;
}

function calcProgressive(tiers: WsFeeTier[], balance: number, isDollar: boolean): TierCalc[] {
  let remaining = balance;
  return tiers.map((tier, i) => {
    const isLast = i === tiers.length - 1;
    const tierBalance = isLast ? remaining : Math.min(remaining, tier.tierLimit);
    const tierAmount = isDollar ? tier.feeDollar : tierBalance * (tier.feePercent / 100);
    remaining = Math.max(0, remaining - tierBalance);
    return { tierBalance, tierAmount };
  });
}

function calcFlat(tiers: WsFeeTier[], balance: number, isDollar: boolean): TierCalc[] {
  if (isDollar) {
    // Dollar flat: fixed amount regardless of balance
    return tiers.map((_, i) => ({
      tierBalance: i === 0 ? balance : 0,
      tierAmount: i === 0 ? tiers[0].feeDollar : 0,
    }));
  }
  // Percentage flat: apply single rate to full balance (use first tier for flat rate)
  return tiers.map((tier, i) => ({
    tierBalance: i === 0 ? balance : 0,
    tierAmount: i === 0 ? balance * (tier.feePercent / 100) : 0,
  }));
}

function applyMinMax(amount: number, min: number, max: number): number {
  let result = amount;
  if (min > 0) result = Math.max(result, min);
  if (max > 0) result = Math.min(result, max);
  return result;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  planName: string;
  isDerived: boolean;
  fee: WsFee;
  onClose: () => void;
}

// ── Main component ────────────────────────────────────────────────────────────

export function FeeCalculator({ planName, isDerived, fee, onClose }: Props) {
  const [balances, setBalances] = useState<Record<string, string>>(
    Object.fromEntries(fee.feeSets.map((s) => [s.shortId, '0']))
  );

  function parseBalance(s: string): number {
    const n = parseFloat(s.replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  }

  // Max tiers across all sets — drives column count
  const maxTiers = Math.max(...fee.feeSets.map((s) => s.tiers.length), 1);

  // Aggregation label for header
  const aggLabel = AGGREGATION_OPTIONS.find((o) => o.value === fee.aggregationOption)?.label ?? fee.aggregationOption;
  const basisLabel = `${fee.feeBasis} (${aggLabel})`;

  // Per-set calculations
  const setCalcs = fee.feeSets.map((feeSet) => {
    const balance = parseBalance(balances[feeSet.shortId] ?? '0');
    const tierCalcs = fee.isFlat
      ? calcFlat(feeSet.tiers, balance, fee.isDollar)
      : calcProgressive(feeSet.tiers, balance, fee.isDollar);

    const rawTotal = tierCalcs.reduce((sum, t) => sum + t.tierAmount, 0);

    let setFee = rawTotal;
    if (fee.minMaxApplied === 'Option') {
      setFee = applyMinMax(rawTotal, fee.minDollar, fee.maxDollar);
    } else if (fee.minMaxApplied === 'Set') {
      setFee = applyMinMax(rawTotal, feeSet.minDollar, feeSet.maxDollar);
    }

    return { balance, tierCalcs, rawTotal, setFee };
  });

  const planBalance = fee.feeSets.reduce((sum, s) => sum + parseBalance(balances[s.shortId] ?? '0'), 0);
  const rawPlanFee = setCalcs.reduce((sum, c) => sum + (fee.minMaxApplied === 'Option' || fee.minMaxApplied === 'Set' ? c.setFee : c.rawTotal), 0);
  const planFee = fee.minMaxApplied === 'Plan'
    ? applyMinMax(rawPlanFee, fee.minDollar, fee.maxDollar)
    : rawPlanFee;

  // ── Shared cell styles ──
  const th = 'py-1.5 px-2 text-left text-xs font-semibold';
  const td = 'py-1 px-2 text-xs';
  const tdR = 'py-1 px-2 text-xs text-right';
  const muted = 'text-muted-foreground';

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-6 px-4 overflow-auto">
      <div className="bg-white rounded shadow-xl w-full max-w-5xl mb-6 flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-600 text-white rounded-t flex-shrink-0">
          <span className="text-sm font-semibold">
            {fee.name} — Fee Calculation Details (Test calculator)
          </span>
          <button onClick={onClose} className="hover:bg-white/20 rounded p-0.5 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Plan name row */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-white flex-shrink-0">
          <span className="text-sm font-medium">
            {planName}{isDerived ? ' <Derived>' : ''}
          </span>
          <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors">
            <Lock size={12} /> Unlock research
          </button>
        </div>

        {/* Calculation table */}
        <div className="overflow-auto">
          <table className="w-full border-collapse text-xs">
            {/* Column header */}
            <thead>
              <tr className="border-b-2 border-border bg-gray-50">
                <th className={`${th} w-36`}>Fee</th>
                <th className={`${th} w-48`}>{fee.name}</th>
                <th className={`${th}`} colSpan={maxTiers + 3}>{basisLabel}</th>
              </tr>
            </thead>

            <tbody>
              {fee.feeSets.map((feeSet, si) => {
                const calc = setCalcs[si];
                const tiers = feeSet.tiers;
                const padCount = maxTiers - tiers.length;
                const balStr = balances[feeSet.shortId] ?? '0';

                return (
                  <SetRows
                    key={feeSet.shortId}
                    feeSet={feeSet}
                    calc={calc}
                    tiers={tiers}
                    padCount={padCount}
                    fee={fee}
                    balStr={balStr}
                    onBalanceChange={(v) =>
                      setBalances((b) => ({ ...b, [feeSet.shortId]: v }))
                    }
                    td={td}
                    tdR={tdR}
                    muted={muted}
                  />
                );
              })}

              {/* ── Plan balance ── */}
              <tr className="border-t border-border">
                <td className={`${td} ${muted} py-1.5`}>Plan balance</td>
                <td className={td} />
                <td className={`${tdR} py-1.5`}>{fmtDollar(planBalance)}</td>
                <td colSpan={maxTiers + 2} />
              </tr>

              {/* ── Plan-level min/max ── */}
              {fee.minMaxApplied === 'Plan' && (fee.minDollar > 0 || fee.maxDollar > 0) && (
                <tr className="border-t border-border">
                  <td className={`${td} ${muted} py-1.5`}>Min/max</td>
                  <td className={td} />
                  <td className={`${tdR} py-1.5`}>{fmtDollar(rawPlanFee)}</td>
                  <td className={`${tdR} py-1.5`}>{fee.minDollar > 0 ? fmtDollar(fee.minDollar) : ''}</td>
                  <td className={`${tdR} py-1.5`}>{fee.maxDollar > 0 ? fmtDollar(fee.maxDollar) : fmtDollar(0)}</td>
                  <td colSpan={maxTiers} />
                </tr>
              )}

              {/* ── Fee total ── */}
              <tr className="border-t-2 border-border bg-gray-50">
                <td className={`${td} font-bold py-2`}>Fee total</td>
                <td className={td} />
                <td className={`${tdR} font-bold py-2`}>{fmtDollar(planFee)}</td>
                <td className={`${tdR} ${muted} py-2`}>
                  {planBalance > 0 ? fmtPct((planFee / planBalance) * 100) : '0.00%'}
                </td>
                <td colSpan={maxTiers + 1} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Per-set rows ──────────────────────────────────────────────────────────────

interface SetRowsProps {
  feeSet: WsFeeSet;
  calc: { balance: number; tierCalcs: TierCalc[]; rawTotal: number; setFee: number };
  tiers: WsFeeTier[];
  padCount: number;
  fee: WsFee;
  balStr: string;
  onBalanceChange: (v: string) => void;
  td: string;
  tdR: string;
  muted: string;
}

function SetRows({ feeSet, calc, tiers, padCount, fee, balStr, onBalanceChange, td, tdR, muted }: SetRowsProps) {
  const pad = Array.from({ length: padCount });
  const pctOfBalance = calc.balance > 0 ? (calc.setFee / calc.balance) * 100 : 0;
  const showOptionMinMax = fee.minMaxApplied === 'Option';
  const showSetMinMax = fee.minMaxApplied === 'Set';

  return (
    <>
      {/* Tier limit row */}
      <tr className="border-t border-border">
        <td className={`${td} ${muted}`}>
          Tier limit ({fee.isFlat ? 'flat' : 'progressive'})
        </td>
        <td className={`${td} font-semibold`}>{feeSet.name}</td>
        {tiers.map((tier, ti) => (
          <td key={ti} className={tdR}>
            {fmtTierLimit(tier, ti === tiers.length - 1)}
          </td>
        ))}
        {pad.map((_, i) => <td key={i} />)}
        <td colSpan={3} />
      </tr>

      {/* Tier fee row */}
      <tr className="border-t border-border/50">
        <td className={`${td} ${muted}`}>Tier fee</td>
        <td className={td} />
        {tiers.map((tier, ti) => (
          <td key={ti} className={tdR}>
            {fee.isDollar ? fmtDollar(tier.feeDollar) : fmtPct(tier.feePercent)}
          </td>
        ))}
        {pad.map((_, i) => <td key={i} />)}
        <td colSpan={3} />
      </tr>

      {/* Balance in tier row */}
      <tr className="border-t border-border/50">
        <td className={`${td} ${muted}`}>Balance in tier</td>
        <td className={td} />
        {calc.tierCalcs.map((tc, ti) => (
          <td key={ti} className={tdR}>{fmtDollar(tc.tierBalance)}</td>
        ))}
        {pad.map((_, i) => <td key={i} />)}
        <td colSpan={3} />
      </tr>

      {/* Tier amount row */}
      <tr className="border-t border-border/50">
        <td className={`${td} ${muted}`}>Tier amount</td>
        <td className={td} />
        {calc.tierCalcs.map((tc, ti) => (
          <td key={ti} className={tdR}>{fmtDollar(tc.tierAmount)}</td>
        ))}
        {pad.map((_, i) => <td key={i} />)}
        <td colSpan={3} />
      </tr>

      {/* Option row — editable balance input */}
      <tr className="border-t border-border/50 bg-yellow-50/30">
        <td className={`${td} ${muted}`}>Option</td>
        <td className={`${td} font-medium`}>Funds allocated to set</td>
        <td className={`${tdR}`}>
          <input
            type="number"
            min="0"
            step="1000"
            value={balStr}
            onChange={(e) => onBalanceChange(e.target.value)}
            className="w-28 border border-border rounded px-2 py-0.5 text-right text-xs focus:outline-none focus:ring-1 focus:ring-teal-600 bg-yellow-100 font-medium"
          />
        </td>
        <td className={`${tdR} ${muted}`}>1.0</td>
        <td className={`${tdR}`}>{fmtDollar(calc.rawTotal)}</td>
        <td className={`${tdR} ${muted}`}>
          {calc.balance > 0 ? fmtPct((calc.rawTotal / calc.balance) * 100) : '0.00%'}
        </td>
        {pad.map((_, i) => <td key={i} />)}
      </tr>

      {/* Min/max (option) rows */}
      {showOptionMinMax && (
        <>
          <tr className="border-t border-border/50">
            <td className={`${td} ${muted}`}>Min/max (option)</td>
            <td className={td} />
            <td className={tdR}>{fmtDollar(calc.rawTotal)}</td>
            <td className={tdR}>{fee.minDollar > 0 ? fmtDollar(fee.minDollar) : ''}</td>
            <td className={tdR}>{fee.maxDollar > 0 ? fmtDollar(fee.maxDollar) : fmtDollar(0)}</td>
            {pad.map((_, i) => <td key={i} />)}
          </tr>
          <tr className="border-t border-border/50">
            <td className={`${td} ${muted}`}>Option fee</td>
            <td className={td} />
            <td className={tdR}>{fmtDollar(calc.setFee)}</td>
            <td className={`${tdR} ${muted}`}>
              {calc.balance > 0 ? fmtPct((calc.setFee / calc.balance) * 100) : '0.00%'}
            </td>
            {pad.map((_, i) => <td key={i} />)}
          </tr>
        </>
      )}

      {/* Min/max (set) rows */}
      {showSetMinMax && (
        <>
          <tr className="border-t border-border/50">
            <td className={`${td} ${muted}`}>Min/max (set)</td>
            <td className={td} />
            <td className={tdR}>{fmtDollar(calc.rawTotal)}</td>
            <td className={tdR}>{feeSet.minDollar > 0 ? fmtDollar(feeSet.minDollar) : ''}</td>
            <td className={tdR}>{feeSet.maxDollar > 0 ? fmtDollar(feeSet.maxDollar) : fmtDollar(0)}</td>
            {pad.map((_, i) => <td key={i} />)}
          </tr>
        </>
      )}

      {/* Set balance row */}
      <tr className="border-t border-border/50">
        <td className={`${td} ${muted}`}>Set balance</td>
        <td className={td} />
        <td className={tdR}>{fmtDollar(calc.balance)}</td>
        <td colSpan={3 + padCount} />
      </tr>

      {/* Set total row */}
      <tr className="border-t border-border bg-gray-50">
        <td className={`${td} ${muted} font-medium`}>Set total</td>
        <td className={`${td} font-semibold`}>{feeSet.name}</td>
        <td className={`${tdR} font-semibold`}>{fmtDollar(calc.setFee)}</td>
        <td className={`${tdR} ${muted}`}>
          {calc.balance > 0 ? fmtPct(pctOfBalance) : '0.00%'}
        </td>
        {pad.map((_, i) => <td key={i} />)}
        <td colSpan={2} />
      </tr>
    </>
  );
}
