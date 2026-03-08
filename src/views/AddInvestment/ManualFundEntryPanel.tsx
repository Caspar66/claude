import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Investment } from '@/types/domain';

const GROWTH_FIELDS = [
  'Domestic Equity',
  'International Equity',
  'Domestic Property',
  'International Property',
] as const;

const DEFENSIVE_FIELDS = [
  'Domestic Fixed Interest',
  'International Fixed Interest',
  'Domestic Cash',
  'International Cash',
  'Direct Property',
] as const;

const OTHER_FIELDS = ['Alternative', 'Other'] as const;

function pctInput(
  label: string,
  value: string,
  onChange: (v: string) => void
) {
  return (
    <div key={label} className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-sm font-medium text-foreground whitespace-nowrap">{label}</span>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 text-right text-xs w-24 pr-6"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
          %
        </span>
      </div>
    </div>
  );
}

interface Props {
  onAdd: (inv: Omit<Investment, 'id' | 'amount'> & { id: string; amount: number }) => void;
}

export function ManualFundEntryPanel({ onAdd }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [investCosts, setInvestCosts] = useState('0.0000');
  const [transactionCost, setTransactionCost] = useState('0.0000');
  const [buyCost, setBuyCost] = useState('0.000');
  const [sellCost, setSellCost] = useState('0.000');
  const [perfFee, setPerfFee] = useState('0.000');

  const [allocation, setAllocation] = useState<Record<string, string>>(
    Object.fromEntries(
      [...GROWTH_FIELDS, ...DEFENSIVE_FIELDS, ...OTHER_FIELDS].map((f) => [f, '0.000'])
    )
  );

  function setAlloc(field: string, val: string) {
    setAllocation((prev) => ({ ...prev, [field]: val }));
  }

  function parseAlloc(f: string) {
    return parseFloat(allocation[f]?.replace(/[^0-9.]/g, '') || '0') || 0;
  }

  const growthTotal = GROWTH_FIELDS.reduce((s, f) => s + parseAlloc(f), 0);
  const defensiveTotal = DEFENSIVE_FIELDS.reduce((s, f) => s + parseAlloc(f), 0);
  const otherTotal = OTHER_FIELDS.reduce((s, f) => s + parseAlloc(f), 0);
  const total = growthTotal + defensiveTotal + otherTotal;

  function handleAdd() {
    if (!name.trim()) return;
    const allocationRecord: Record<string, number> = {};
    [...GROWTH_FIELDS, ...DEFENSIVE_FIELDS, ...OTHER_FIELDS].forEach((f) => {
      const n = parseAlloc(f);
      if (n > 0) allocationRecord[f] = n;
    });
    onAdd({
      id: `manual-${Date.now()}`,
      name: name.trim(),
      apirCode: code.trim(),
      amount: 0,
      allocation: allocationRecord,
      investCosts: parseFloat(investCosts) || 0,
      transactionCost: parseFloat(transactionCost) || 0,
      buyCost: parseFloat(buyCost) || 0,
      sellCost: parseFloat(sellCost) || 0,
      perfFee: parseFloat(perfFee) || 0,
      fundType: '',
      isCustom: true,
    });
    // reset
    setName('');
    setCode('');
    setInvestCosts('0.0000');
    setTransactionCost('0.0000');
    setBuyCost('0.000');
    setSellCost('0.000');
    setPerfFee('0.000');
    setAllocation(Object.fromEntries([...GROWTH_FIELDS, ...DEFENSIVE_FIELDS, ...OTHER_FIELDS].map((f) => [f, '0.000'])));
  }

  return (
    <div className="p-4">
      <div className="border border-border rounded overflow-hidden">
        <div className="px-4 py-2 bg-teal-700 text-white text-sm font-semibold">Manual Fund Entry</div>

        <div className="p-4">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_160px_100px_110px_90px_90px_90px] gap-2 mb-2 text-xs font-semibold text-muted-foreground">
            <span>Name</span>
            <span>Code / APIR</span>
            <span className="text-right">Invest Costs</span>
            <span className="text-right">Transaction Cost</span>
            <span className="text-right">Buy Cost</span>
            <span className="text-right">Sell Cost</span>
            <span className="text-right">Perf Fee</span>
          </div>

          {/* Input row */}
          <div className="grid grid-cols-[1fr_160px_100px_110px_90px_90px_90px] gap-2 items-center mb-6">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter investment name"
              className="h-8 text-sm"
            />
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter investment code"
              className="h-8 text-sm font-mono"
            />
            {[
              [investCosts, setInvestCosts, '0.0000%'],
              [transactionCost, setTransactionCost, '0.0000%'],
              [buyCost, setBuyCost, '0.000%'],
              [sellCost, setSellCost, '0.000%'],
              [perfFee, setPerfFee, '0.000%'],
            ].map(([val, setter, placeholder], i) => (
              <div key={i} className="relative">
                <Input
                  value={val as string}
                  onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                  placeholder={placeholder as string}
                  className="h-8 text-right text-xs pr-6"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
              </div>
            ))}
          </div>

          {/* Asset Allocation */}
          <div className="text-sm font-semibold mb-3">Asset Allocation</div>
          <div className="grid grid-cols-3 gap-8 mb-4">
            {/* Growth */}
            <div className="space-y-1">
              {GROWTH_FIELDS.map((f) => pctInput(f, allocation[f], (v) => setAlloc(f, v)))}
            </div>
            {/* Defensive */}
            <div className="space-y-1">
              {DEFENSIVE_FIELDS.map((f) => pctInput(f, allocation[f], (v) => setAlloc(f, v)))}
            </div>
            {/* Other */}
            <div className="space-y-1">
              {OTHER_FIELDS.map((f) => pctInput(f, allocation[f], (v) => setAlloc(f, v)))}
            </div>
          </div>

          {/* Totals row */}
          <div className="flex items-center gap-8 border-t border-border pt-2 text-xs text-muted-foreground">
            <span>
              <span className="font-medium">Growth total</span>{' '}
              <span className="tabular-nums">{growthTotal.toFixed(3)}%</span>
            </span>
            <span>
              <span className="font-medium">Defensive total</span>{' '}
              <span className="tabular-nums">{defensiveTotal.toFixed(3)}%</span>
            </span>
            <span>
              <span className="font-medium">Other total</span>{' '}
              <span className="tabular-nums">{otherTotal.toFixed(3)}%</span>
            </span>
            <span className="ml-auto">
              <span className="font-medium">Total</span>{' '}
              <span className="tabular-nums">{total.toFixed(3)}%</span>
            </span>
          </div>

          <div className="mt-4">
            <Button size="sm" variant="outline" onClick={handleAdd}>
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
