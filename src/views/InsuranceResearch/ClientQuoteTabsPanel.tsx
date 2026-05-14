import { SquarePen, RefreshCw, Check } from 'lucide-react';
import type { NeedsQuote, Need, TrmFields, TrsFields, TpeFields, TreFields, TprFields, IncFields, BusFields, QuoteFrequency, FieldValue } from './needsTypes';
import { getNeedCode, NEED_CODE_LABELS, STRUCTURE_4_LABELS, STRUCTURE_3_LABELS, WAITING_INC_LABELS, WAITING_BUS_LABELS, BENEFIT_INC_LABELS } from './needsTypes';
import type { ClientFormData } from './insuranceData';

const FREQ_LABEL: Record<QuoteFrequency, string> = {
  Y: 'Yearly', H: 'Half Yearly', Q: 'Quarterly', M: 'Monthly', F: 'Fortnightly', W: 'Weekly',
};

function firstVal<T extends string>(v: FieldValue<T>): T {
  return Array.isArray(v) ? v[0] : v;
}

function structLabel4(s: FieldValue<string>): string {
  const v = firstVal(s);
  return STRUCTURE_4_LABELS[v as keyof typeof STRUCTURE_4_LABELS] ?? v;
}

function structLabel3(s: FieldValue<string>): string {
  const v = firstVal(s);
  return STRUCTURE_3_LABELS[v as keyof typeof STRUCTURE_3_LABELS] ?? v;
}

interface NeedLine {
  label: string;
  value: string | null;
}

function needLines(need: Need): NeedLine[] {
  const code = getNeedCode(need);
  const fields = Object.values(need)[0] as Record<string, unknown>;
  const lines: NeedLine[] = [];

  if (code === 'TRM') {
    const trm = (need as { TRM: TrmFields }).TRM;
    const struct = structLabel4(trm.structure);
    lines.push({ label: `Life / ${struct}`, value: `$${trm.sumInsured.toLocaleString('en-AU')}` });
    for (const ln of trm.linkedNeeds) {
      if ('TPE' in ln) {
        const tpe = ln.TPE;
        lines.push({ label: `TPD Linked / ${structLabel4(tpe.structure)}`, value: `$${tpe.sumInsured.toLocaleString('en-AU')}` });
      }
      if ('TRE' in ln) {
        const tre = ln.TRE;
        lines.push({ label: `Trauma Linked / ${structLabel4(tre.structure)}`, value: `$${tre.sumInsured.toLocaleString('en-AU')}` });
      }
    }
    return lines;
  }

  if (code === 'TRS') {
    const trs = (need as { TRS: TrsFields }).TRS;
    const struct = structLabel4(trs.structure);
    lines.push({ label: `Trauma Standalone / ${struct}`, value: `$${trs.sumInsured.toLocaleString('en-AU')}` });
    for (const ln of trs.linkedNeeds) {
      if ('TPR' in ln) {
        const tpr = ln.TPR;
        lines.push({ label: `TPD Linked / ${structLabel4(tpr.structure)}`, value: `$${tpr.sumInsured.toLocaleString('en-AU')}` });
      }
    }
    return lines;
  }

  if (code === 'INC') {
    const inc = fields as unknown as IncFields;
    const struct = structLabel3(inc.structure);
    const wp = inc.waitingPeriod === '?' ? '?' : (WAITING_INC_LABELS[firstVal(inc.waitingPeriod) as keyof typeof WAITING_INC_LABELS] ?? firstVal(inc.waitingPeriod));
    const bp = inc.benefitPeriod === '?' ? '?' : (BENEFIT_INC_LABELS[firstVal(inc.benefitPeriod) as keyof typeof BENEFIT_INC_LABELS] ?? firstVal(inc.benefitPeriod));
    const val = inc.monthlyBenefit > 0 ? `$${inc.monthlyBenefit.toLocaleString('en-AU')}/mo` : null;
    lines.push({ label: `IP / ${struct} / WP ${wp} / BP ${bp}`, value: val });
    return lines;
  }

  if (code === 'BUS') {
    const bus = fields as unknown as BusFields;
    const struct = structLabel3(bus.structure);
    const wp = WAITING_BUS_LABELS[firstVal(bus.waitingPeriod) as keyof typeof WAITING_BUS_LABELS] ?? firstVal(bus.waitingPeriod);
    const val = bus.monthlyBenefit > 0 ? `$${bus.monthlyBenefit.toLocaleString('en-AU')}/mo` : null;
    lines.push({ label: `BE / ${struct} / WP ${wp}`, value: val });
    return lines;
  }

  if (code === 'TPS') {
    const struct = structLabel4(fields.structure as FieldValue<string>);
    const si = fields.sumInsured as number;
    lines.push({ label: `TPD Standalone / ${struct}`, value: si > 0 ? `$${si.toLocaleString('en-AU')}` : null });
    return lines;
  }

  const label = NEED_CODE_LABELS[code] ?? code;
  const si = fields.sumInsured as number | undefined;
  lines.push({ label, value: si && si > 0 ? `$${si.toLocaleString('en-AU')}` : null });
  return lines;
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

interface Props {
  clientData: ClientFormData;
  partnerData: ClientFormData | null;
  activeClient: 'client' | 'partner';
  quotes: NeedsQuote[];
  selectedQuoteIndices: number[];
  onToggleQuoteIndex: (index: number) => void;
  onSelectAll: () => void;
  onEditQuote?: (quoteId: string) => void;
  quoteGeneratedDates?: Record<string, string>;
  onRequote?: (quoteId: string) => void;
  requotingQuoteId?: string | null;
}

export function ClientQuoteTabsPanel({
  clientData,
  partnerData,
  activeClient,
  quotes,
  selectedQuoteIndices,
  onToggleQuoteIndex,
  onSelectAll,
  onEditQuote,
  quoteGeneratedDates,
  onRequote,
  requotingQuoteId,
}: Props) {
  const filteredQuotes = quotes
    .map((q, idx) => ({ quote: q, originalIndex: idx }))
    .filter(({ quote }) => quote.lifeInsured === activeClient);

  const allSelected = selectedQuoteIndices.length === 0;

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
          onClick={onSelectAll}
          className={`w-full text-left px-3 py-2 rounded text-xs font-medium mb-1 transition-colors ${
            allSelected
              ? 'bg-teal-50 text-teal-800 border border-teal-200'
              : 'text-blue-600 hover:bg-slate-50 hover:underline border border-transparent'
          }`}
        >
          All Quotes
        </button>

        {filteredQuotes.length === 0 && (
          <div className="text-xs text-slate-400 text-center py-8">
            No quotes for this life insured.
          </div>
        )}

        {filteredQuotes.map(({ quote: q, originalIndex: idx }) => {
          const isSelected = allSelected || selectedQuoteIndices.includes(idx);
          return (
            <div
              key={q.id}
              className={`border rounded mb-2 overflow-hidden transition-colors ${
                isSelected ? 'border-teal-300 bg-teal-50/40' : 'border-gray-200'
              }`}
            >
              {/* Quote header — checkbox + clickable link + edit button */}
              <div className="px-3 py-1.5 bg-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onToggleQuoteIndex(idx)}
                  className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 mr-2 ${
                    isSelected ? 'bg-teal-700 border-teal-700 text-white' : 'border-slate-300'
                  }`}
                >
                  {isSelected && <Check size={10} strokeWidth={3} />}
                </button>
                <div className="flex flex-col flex-1 min-w-0">
                  <button
                    onClick={() => onToggleQuoteIndex(idx)}
                    className={`text-left text-xs font-bold truncate transition-colors ${
                      isSelected
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
                  q.needs.flatMap((n, nIdx) =>
                    needLines(n).map((line, lIdx) => (
                      <div key={`${nIdx}-${lIdx}`} className="flex items-center justify-between py-0.5 text-xs">
                        <span className="text-slate-700">{line.label}</span>
                        {line.value && <span className="text-slate-800 font-medium">{line.value}</span>}
                      </div>
                    ))
                  )
                )}
                {/* Premium frequency settings */}
                <div className="mt-1.5 pt-1.5 border-t border-gray-100 flex gap-3 text-[10px] text-slate-500">
                  <span>Super: <span className="font-medium text-slate-700">{FREQ_LABEL[q.superFrequency]}</span></span>
                  <span>Non-Super: <span className="font-medium text-slate-700">{FREQ_LABEL[q.nonSuperFrequency]}</span></span>
                </div>

                {/* Quote generated date + Requote */}
                {quoteGeneratedDates?.[q.id] && (
                  <div className="mt-1.5 pt-1.5 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 italic">
                      Quote Generated on {quoteGeneratedDates[q.id]}
                    </span>
                    {onRequote && (
                      <button
                        className="text-[10px] font-medium text-indigo-700 border border-indigo-300 rounded px-2 py-0.5 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        onClick={() => onRequote(q.id)}
                        disabled={requotingQuoteId === q.id}
                      >
                        {requotingQuoteId === q.id && <RefreshCw size={9} className="animate-spin" />}
                        Requote
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
