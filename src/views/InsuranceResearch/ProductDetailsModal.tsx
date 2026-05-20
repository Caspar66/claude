import { useState } from 'react';
import { X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReviewItem, ReviewCover } from './ScenarioReviewPage';
import type { PremiumFrequency } from './insuranceData';
import { PREMIUM_FREQUENCY_LABELS } from './insuranceData';
import type { ResolvedCover } from './quoteResultsData';
import {
  STRUCTURE_4_LABELS,
  STRUCTURE_3_LABELS,
  OCCUPATION_LABELS,
} from './needsTypes';

type DetailsTab = 'details' | 'cover' | 'fees';

interface Props {
  item: ReviewItem;
  clientName: string;
  partnerName: string | null;
  quoteSuperFreq?: PremiumFrequency;
  quoteNonSuperFreq?: PremiumFrequency;
  onSave: (updated: ReviewItem) => void;
  onClose: () => void;
}


function readOnlyField(label: string, value: string) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-600 mb-1">{label}</div>
      <div className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm text-slate-800">
        {value || ' '}
      </div>
    </div>
  );
}

function editableField(label: string, value: string, onChange: (v: string) => void) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-600 mb-1">{label}</div>
      <input
        className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}


function resolveStructureLabel(code: string | undefined): string {
  if (!code) return '';
  return (STRUCTURE_4_LABELS as Record<string, string>)[code]
    ?? (STRUCTURE_3_LABELS as Record<string, string>)[code]
    ?? code;
}

function resolveOccupationLabel(code: string | undefined): string {
  if (!code) return '';
  return (OCCUPATION_LABELS as Record<string, string>)[code] ?? code;
}

function benefitFrequency(rc: ResolvedCover): string {
  if (rc.monthlyBenefit != null) return 'Monthly';
  return 'Single';
}

function formatBenefitPeriod(bp: string | undefined): string {
  if (!bp) return '';
  const n = parseInt(bp, 10);
  if (isNaN(n)) return bp;
  if (n <= 5) return `${n} year${n === 1 ? '' : 's'}`;
  return `Age ${n}`;
}

function formatWaitingPeriod(wp: string | undefined): string {
  if (!wp) return '';
  return `${wp} days`;
}

// ── Cover Details Sub-Modal ────────────────────────────────────────────────

function CoverDetailsModal({
  cover,
  itemStatus,
  lifeInsuredName,
  onClose,
}: {
  cover: ReviewCover;
  itemStatus: string;
  lifeInsuredName: string;
  onClose: () => void;
}) {
  const rc = cover.resolved;
  const ownerDisplay = cover.owner || lifeInsuredName;
  const coverStructureDisplay = cover.coverStructure || (rc ? (rc.isLinked ? 'Linked' : 'Standalone') : '');
  const premStructureDisplay = cover.premiumStructure || (rc?.structure ? resolveStructureLabel(rc.structure) : '');
  const isSuperDisplay = cover.isSuper ? 'True' : 'False';
  const isTPD = cover.type === 'TPD';
  const isIP = cover.type === 'Income Protection';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-[680px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-slate-800">Product Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {readOnlyField('Cover Type', cover.type)}
            {readOnlyField('Cover Structure', coverStructureDisplay)}
            {readOnlyField('Owner', ownerDisplay)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {readOnlyField('Life Insured', lifeInsuredName)}
            {readOnlyField('Premium Structure', premStructureDisplay)}
            {readOnlyField('Is Super', isSuperDisplay)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {readOnlyField('Benefit Amount', cover.sumInsured ? parseFloat(cover.sumInsured).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '')}
            {readOnlyField('Definition', cover.definition || '')}
            {readOnlyField('Benefit Status', itemStatus)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {readOnlyField('Benefit Frequency', rc ? benefitFrequency(rc) : '')}
            {readOnlyField('Benefit Period', formatBenefitPeriod(cover.benefitPeriod || rc?.benefitPeriod))}
            {readOnlyField('Waiting Period', formatWaitingPeriod(cover.waitingPeriod || rc?.waitingPeriod))}
          </div>
          {!isTPD && !isIP && rc?.occupationType && (
            <div className="grid grid-cols-3 gap-4">
              {readOnlyField('Occupation Type', resolveOccupationLabel(rc.occupationType))}
              <div /><div />
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
          <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Product Details Modal ──────────────────────────────────────────────────

export function ProductDetailsModal({ item, clientName, partnerName, quoteSuperFreq, quoteNonSuperFreq, onSave, onClose }: Props) {
  const [tab, setTab] = useState<DetailsTab>('details');
  const [policyName, setPolicyName] = useState(item.label);
  const [coverDetailIdx, setCoverDetailIdx] = useState<number | null>(null);

  const lifeInsuredName = item.lifeInsured === 'client' ? clientName : (partnerName ?? 'Partner');

  const row = item.quoteRow;
  const existingPolicy = item.existingPolicy;

  const superFreq: PremiumFrequency = existingPolicy ? existingPolicy.superFrequency : (quoteSuperFreq ?? 'M');
  const nonSuperFreq: PremiumFrequency = existingPolicy ? existingPolicy.nonSuperFrequency : (quoteNonSuperFreq ?? 'M');

  const premSuper = row ? (row.premiumInsideSuper[superFreq] ?? 0) : (existingPolicy?.premiumSuper ?? 0);
  const premNonSuper = row ? (row.premiumOutsideSuper[nonSuperFreq] ?? 0) : (existingPolicy?.premiumNonSuper ?? 0);
  const stampSuper = row ? (row.stampDutyInsideSuper[superFreq] ?? 0) : (existingPolicy?.stampDutySuper ?? 0);
  const stampNonSuper = row ? (row.stampDutyOutsideSuper[nonSuperFreq] ?? 0) : (existingPolicy?.stampDutyNonSuper ?? 0);
  const totalPrem = premSuper + premNonSuper + stampSuper + stampNonSuper;
  const policyFee = row?.policyFee ?? 0;

  const origPremSuper = premSuper + stampSuper;
  const origPremNonSuper = premNonSuper + stampNonSuper;
  const origTotal = origPremSuper + origPremNonSuper + policyFee;

  const [premSuperEdit, setPremSuperEdit] = useState(origPremSuper.toFixed(2));
  const [premNonSuperEdit, setPremNonSuperEdit] = useState(origPremNonSuper.toFixed(2));
  const [policyFeeEdit, setPolicyFeeEdit] = useState(policyFee > 0 ? policyFee.toFixed(2) : '');

  const editedTotal = (parseFloat(premSuperEdit) || 0) + (parseFloat(premNonSuperEdit) || 0) + (parseFloat(policyFeeEdit) || 0);
  const totalChanged = Math.abs(editedTotal - origTotal) > 0.005;

  const commFreqInfo = (() => {
    if (!row) return { freq: superFreq, label: PREMIUM_FREQUENCY_LABELS[superFreq], isAnnualised: false };
    const hasSuper = (row.premiumInsideSuper[superFreq] ?? 0) > 0 || (row.stampDutyInsideSuper[superFreq] ?? 0) > 0;
    const hasNonSuper = (row.premiumOutsideSuper[nonSuperFreq] ?? 0) > 0 || (row.stampDutyOutsideSuper[nonSuperFreq] ?? 0) > 0;
    if (hasSuper && !hasNonSuper) return { freq: superFreq, label: PREMIUM_FREQUENCY_LABELS[superFreq], isAnnualised: false };
    if (hasNonSuper && !hasSuper) return { freq: nonSuperFreq, label: PREMIUM_FREQUENCY_LABELS[nonSuperFreq], isAnnualised: false };
    if (hasSuper && hasNonSuper && superFreq !== nonSuperFreq) return { freq: 'Y' as PremiumFrequency, label: 'Yearly', isAnnualised: true };
    return { freq: superFreq, label: PREMIUM_FREQUENCY_LABELS[superFreq], isAnnualised: false };
  })();

  const commPremiumY1 = row
    ? (row.premiumInsideSuper[commFreqInfo.freq] ?? 0) + (row.stampDutyInsideSuper[commFreqInfo.freq] ?? 0)
      + (row.premiumOutsideSuper[commFreqInfo.freq] ?? 0) + (row.stampDutyOutsideSuper[commFreqInfo.freq] ?? 0)
    : totalPrem;

  const proj1 = row?.projections[1];
  const commPremiumRenewal = proj1
    ? (proj1.premiumInsideSuper[commFreqInfo.freq] ?? 0) + (proj1.stampDutyInsideSuper[commFreqInfo.freq] ?? 0)
      + (proj1.premiumOutsideSuper[commFreqInfo.freq] ?? 0) + (proj1.stampDutyOutsideSuper[commFreqInfo.freq] ?? 0)
    : commPremiumY1;

  const commUpfrontPct = row ? (row.commissionUpfrontPercent[commFreqInfo.freq] ?? Object.values(row.commissionUpfrontPercent)[0] ?? 0) : 0;
  const commUpfrontAmt = row
    ? (commFreqInfo.isAnnualised ? (row.commissionUpfrontAnnualised ?? row.commissionUpfront['Y'] ?? 0) : (row.commissionUpfront[commFreqInfo.freq] ?? 0))
    : 0;
  const commOngoingPct = row ? (row.commissionOngoingPercent[commFreqInfo.freq] ?? Object.values(row.commissionOngoingPercent)[0] ?? 0) : 0;
  const commOngoingAmt = row
    ? (commFreqInfo.isAnnualised ? (row.commissionOngoingAnnualised ?? row.commissionOngoing['Y'] ?? 0) : (row.commissionOngoing[commFreqInfo.freq] ?? 0))
    : 0;

  const feeRows = [
    { period: 'Premium Year 1', premium: commPremiumY1, freq: commFreqInfo.label, pct: commUpfrontPct, amt: commUpfrontAmt },
    { period: 'Premium Renewal', premium: commPremiumRenewal, freq: commFreqInfo.label, pct: commOngoingPct, amt: commOngoingAmt },
  ];

  const [feeState, setFeeState] = useState(
    feeRows.map((r) => ({
      premium: r.premium.toFixed(2),
      freq: r.freq,
      pct: r.pct > 0 ? r.pct.toFixed(0) : '',
      amt: r.amt > 0 ? r.amt.toFixed(2) : '',
      include: true,
    }))
  );

  const updateFee = (idx: number, field: string, value: string | boolean) => {
    setFeeState((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  function handleSave() {
    const updated: ReviewItem = {
      ...item,
      label: policyName,
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
            {editableField('Policy Name', policyName, setPolicyName)}
            {readOnlyField('Policy Status', item.status)}
          </div>
          {readOnlyField('Underwriter', item.insurer)}
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

        {/* Tab content */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {tab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {editableField('Premium (Super)', premSuperEdit, setPremSuperEdit)}
                {readOnlyField('Super Frequency', PREMIUM_FREQUENCY_LABELS[superFreq])}
                {readOnlyField('Date Generated', new Date().toLocaleDateString('en-AU'))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                {editableField('Premium (Non - Super)', premNonSuperEdit, setPremNonSuperEdit)}
                {readOnlyField('Non - Super Frequency', PREMIUM_FREQUENCY_LABELS[nonSuperFreq])}
                {editableField('Policy Fee', policyFeeEdit, setPolicyFeeEdit)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {readOnlyField('Total Premium', editedTotal.toFixed(2))}
                {readOnlyField('Total Premium Frequency', PREMIUM_FREQUENCY_LABELS[superFreq])}
              </div>
            </div>
          )}

          {tab === 'cover' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50">
                    <th className="py-2 px-2 text-left font-semibold text-slate-600">Type</th>
                    <th className="py-2 px-2 text-left font-semibold text-slate-600">Description</th>
                    <th className="py-2 px-2 text-left font-semibold text-slate-600">Premium Structure</th>
                    <th className="py-2 px-2 text-left font-semibold text-slate-600">Cover Structure</th>
                    <th className="py-2 px-2 text-center font-semibold text-slate-600">Super</th>
                    <th className="py-2 px-2 text-left font-semibold text-slate-600">Owner</th>
                    <th className="py-2 px-2 text-left font-semibold text-slate-600">Life Insured</th>
                    <th className="py-2 px-2 text-right font-semibold text-slate-600">Benefit Amount</th>
                    <th className="py-2 px-2 text-left font-semibold text-slate-600">Benefit Period</th>
                    <th className="py-2 px-2 text-left font-semibold text-slate-600">Waiting Period</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {item.covers.map((c, idx) => {
                    const rc = c.resolved;
                    return (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2 px-2 text-slate-700">{c.type}</td>
                        <td className="py-2 px-2 text-slate-600">{c.definition || ''}</td>
                        <td className="py-2 px-2 text-slate-600">{c.premiumStructure || (rc?.structure ? resolveStructureLabel(rc.structure) : '')}</td>
                        <td className="py-2 px-2 text-slate-600">{c.coverStructure || ''}</td>
                        <td className="py-2 px-2 text-center">
                          <input type="checkbox" checked={c.isSuper} disabled className="rounded border-gray-300 text-teal-600 h-3.5 w-3.5 cursor-default" />
                        </td>
                        <td className="py-2 px-2 text-slate-600">{c.owner || lifeInsuredName}</td>
                        <td className="py-2 px-2 text-slate-600">{lifeInsuredName}</td>
                        <td className="py-2 px-2 text-right text-slate-800 font-medium">
                          {c.sumInsured ? `$${parseFloat(c.sumInsured.replace(/[^0-9.]/g, '') || '0').toLocaleString('en-AU')}` : ''}
                        </td>
                        <td className="py-2 px-2 text-slate-600">{c.benefitPeriod ? formatBenefitPeriod(c.benefitPeriod) : (rc?.benefitPeriod ? formatBenefitPeriod(rc.benefitPeriod) : '')}</td>
                        <td className="py-2 px-2 text-slate-600">{c.waitingPeriod ? formatWaitingPeriod(c.waitingPeriod) : (rc?.waitingPeriod ? formatWaitingPeriod(rc.waitingPeriod) : '')}</td>
                        <td className="py-2 px-2 text-center">
                          <button
                            onClick={() => setCoverDetailIdx(idx)}
                            className="text-teal-600 hover:text-teal-800 p-0.5"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
                  {feeState.map((r, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-2 px-2">
                        <div className="bg-slate-100 rounded px-2 py-1.5 text-slate-700">
                          {idx === 0 ? 'Premium Year 1' : 'Premium Renewal'}
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          value={r.premium}
                          onChange={(e) => updateFee(idx, 'premium', e.target.value)}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          value={r.freq}
                          onChange={(e) => updateFee(idx, 'freq', e.target.value)}
                        >
                          {Object.values(PREMIUM_FREQUENCY_LABELS).map((l) => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          value={r.pct}
                          onChange={(e) => updateFee(idx, 'pct', e.target.value)}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          value={r.amt}
                          onChange={(e) => updateFee(idx, 'amt', e.target.value)}
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => updateFee(idx, 'include', !r.include)}
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                            r.include ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          {totalChanged && (
            <p className="text-xs text-amber-600 mb-2">
              Fee details will need to be checked as the Total Premium amount has changed.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Cover Details sub-modal */}
      {coverDetailIdx !== null && item.covers[coverDetailIdx] && (
        <CoverDetailsModal
          cover={item.covers[coverDetailIdx]}
          itemStatus={item.status}
          lifeInsuredName={lifeInsuredName}
          onClose={() => setCoverDetailIdx(null)}
        />
      )}
    </div>
  );
}
