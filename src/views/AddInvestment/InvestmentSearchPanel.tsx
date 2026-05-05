import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { investmentCatalogue } from '@/data/seed';
import type { Investment } from '@/types/domain';

type CatalogueItem = Omit<Investment, 'id' | 'amount'>;

function fmtPct(n: number | undefined) {
  if (n === undefined) return '0.00%';
  return n.toFixed(n % 1 === 0 ? 2 : 4).replace(/0+$/, '').replace(/\.$/, '') + '%';
}

interface Props {
  selectedIds: Set<string>;
  onToggle: (item: CatalogueItem) => void;
  catalogue?: CatalogueItem[];
}

export function InvestmentSearchPanel({ selectedIds, onToggle, catalogue }: Props) {
  const source = catalogue ?? investmentCatalogue;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatalogueItem[]>(source);

  function handleSearch() {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults(source);
    } else {
      setResults(
        source.filter(
          (f) => f.name.toLowerCase().includes(q) || f.apirCode.toLowerCase().includes(q)
        )
      );
    }
  }

  return (
    <div className="p-4">
      {/* Filter row */}
      <div className="flex items-center gap-2 mb-4">
        <select className="h-9 rounded border border-input bg-background px-3 text-sm min-w-[200px]">
          <option>Plan Investment Menu</option>
        </select>
        <span className="text-sm text-muted-foreground">Search</span>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search by code or description"
          className="h-9 w-64"
        />
        <Button size="sm" variant="outline" onClick={handleSearch}>
          Search
        </Button>
      </div>

      {/* Results table */}
      <div className="border border-border rounded overflow-hidden">
        <div className="px-4 py-2 bg-navy text-white text-sm font-semibold">Search Results</div>
        <div className="overflow-y-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border sticky top-0">
              <tr>
                <th className="w-8 px-2 py-2" />
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
              {results.map((item) => {
                const key = item.apirCode;
                const isSelected = selectedIds.has(key);
                const isSMA = item.fundType === 'SMA';
                const isHighlight = item.isSMAHighlight;
                return (
                  <tr
                    key={key}
                    className={cn(
                      'border-b border-border last:border-0 hover:bg-slate-50 cursor-pointer',
                      isSelected && 'bg-teal-50'
                    )}
                    onClick={() => onToggle(item)}
                  >
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggle(item)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-3.5 w-3.5"
                      />
                    </td>
                    <td className={cn('px-3 py-2', isHighlight ? 'text-red-600' : isSMA ? 'text-teal-700' : '')}>
                      {item.name}
                    </td>
                    <td className={cn('px-3 py-2 font-mono text-xs', isHighlight ? 'text-red-600' : isSMA ? 'text-teal-700' : 'text-muted-foreground')}>
                      {item.apirCode}{isSMA ? ' †' : ''}
                    </td>
                    <td className={cn('px-3 py-2 text-xs font-medium', isSMA ? 'text-red-600' : '')}>
                      {isSMA ? 'SMA' : ''}
                    </td>
                    <td className={cn('px-3 py-2 text-right tabular-nums', isHighlight ? 'text-red-600' : '')}>
                      {fmtPct(item.investCosts)}
                    </td>
                    <td className={cn('px-3 py-2 text-right tabular-nums', isHighlight ? 'text-red-600' : '')}>
                      {fmtPct(item.transactionCost)}
                    </td>
                    <td className={cn('px-3 py-2 text-right tabular-nums', isHighlight ? 'text-red-600' : '')}>
                      {fmtPct(item.buyCost)}
                    </td>
                    <td className={cn('px-3 py-2 text-right tabular-nums', isHighlight ? 'text-red-600' : '')}>
                      {fmtPct(item.sellCost)}
                    </td>
                    <td className={cn('px-3 py-2 text-right tabular-nums', isHighlight ? 'text-red-600' : '')}>
                      {fmtPct(item.perfFee)}
                    </td>
                  </tr>
                );
              })}
              {results.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
                    No results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
