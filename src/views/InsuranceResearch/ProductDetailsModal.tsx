import { useState } from 'react';
import { X, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { ReviewItem, ReviewStatus } from './ScenarioReviewPage';
import type { PremiumFrequency } from './insuranceData';
import { PREMIUM_FREQUENCY_LABELS } from './insuranceData';

type DetailsTab = 'details' | 'cover' | 'fees';

interface Props {
  item: ReviewItem;
  clientName: string;
  partnerName: string | null;
  onSave: (updated: ReviewItem) => void;
  onClose: () => void;
}

function fieldBox(label: string, value: string, onChange?: (v: string) => void) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-600 mb-1">{label}</div>
      <input
        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={!onChange}
      />
    </div>
  );
}

function selectBox(label: string, value: string, options: string[], onChange: (v: string) => void) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-600 mb-1">{label}</div>
      <select
        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

const ALL_STATUSES: ReviewStatus[] = ['Recommend', 'Not Accepted', 'Alternative', 'Hold', 'Replace', 'Cancel', 'Vary', 'Exclude', 'Vary to Existing'];

export function ProductDetailsModal({ item, clientName, partnerName, onSave, onClose }: Props) {
  const [tab, setTab] = useState<DetailsTab>('details');
  const [policyName, setPolicyName] = useState(item.label);
  const [status, setStatus] = useState<ReviewStatus>(item.status);
  const [underwriter, setUnderwriter] = useState(item.insurer);

  const lifeInsuredName = item.lifeInsured === 'client' ? clientName : (partnerName ?? 'Partner');

  const row = item.quoteRow;
  const freq: PremiumFrequency = (row
    ? (Object.keys(row.premiumInsideSuper)[0] as PremiumFrequency) || (Object.keys(row.premiumOutsideSuper)[0] as PremiumFrequency)
    : 'M') || 'M';

  const premSuper = row?.premiumInsideSuper[freq] ?? 0;
  const premNonSuper = row?.premiumOutsideSuper[freq] ?? 0;
  const stampSuper = row?.stampDutyInsideSuper[freq] ?? 0;
  const stampNonSuper = row?.stampDutyOutsideSuper[freq] ?? 0;
  const totalPrem = premSuper + premNonSuper + stampSuper + stampNonSuper;
  const freqLabel = PREMIUM_FREQUENCY_LABELS[freq] ?? freq;
  const policyFee = row?.policyFee ?? 0;

  const [covers, setCovers] = useState(() =>
    item.covers.map((c, i) => ({
      type: c.type,
      definition: c.definition ?? '',
      owner: c.owner ?? lifeInsuredName,
      lifeInsured: lifeInsuredName,
      benefitAmount: c.sumInsured,
      waitingPeriod: '',
      benefitPeriod: '',
      id: i,
    }))
  );

  function updateCover(idx: number, patch: Partial<typeof covers[0]>) {
    setCovers((prev) => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));
  }

  const commUpfrontPct = row ? (Object.values(row.commissionUpfrontPercent)[0] ?? 0) : 0;
  const commUpfrontAmt = row ? (Object.values(row.commissionUpfront)[0] ?? 0) : 0;
  const commOngoingPct = row ? (Object.values(row.commissionOngoingPercent)[0] ?? 0) : 0;
  const commOngoingAmt = row ? (Object.values(row.commissionOngoing)[0] ?? 0) : 0;

  const feeRows = [
    { period: 'Premium Year 1', premium: premSuper + premNonSuper, freq: freqLabel, pct: commUpfrontPct, amt: commUpfrontAmt },
    { period: 'Premium Renewal', premium: premSuper + premNonSuper, freq: freqLabel, pct: commOngoingPct, amt: commOngoingAmt },
  ];

  function handleSave() {
    const updated: ReviewItem = {
      ...item,
      label: policyName,
      status,
      insurer: underwriter,
      covers: covers.map((c) => ({
        type: c.type,
        definition: c.definition,
        sumInsured: c.benefitAmount,
        owner: c.owner,
      })),
    };
    onSave(updated);
  }

  const tabs: { key: DetailsTab; label: string }[] = [
    { key: 'details', label: 'Details' },
    { key: 'cover', label: 'Cover' },
    { key: 'fees', label: 'Fees' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-[720px] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-slate-800">Product Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Top fields */}
        <div className="px-6 pt-5 pb-3 space-y-4">
          <div className="grid grid-cols-[2fr_1fr] gap-4">
            {fieldBox('Policy Name', policyName, setPolicyName)}
            {selectBox('Policy Status', status, ALL_STATUSES, (v) => setStatus(v as ReviewStatus))}
          </div>
          {fieldBox('Underwriter', underwriter, setUnderwriter)}
        </div>

        {/* Tabs */}
        <div className="px-6 flex gap-4 border-b border-gray-200">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'text-teal-600 border-teal-600'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="border-t border-dashed border-slate-200" />

        {/* Tab content */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {tab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {fieldBox('Premium (Super)', premSuper.toFixed(2))}
                {fieldBox('Super Frequency', freqLabel)}
                {fieldBox('Date Generated', new Date().toLocaleDateString('en-AU'))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                {fieldBox('Premium (Non - Super)', premNonSuper.toFixed(2))}
                {fieldBox('Non - Super Frequency', freqLabel)}
                {fieldBox('Policy Fee', policyFee > 0 ? policyFee.toFixed(2) : '')}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {fieldBox('Total Premium', totalPrem.toFixed(2))}
                {fieldBox('Total Premium Frequency', freqLabel)}
              </div>
            </div>
          )}

          {tab === 'cover' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50">
                    <th className="py-2 px-2 text-left font-semibold text-slate-600">Type</th>
                    <th className="py-2 px-2 text-left font-semibold text-slate-600">Definition</th>
                    <th className="py-2 px-2 text-left font-semibold text-slate-600">Owner</th>
                    <th className="py-2 px-2 text-left font-semibold text-slate-600">Life Insured</th>
                    <th className="py-2 px-2 text-left font-semibold text-slate-600">Benefit Amount</th>
                    <th className="py-2 px-2 text-left font-semibold text-slate-600">Waiting Period</th>
                    <th className="py-2 px-2 text-left font-semibold text-slate-600">Benefit Period</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {covers.map((c, idx) => (
                    <tr key={c.id} className="border-b border-gray-100">
                      <td className="py-2 px-2 text-slate-700">{c.type}</td>
                      <td className="py-2 px-2">
                        <input
                          className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs"
                          value={c.definition}
                          onChange={(e) => updateCover(idx, { definition: e.target.value })}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          className="w-24 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs"
                          value={c.owner}
                          onChange={(e) => updateCover(idx, { owner: e.target.value })}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          className="w-24 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs"
                          value={c.lifeInsured}
                          onChange={(e) => updateCover(idx, { lifeInsured: e.target.value })}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          className="w-24 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-right"
                          value={c.benefitAmount}
                          onChange={(e) => updateCover(idx, { benefitAmount: e.target.value })}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          className="w-20 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs"
                          value={c.waitingPeriod}
                          onChange={(e) => updateCover(idx, { waitingPeriod: e.target.value })}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          className="w-20 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs"
                          value={c.benefitPeriod}
                          onChange={(e) => updateCover(idx, { benefitPeriod: e.target.value })}
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-slate-400 hover:text-slate-600 p-0.5">
                              <MoreVertical size={14} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'fees' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50">
                    <th className="py-2 px-2 text-left font-semibold text-slate-600">Premium Period</th>
                    <th className="py-2 px-2 text-left font-semibold text-slate-600">Comm. Premium ($)</th>
                    <th className="py-2 px-2 text-left font-semibold text-slate-600">Comm. Frequency</th>
                    <th className="py-2 px-2 text-left font-semibold text-slate-600">Comm. (%)</th>
                    <th className="py-2 px-2 text-left font-semibold text-slate-600">Comm. ($)</th>
                    <th className="py-2 px-2 text-center font-semibold text-slate-600">Include</th>
                  </tr>
                </thead>
                <tbody>
                  {feeRows.map((r) => (
                    <tr key={r.period} className="border-b border-gray-100">
                      <td className="py-2 px-2">
                        <div className="bg-slate-100 rounded px-2 py-1.5 text-slate-700">{r.period}</div>
                      </td>
                      <td className="py-2 px-2">
                        <div className="bg-slate-100 rounded px-2 py-1.5 text-slate-700">{r.premium.toFixed(2)}</div>
                      </td>
                      <td className="py-2 px-2">
                        <div className="bg-slate-100 rounded px-2 py-1.5 text-slate-700">{r.freq}</div>
                      </td>
                      <td className="py-2 px-2">
                        <div className="bg-slate-100 rounded px-2 py-1.5 text-slate-700">{r.pct > 0 ? r.pct.toFixed(0) : ''}</div>
                      </td>
                      <td className="py-2 px-2">
                        <div className="bg-slate-100 rounded px-2 py-1.5 text-slate-700">{r.amt > 0 ? r.amt.toFixed(2) : ''}</div>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-500 text-white">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
          <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>
            Close
          </Button>
          <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
