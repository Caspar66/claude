import { SquarePen } from 'lucide-react';
import type { NeedsQuote, Need, TrmFields, TrsFields } from './needsTypes';
import { getNeedCode, NEED_CODE_LABELS, LINKED_NEED_LABELS } from './needsTypes';
import type { ClientFormData } from './insuranceData';

interface Props {
  clientData: ClientFormData;
  partnerData: ClientFormData | null;
  quotes: NeedsQuote[];
  activeQuoteIndex: number | null;
  onSelectQuote: (index: number | null) => void;
  onEditQuote?: (id: string) => void;
}

function needDescription(need: Need): string {
  const code = getNeedCode(need);
  const label = NEED_CODE_LABELS[code];
  if (code === 'TRM') {
    const trm = (need as { TRM: TrmFields }).TRM;
    const linked = trm.linkedNeeds.map((ln) => {
      if ('TPE' in ln) return LINKED_NEED_LABELS.TPE;
      if ('TRE' in ln) return LINKED_NEED_LABELS.TRE;
      return '';
    }).filter(Boolean);
    return linked.length > 0 ? `${label} + ${linked.join(', ')}` : label;
  }
  if (code === 'TRS') {
    const trs = (need as { TRS: TrsFields }).TRS;
    const linked = trs.linkedNeeds.map((ln) => ('TPR' in ln ? LINKED_NEED_LABELS.TPR : '')).filter(Boolean);
    return linked.length > 0 ? `${label} + ${linked.join(', ')}` : label;
  }
  return label;
}

function needSumInsured(need: Need): string | null {
  const code = getNeedCode(need);
  const fields = Object.values(need)[0] as Record<string, unknown>;
  if (code === 'INC' || code === 'BUS') {
    const v = fields.monthlyBenefit as number | undefined;
    return typeof v === 'number' && v > 0 ? `$${v.toLocaleString('en-AU')}/mo` : null;
  }
  if (code === 'CHT') return null;
  const v = fields.sumInsured as number | undefined;
  return typeof v === 'number' && v > 0 ? `$${v.toLocaleString('en-AU')}` : null;
}

function clientLabelFor(
  who: 'client' | 'partner',
  clientData: ClientFormData,
  partnerData: ClientFormData | null,
): string {
  const d = who === 'client' ? clientData : partnerData;
  if (!d) return who === 'client' ? 'Client' : 'Partner';
  return `${d.firstName} ${d.lastName}`.trim() || (who === 'client' ? 'Client' : 'Partner');
}

export function ClientQuoteTabsPanel({
  clientData,
  partnerData,
  quotes,
  activeQuoteIndex,
  onSelectQuote,
  onEditQuote,
}: Props) {
  return (
    <div className="w-[320px] border-r border-gray-200 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-bold text-slate-700">Quote Details</span>
      </div>

      {/* Quote list */}
      <div className="flex-1 overflow-auto p-3">
        {/* All Quotes link */}
        <button
          onClick={() => onSelectQuote(null)}
          className={`w-full text-left px-3 py-2 rounded text-xs font-medium mb-1 transition-colors ${
            activeQuoteIndex === null
              ? 'bg-teal-50 text-teal-800 border border-teal-200'
              : 'text-blue-600 hover:bg-gray-50 hover:underline border border-transparent'
          }`}
        >
          All Quotes
        </button>

        {quotes.length === 0 && (
          <div className="text-xs text-slate-400 text-center py-8">
            No quotes configured.
          </div>
        )}

        {quotes.map((q, idx) => {
          const isActive = activeQuoteIndex === idx;
          return (
            <div
              key={q.id}
              className={`border rounded mb-2 overflow-hidden transition-colors ${
                isActive ? 'border-teal-300 bg-teal-50/40' : 'border-gray-200'
              }`}
            >
              {/* Quote header — clickable link + edit button */}
              <div className="px-3 py-1.5 bg-slate-100 flex items-center justify-between">
                <div className="flex flex-col flex-1 min-w-0">
                  <button
                    onClick={() => onSelectQuote(idx)}
                    className={`text-left text-xs font-bold truncate transition-colors ${
                      isActive
                        ? 'text-teal-700'
                        : 'text-blue-600 hover:text-blue-800 hover:underline'
                    }`}
                  >
                    {q.name}
                  </button>
                  <span className="text-[10px] text-slate-500">
                    Life Insured: {clientLabelFor(q.lifeInsured, clientData, partnerData)}
                  </span>
                </div>
                {onEditQuote && (
                  <button
                    className="text-blue-500 hover:text-blue-700 shrink-0 ml-2"
                    onClick={() => onEditQuote(q.id)}
                    title="Edit quote"
                  >
                    <SquarePen size={12} />
                  </button>
                )}
              </div>

              {/* Quote needs summary */}
              <div className="px-3 py-2">
                {q.needs.length === 0 ? (
                  <div className="text-xs text-slate-400 py-1">No needs configured</div>
                ) : (
                  q.needs.map((n, nIdx) => {
                    const sum = needSumInsured(n);
                    return (
                      <div key={nIdx} className="flex items-center justify-between py-0.5 text-xs">
                        <span className="text-slate-700">{needDescription(n)}</span>
                        {sum && <span className="text-slate-800 font-medium">{sum}</span>}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
