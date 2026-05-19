import { useState } from 'react';
import { X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReviewItem } from './ScenarioReviewPage';
import type { PremiumFrequency } from './insuranceData';
import { PREMIUM_FREQUENCY_LABELS } from './insuranceData';
import type { ResolvedCover } from './quoteResultsData';
import { getNeedLabel } from './quoteResultsData';
import {
  STRUCTURE_4_LABELS,
  STRUCTURE_3_LABELS,
  OWNER_INC_LABELS,
  OCCUPATION_LABELS,
} from './needsTypes';
import type { Structure4, Structure3, OwnerINC, OccupationType } from './needsTypes';

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

const FREQ_OPTIONS = Object.entries(PREMIUM_FREQUENCY_LABELS).map(([k, v]) => ({ value: k, label: v }));

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

function freqSelect(label: string, value: string, onChange: (v: string) => void) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-600 mb-1">{label}</div>
      <select
        className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {FREQ_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function resolveStructureLabel(code: string | undefined): string {
  if (!code) return '';
  return (STRUCTURE_4_LABELS as Record<string, string>)[code]
    ?? (STRUCTURE_3_LABELS as Record<string, string>)[code]
    ?? code;
}

function resolveOwnerLabel(code: string | undefined): string {
  if (!code) return '';
  return (OWNER_INC_LABELS as Record<string, string>)[code] ?? code;
}

function resolveOccupationLabel(code: string | undefined): string {
  if (!code) return '';
  return (OCCUPATION_LABELS as Record<string, string>)[code] ?? code;
}

function isSuper(ownerCode: string | undefined): string {
  if (!ownerCode) return '';
  return ownerCode === 'S' || ownerCode === 'J' || ownerCode === 'K' || ownerCode === 'M' ? 'True' : 'False';
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

function coverStructure(rc: ResolvedCover): string {
  if (rc.isLinked) return 'Linked';
  return 'Standalone';
}

// ── Cover Details Sub-Modal ────────────────────────────────────────────────

function CoverDetailsModal({
  cover,
  itemStatus,
  lifeInsuredName,
  onClose,
}: {
  cover: { type: string; definition?: string; sumInsured: string; owner?: string; resolved?: ResolvedCover };
  itemStatus: string;
  lifeInsuredName: string;
  onClose: () => void;
}) {
  const rc = cover.resolved;

  const ownerDisplay = rc?.owner ? resolveOwnerLabel(rc.owner) : (cover.owner || lifeInsuredName);

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
            {readOnlyField('Cover Structure', rc ? coverStructure(rc) : '')}
            {readOnlyField('Owner', ownerDisplay)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {readOnlyField('Life Insured', lifeInsuredName)}
            {readOnlyField('Premium Structure', rc ? resolveStructureLabel(rc.structure) : '')}
            {readOnlyField('Is Super', rc ? isSuper(rc.owner) : '')}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {readOnlyField('Benefit Amount', cover.sumInsured ? parseFloat(cover.sumInsured).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '')}
            {readOnlyField('Definition', rc?.definition || cover.definition || '')}
            {readOnlyField('Benefit Status', itemStatus)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {readOnlyField('Benefit Frequency', rc ? benefitFrequency(rc) : '')}
            {readOnlyField('Benefit Period', formatBenefitPeriod(rc?.benefitPeriod))}
            {readOnlyField('Waiting Period', formatWaitingPeriod(rc?.waitingPeriod))}
          </div>
          {rc?.occupationType && (
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
  const [underwriter, setUnderwriter] = useState(item.insurer);
  const [coverDetailIdx, setCoverDetailIdx] = useState<number | null>(null);

  const lifeInsuredName = item.lifeInsured === 'client' ? clientName : (partnerName ?? 'Partner');

  const row = item.quoteRow;
  const existingPolicy = item.existingPolicy;

  const [superFreq, setSuperFreq] = useState<PremiumFrequency>(
    existingPolicy ? existingPolicy.superFrequency : (quoteSuperFreq ?? 'M')
  );
  const [nonSuperFreq, setNonSuperFreq] = useState<PremiumFrequency>(
    existingPolicy ? existingPolicy.nonSuperFrequency : (quoteNonSuperFreq ?? 'M')
  );

  const premSuper = row ? (row.premiumInsideSuper[superFreq] ?? 0) : (existingPolicy?.premiumSuper ?? 0);
  const premNonSuper = row ? (row.premiumOutsideSuper[nonSuperFreq] ?? 0) : (existingPolicy?.premiumNonSuper ?? 0);
  const stampSuper = row ? (row.stampDutyInsideSuper[superFreq] ?? 0) : (existingPolicy?.stampDutySuper ?? 0);
  const stampNonSuper = row ? (row.stampDutyOutsideSuper[nonSuperFreq] ?? 0) : (existingPolicy?.stampDutyNonSuper ?? 0);
  const totalPrem = premSuper + premNonSuper + stampSuper + stampNonSuper;
  const policyFee = row?.policyFee ?? 0;

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

  function handleSave() {
    const updated: ReviewItem = {
      ...item,
      label: policyName,
      insurer: underwriter,
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
          {editableField('Underwriter', underwriter, setUnderwriter)}
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
                {readOnlyField('Premium (Super)', premSuper.toFixed(2))}
                {freqSelect('Super Frequency', superFreq, (v) => setSuperFreq(v as PremiumFrequency))}
                {readOnlyField('Date Generated', new Date().toLocaleDateString('en-AU'))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                {readOnlyField('Premium (Non - Super)', premNonSuper.toFixed(2))}
                {freqSelect('Non - Super Frequency', nonSuperFreq, (v) => setNonSuperFreq(v as PremiumFrequency))}
                {readOnlyField('Policy Fee', policyFee > 0 ? policyFee.toFixed(2) : '')}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {readOnlyField('Total Premium', totalPrem.toFixed(2))}
                {freqSelect('Total Premium Frequency', superFreq, (v) => setSuperFreq(v as PremiumFrequency))}
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
                  {item.covers.map((c, idx) => {
                    const rc = c.resolved;
                    const ownerDisplay = rc?.owner ? resolveOwnerLabel(rc.owner) : (c.owner || lifeInsuredName);
                    return (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2 px-2 text-slate-700">{c.type}</td>
                        <td className="py-2 px-2 text-slate-600">{c.definition || c.type}</td>
                        <td className="py-2 px-2 text-slate-600">{ownerDisplay}</td>
                        <td className="py-2 px-2 text-slate-600">{lifeInsuredName}</td>
                        <td className="py-2 px-2 text-right text-slate-800 font-medium">
                          {c.sumInsured ? `$${parseFloat(c.sumInsured.replace(/[^0-9.]/g, '') || '0').toLocaleString('en-AU')}` : ''}
                        </td>
                        <td className="py-2 px-2 text-slate-600">{formatWaitingPeriod(rc?.waitingPeriod)}</td>
                        <td className="py-2 px-2 text-slate-600">{formatBenefitPeriod(rc?.benefitPeriod)}</td>
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
