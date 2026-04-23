import { useState } from 'react';
import { SquarePen } from 'lucide-react';
import type { ClientFormData } from './insuranceData';
import { EMPLOYMENT_STATUS_LABELS, HEALTH_DISCOUNT_LABELS } from './insuranceData';
import type { NeedsQuote, Need, TrmFields, TrsFields } from './needsTypes';
import { getNeedCode, NEED_CODE_LABELS, LINKED_NEED_LABELS } from './needsTypes';

type Tab = 'client' | 'quotes';

interface Props {
  clientData: ClientFormData;
  partnerData: ClientFormData | null;
  activeClient: 'client' | 'partner';
  quotes: NeedsQuote[];
  onEditQuote?: (id: string) => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1 border-b border-gray-100 text-xs">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-800 font-medium text-right">{value}</span>
    </div>
  );
}

function ClientSummary({ data, label }: { data: ClientFormData; label: string }) {
  return (
    <div className="border border-gray-200 rounded mb-3 overflow-hidden">
      <div className="px-3 py-1.5 bg-slate-100 text-xs font-bold text-slate-700">{label}</div>
      <div className="px-3 py-2">
        <Row label="Name" value={`${data.firstName} ${data.lastName}`} />
        <Row label="Date of Birth" value={data.dateOfBirth} />
        <Row label="Age" value={data.age} />
        <Row label="Gender" value={data.gender} />
        <Row label="Smoker" value={data.smoker} />
        {data.smoker === 'No' && (
          <Row label="Health Discount" value={HEALTH_DISCOUNT_LABELS[data.healthDiscount]} />
        )}
        <Row label="Employment" value={EMPLOYMENT_STATUS_LABELS[data.employmentStatus]} />
        <Row label="Occupation" value={data.occupationCode || '—'} />
        <Row label="State" value={data.state} />
        <Row label="Annual Income" value={data.annualIncome} />
      </div>
    </div>
  );
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

function QuoteSummary({
  quote,
  clientLabel,
  onEdit,
}: {
  quote: NeedsQuote;
  clientLabel: string;
  onEdit?: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded mb-3 overflow-hidden">
      <div className="px-3 py-1.5 bg-slate-100 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-700">{quote.name}</span>
          <span className="text-[10px] text-slate-500">Life Insured: {clientLabel}</span>
        </div>
        {onEdit && (
          <button
            className="text-blue-500 hover:text-blue-700"
            onClick={onEdit}
            title="Edit quote"
          >
            <SquarePen size={12} />
          </button>
        )}
      </div>
      <div className="px-3 py-2">
        {quote.needs.length === 0 ? (
          <div className="text-xs text-slate-400 py-2">No needs configured</div>
        ) : (
          quote.needs.map((n, idx) => {
            const sum = needSumInsured(n);
            return (
              <div key={idx} className="flex items-center justify-between py-1 text-xs">
                <span className="text-slate-700">{needDescription(n)}</span>
                {sum && <span className="text-slate-800 font-medium">{sum}</span>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function ClientQuoteTabsPanel({ clientData, partnerData, activeClient, quotes, onEditQuote }: Props) {
  const [tab, setTab] = useState<Tab>('client');

  const activeData = activeClient === 'partner' && partnerData ? partnerData : clientData;
  const activeLabel = activeClient === 'partner' ? 'Partner' : 'Client';
  const activeQuotes = quotes.filter((q) => q.lifeInsured === activeClient);

  function clientLabelFor(who: 'client' | 'partner'): string {
    const d = who === 'client' ? clientData : partnerData;
    if (!d) return who === 'client' ? 'Client' : 'Partner';
    return `${d.firstName} ${d.lastName}`.trim() || (who === 'client' ? 'Client' : 'Partner');
  }

  return (
    <div className="w-[320px] border-r border-gray-200 bg-white flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setTab('client')}
          className={`flex-1 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            tab === 'client'
              ? 'border-teal-600 text-teal-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Client / Life Insured
        </button>
        <button
          onClick={() => setTab('quotes')}
          className={`flex-1 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            tab === 'quotes'
              ? 'border-teal-600 text-teal-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Quote Details
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-3">
        {tab === 'client' ? (
          <>
            <ClientSummary data={activeData} label={activeLabel} />
            {activeClient === 'client' && partnerData && (
              <ClientSummary data={partnerData} label="Partner" />
            )}
            {activeClient === 'partner' && partnerData && (
              <ClientSummary data={clientData} label="Client" />
            )}
          </>
        ) : (
          <>
            {activeQuotes.length === 0 && (
              <div className="text-xs text-slate-400 text-center py-8">
                No quotes configured for {activeLabel}.
              </div>
            )}
            {activeQuotes.map((q) => (
              <QuoteSummary
                key={q.id}
                quote={q}
                clientLabel={clientLabelFor(q.lifeInsured)}
                onEdit={onEditQuote ? () => onEditQuote(q.id) : undefined}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
