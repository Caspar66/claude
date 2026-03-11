import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { useWealthSolver } from '@/context/WealthSolverContext';
import { cn } from '@/lib/utils';
import { InvestmentSearchPanel } from './InvestmentSearchPanel';
import { ManualFundEntryPanel } from './ManualFundEntryPanel';
import type { Investment } from '@/types/domain';
import type { WsInvestmentOption } from '@/types/wealthsolver';

type Mode = 'search' | 'manual';

type SelectedInvestment = Omit<Investment, 'id' | 'amount'> & { id: string; amount: number };

function fmtPct(n: number | undefined) {
  if (n === undefined) return '0.00%';
  return n.toFixed(n % 1 === 0 ? 2 : 4).replace(/0+$/, '').replace(/\.$/, '') + '%';
}

function wsOptionToCatalogueItem(opt: WsInvestmentOption): Omit<Investment, 'id' | 'amount'> {
  return {
    name: opt.name,
    apirCode: opt.apir,
    allocation: {
      'Domestic Equity': opt.alloc.domEq,
      'International Equity': opt.alloc.intlEq,
      'Domestic Property': opt.alloc.domProp,
      'International Property': opt.alloc.intlProp,
      'Domestic Fixed Interest': opt.alloc.domFI,
      'International Fixed Interest': opt.alloc.intlFI,
      'Domestic Cash': opt.alloc.domCash,
      'International Cash': opt.alloc.intlCash,
      'Alternative': opt.alloc.alt,
      'Other': opt.alloc.other,
    },
    investCosts: opt.investFees,
    transactionCost: opt.transCost ?? undefined,
    buyCost: opt.buyCost ?? undefined,
    sellCost: opt.sellCost ?? undefined,
    perfFee: opt.perfFees ?? undefined,
    fundType: opt.sma ? 'SMA' : '',
    isCashAccount: opt.cashAccount,
    isEthical: opt.ethical,
    broadObjectives: opt.broadObjectives,
  };
}

export function AddInvestmentPage() {
  const { scenarioId, platformId } = useParams<{ scenarioId: string; platformId: string }>();
  const { state, dispatch } = useAppContext();
  const { state: wsState } = useWealthSolver();
  const navigate = useNavigate();

  const scenario = state.clientFile.scenarios.find((s) => s.id === scenarioId);
  const platform = scenario?.entities.flatMap((e) => e.platforms).find((p) => p.id === platformId);

  // Build investment catalogue from the linked WsPlan's investmentOptions
  const planCatalogue = useMemo(() => {
    if (!platform?.wsPlanId) return undefined;
    const wsPlan = wsState.plans.find((p) => p.id === platform.wsPlanId);
    if (!wsPlan) return undefined;
    return wsPlan.investmentOptions.map(wsOptionToCatalogueItem);
  }, [platform?.wsPlanId, wsState.plans]);

  const [mode, setMode] = useState<Mode>('search');
  const [selected, setSelected] = useState<SelectedInvestment[]>([]);

  // Set of apirCodes for search panel checkbox tracking
  const selectedIds = new Set(selected.map((s) => s.apirCode));

  function toggleFromCatalogue(item: Omit<Investment, 'id' | 'amount'>) {
    const key = item.apirCode;
    if (selectedIds.has(key)) {
      setSelected((prev) => prev.filter((s) => s.apirCode !== key));
    } else {
      setSelected((prev) => [
        ...prev,
        { ...item, id: `catalogue-${key}-${Date.now()}`, amount: 0 },
      ]);
    }
  }

  function addManual(inv: SelectedInvestment) {
    setSelected((prev) => [...prev, inv]);
  }

  function removeSelected(id: string) {
    setSelected((prev) => prev.filter((s) => s.id !== id));
  }

  function handleAddInvestments() {
    if (!scenarioId || !platformId) return;
    selected.forEach((inv) => {
      dispatch({ type: 'ADD_INVESTMENT', scenarioId, platformId, investment: inv });
    });
    navigate(-1);
  }

  if (!platform) {
    return (
      <div className="p-6 text-muted-foreground">
        Platform not found.{' '}
        <button className="text-blue-600 underline" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">
          Add Existing Investment:{' '}
          <span className="text-foreground">
            {platform.name} ({platform.accountNumber})
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-teal-700 hover:bg-teal-800 text-white"
            onClick={handleAddInvestments}
            disabled={selected.length === 0}
          >
            Add Investments
          </Button>
        </div>
      </div>

      {/* Add Investment panel */}
      <div className="border border-border rounded mb-4">
        <div className="px-4 py-2 bg-teal-700 text-white text-sm font-semibold">Add Investment</div>

        <div className="p-4 border-b border-border">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            className="h-9 rounded border border-input bg-background px-3 text-sm min-w-[220px]"
          >
            <option value="search">Plan Investment Menu</option>
            <option value="manual">Manual Fund Entry</option>
          </select>
        </div>

        {mode === 'search' ? (
          <InvestmentSearchPanel selectedIds={selectedIds} onToggle={toggleFromCatalogue} catalogue={planCatalogue} />
        ) : (
          <ManualFundEntryPanel onAdd={addManual} />
        )}
      </div>

      {/* Selected Investments */}
      <div className="border border-border rounded">
        <div className="px-4 py-2 bg-teal-700 text-white text-sm font-semibold">
          Selected Investments{selected.length > 0 ? ` (${selected.length})` : ''}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="w-8" />
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Name</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Code / APIR</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Type</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Invest Costs</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Transaction Cost</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Buy Cost</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Sell Cost</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Perf Fee</th>
            </tr>
          </thead>
          <tbody>
            {selected.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No investments selected
                </td>
              </tr>
            )}
            {selected.map((inv) => (
              <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-slate-50">
                <td className="pl-2 py-2">
                  <button
                    onClick={() => removeSelected(inv.id)}
                    className="p-1 rounded hover:bg-red-100 hover:text-red-600 text-muted-foreground"
                  >
                    <X size={12} />
                  </button>
                </td>
                <td className={cn('px-3 py-2', inv.isSMAHighlight ? 'text-red-600' : inv.fundType === 'SMA' ? 'text-teal-700' : 'text-blue-600')}>
                  {inv.name}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{inv.apirCode}</td>
                <td className={cn('px-3 py-2 text-xs font-medium', inv.fundType === 'SMA' ? 'text-red-600' : '')}>
                  {inv.fundType || ''}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtPct(inv.investCosts)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtPct(inv.transactionCost)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtPct(inv.buyCost)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtPct(inv.sellCost)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtPct(inv.perfFee)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
