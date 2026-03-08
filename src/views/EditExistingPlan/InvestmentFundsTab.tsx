import { useState } from 'react';
import { X, Copy, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';
import type { Platform, Investment } from '@/types/domain';
import { InvestmentDetailsDialog } from './InvestmentDetailsDialog';

interface Props {
  scenarioId: string;
  platform: Platform;
}

export function InvestmentFundsTab({ scenarioId, platform }: Props) {
  const { dispatch } = useAppContext();
  const navigate = useNavigate();
  const [amounts, setAmounts] = useState<Record<string, string>>(
    Object.fromEntries(platform.investments.map((inv) => [inv.id, String(inv.amount)]))
  );
  const [detailInv, setDetailInv] = useState<Investment | null>(null);

  function handleAmountChange(id: string, val: string) {
    setAmounts((prev) => ({ ...prev, [id]: val }));
    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) {
      const investments = platform.investments.map((inv) =>
        inv.id === id ? { ...inv, amount: num } : inv
      );
      dispatch({ type: 'UPDATE_PLATFORM', scenarioId, platformId: platform.id, patch: { investments } });
    }
  }

  function handleDelete(invId: string) {
    dispatch({ type: 'DELETE_INVESTMENT', scenarioId, platformId: platform.id, investmentId: invId });
    setAmounts((prev) => {
      const next = { ...prev };
      delete next[invId];
      return next;
    });
  }

  function handleAddRow() {
    navigate(`/scenarios/${scenarioId}/plan/${platform.id}/investments/add`);
  }

  const total = platform.investments.reduce((sum, inv) => {
    const raw = amounts[inv.id] ?? String(inv.amount);
    const n = parseFloat(raw.replace(/[^0-9.]/g, ''));
    return sum + (isNaN(n) ? inv.amount : n);
  }, 0);

  return (
    <div>
      <div className="flex justify-end px-4 py-2 border-b border-border">
        <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white" onClick={handleAddRow}>
          <Plus size={13} className="mr-1" />
          Add Investment
        </Button>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-border">
          <tr>
            <th className="w-8" />
            <th className="w-8" />
            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Investment Allocation</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">APIR Code</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Amount ($)</th>
          </tr>
        </thead>
        <tbody>
          {platform.investments.map((inv) => (
            <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-slate-50">
              <td className="pl-2 py-2">
                <button
                  onClick={() => handleDelete(inv.id)}
                  className="p-1 rounded hover:bg-red-100 hover:text-red-600 text-muted-foreground"
                >
                  <X size={12} />
                </button>
              </td>
              <td className="py-2">
                <button className="p-1 rounded hover:bg-blue-100 hover:text-blue-600 text-muted-foreground">
                  <Copy size={12} />
                </button>
              </td>
              <td className="px-3 py-2">
                <button
                  onClick={() => setDetailInv(inv)}
                  className="text-blue-600 hover:underline text-left text-sm"
                >
                  {inv.name}
                </button>
              </td>
              <td className="px-3 py-2 text-muted-foreground font-mono text-xs">
                {inv.apirCode}
              </td>
              <td className="px-3 py-2">
                <Input
                  value={amounts[inv.id] ?? String(inv.amount)}
                  onChange={(e) => handleAmountChange(inv.id, e.target.value)}
                  className="h-7 text-right text-sm w-32 ml-auto"
                />
              </td>
            </tr>
          ))}

          {platform.investments.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground text-sm">
                No investments. Click "Add Investment" to add one.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot className="border-t-2 border-border bg-gray-50">
          <tr>
            <td colSpan={4} className="px-3 py-2 text-sm font-semibold">Total</td>
            <td className="px-3 py-2 text-right font-semibold tabular-nums text-sm pr-4">
              {formatCurrency(total)}
            </td>
          </tr>
        </tfoot>
      </table>
      <InvestmentDetailsDialog
        investment={detailInv}
        open={detailInv !== null}
        onClose={() => setDetailInv(null)}
        scenarioId={scenarioId}
        platformId={platform.id}
      />
    </div>
  );
}
