import { useState } from 'react';
import { ChevronUp, ChevronDown, Settings, Plus, Trash2, SquarePen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CoverQuote } from './insuranceData';

interface Props {
  quotes: CoverQuote[];
  clientName: string;
  partnerName: string | null;
  onAddQuote: () => void;
  onEditQuote: (quoteId: string) => void;
  onChangeQuotes: (quotes: CoverQuote[]) => void;
}

export function CoverSelectionSection({ quotes, clientName, partnerName, onAddQuote, onEditQuote, onChangeQuotes }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  function removeQuote(id: string) {
    onChangeQuotes(quotes.filter((q) => q.id !== id));
  }

  function updateQuoteName(id: string, name: string) {
    onChangeQuotes(quotes.map((q) => q.id === id ? { ...q, name } : q));
  }

  function lifeInsuredLabel(who: 'client' | 'partner') {
    return who === 'client' ? clientName : (partnerName ?? 'Partner');
  }

  function enabledCovers(q: CoverQuote): string[] {
    const covers: string[] = [];
    if (q.lifeCover.enabled) covers.push('Life');
    if (q.tpd.enabled) covers.push('TPD Ext');
    if (q.trauma.enabled) covers.push('Trauma Ext');
    if (q.tpdStandalone.enabled) covers.push('TPD');
    if (q.traumaStandalone.enabled) covers.push('Trauma');
    if (q.incomeProtection.enabled) covers.push('IP');
    if (q.businessExpenses.enabled) covers.push('BE');
    return covers;
  }

  return (
    <div className="mx-5 my-4 border border-gray-200 rounded overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-400/70 text-white"
      >
        <span className="text-sm font-bold">Cover Selection</span>
        <div className="flex items-center gap-2">
          <Settings size={14} className="text-white/80" />
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </button>

      {!collapsed && (
        <div className="bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
            <span className="text-xs font-bold text-slate-700">Quotes</span>
            <Button
              size="sm"
              className="bg-indigo-900 hover:bg-indigo-950 text-white text-xs h-8 px-3 flex items-center gap-1"
              onClick={onAddQuote}
            >
              <Plus size={14} /> Add Quote
            </Button>
          </div>

          {quotes.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-slate-400">
              No quotes yet. Click "Add Quote" to begin.
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-[40px_1fr_1fr_1fr_80px] gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50 text-xs font-bold text-slate-700">
                <div />
                <div>Quote Name</div>
                <div>Life Insured</div>
                <div>Covers</div>
                <div />
              </div>
              {quotes.map((q) => (
                <div key={q.id} className="grid grid-cols-[40px_1fr_1fr_1fr_80px] gap-2 px-3 py-2 border-b border-gray-100 items-center">
                  <div className="flex items-center gap-1">
                    <button
                      className="text-blue-500 hover:text-blue-700"
                      title="Edit quote options"
                      onClick={() => onEditQuote(q.id)}
                    >
                      <SquarePen size={12} />
                    </button>
                    <button
                      className="text-slate-400 hover:text-red-500"
                      title="Remove quote"
                      onClick={() => removeQuote(q.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div>
                    <input
                      type="text"
                      className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full max-w-[200px]"
                      value={q.name}
                      onChange={(e) => updateQuoteName(q.id, e.target.value)}
                      placeholder="Quote name"
                    />
                  </div>
                  <div className="text-xs text-slate-700">{lifeInsuredLabel(q.lifeInsured)}</div>
                  <div className="text-xs text-slate-600">
                    {enabledCovers(q).join(', ') || 'None'}
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => onEditQuote(q.id)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
