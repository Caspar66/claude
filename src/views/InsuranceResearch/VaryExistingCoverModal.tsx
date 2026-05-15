import { useMemo, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ExistingCover, ExistingCoverType, ExistingPolicy, PremiumFrequency } from './insuranceData';
import { COVER_TYPE_LABELS, OWNERSHIP_OPTIONS_BY_TYPE, PREMIUM_FREQUENCY_LABELS, PREMIUM_FREQUENCY_MULTIPLIER } from './insuranceData';

const COVER_TYPE_ORDER: ExistingCoverType[] = ['Life', 'TPD', 'Trauma', 'IP', 'BE', 'SBI', 'ChildCover', 'Needlestick'];

const COL_VISIBILITY: Record<ExistingCoverType, {
  super: boolean; definition: boolean; standAlone: boolean; flexiLinked: boolean;
  superLinked: boolean; waitingPeriod: boolean; benefitPeriod: boolean; addDeathCover: boolean;
}> = {
  Life:         { super: true,  definition: false, standAlone: false, flexiLinked: false, superLinked: false, waitingPeriod: false, benefitPeriod: false, addDeathCover: false },
  TPD:          { super: true,  definition: true,  standAlone: true,  flexiLinked: true,  superLinked: false, waitingPeriod: false, benefitPeriod: false, addDeathCover: false },
  Trauma:       { super: false, definition: false, standAlone: true,  flexiLinked: true,  superLinked: false, waitingPeriod: false, benefitPeriod: false, addDeathCover: false },
  IP:           { super: true,  definition: true,  standAlone: false, flexiLinked: false, superLinked: true,  waitingPeriod: true,  benefitPeriod: true,  addDeathCover: false },
  BE:           { super: false, definition: false, standAlone: false, flexiLinked: false, superLinked: false, waitingPeriod: true,  benefitPeriod: false, addDeathCover: false },
  SBI:          { super: false, definition: false, standAlone: false, flexiLinked: false, superLinked: true,  waitingPeriod: false, benefitPeriod: false, addDeathCover: true  },
  ChildCover:   { super: false, definition: false, standAlone: false, flexiLinked: false, superLinked: false, waitingPeriod: false, benefitPeriod: false, addDeathCover: false },
  Needlestick:  { super: false, definition: false, standAlone: false, flexiLinked: false, superLinked: false, waitingPeriod: false, benefitPeriod: false, addDeathCover: false },
};

const PREMIUM_STYLE_BY_TYPE: Partial<Record<ExistingCoverType, { code: string; label: string }[]>> = {
  Life:   [{ code: 'S', label: 'Variable age-stepped' }, { code: 'B', label: 'Blended' }, { code: 'L', label: 'Variable to age 65' }, { code: '70', label: 'Variable to age 70' }],
  TPD:    [{ code: 'S', label: 'Variable age-stepped' }, { code: 'B', label: 'Blended' }, { code: 'L', label: 'Variable to age 65' }, { code: '70', label: 'Variable to age 70' }],
  Trauma: [{ code: 'S', label: 'Variable age-stepped' }, { code: 'B', label: 'Blended' }, { code: 'L', label: 'Variable to age 65' }, { code: '70', label: 'Variable to age 70' }],
  IP:     [{ code: 'S', label: 'Variable age-stepped' }, { code: 'B', label: 'Blended' }, { code: 'L', label: 'Variable to age' }],
  BE:     [{ code: 'S', label: 'Variable age-stepped' }, { code: 'B', label: 'Blended' }, { code: 'L', label: 'Variable to age' }],
  SBI:    [{ code: 'S', label: 'Variable age-stepped' }, { code: 'B', label: 'Blended' }, { code: 'L', label: 'Variable to age' }],
};

const OWNERSHIP_VISIBLE: Record<ExistingCoverType, boolean> = {
  Life: true, TPD: true, Trauma: false, IP: true, BE: false, SBI: false, ChildCover: false, Needlestick: false,
};

const IP_WAITING_PERIODS = [
  { code: '14', label: '14 days' }, { code: '30', label: '30 days' }, { code: '60', label: '60 days' },
  { code: '90', label: '90 days' }, { code: '180', label: '180 days' }, { code: '365', label: '1 year' }, { code: '730', label: '2 years' },
];
const BE_WAITING_PERIODS = [
  { code: '14', label: '14 days' }, { code: '30', label: '30 days' }, { code: '60', label: '60 days' }, { code: '90', label: '90 days' },
];
const IP_BENEFIT_PERIODS = [
  { code: '1', label: '1 year' }, { code: '2', label: '2 years' }, { code: '5', label: '5 years' },
  { code: '55', label: 'To age 55' }, { code: '60', label: 'To age 60' }, { code: '65', label: 'To age 65' },
  { code: '67', label: 'To age 67' }, { code: '70', label: 'To age 70' },
];
const IP_DEFINITIONS = ['Indemnity', 'Agreed Value'];
const TPD_DEFINITIONS = ['Any', 'Own', 'Super-linked', 'ADL'];

function parseMoney(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

function sanitizeMoneyInput(s: string): string {
  const clean = s.replace(/[^0-9.]/g, '');
  const firstDot = clean.indexOf('.');
  if (firstDot === -1) return clean;
  return clean.slice(0, firstDot + 1) + clean.slice(firstDot + 1).replace(/\./g, '');
}

function superFromOwnership(ownership: string | undefined): 'Yes' | 'No' {
  return ownership && ownership !== 'O' ? 'Yes' : 'No';
}

interface Props {
  policy: ExistingPolicy;
  clientName: string;
  partnerName: string | null;
  onSave: (varied: ExistingPolicy) => void;
  onCancel: () => void;
}

export function VaryExistingCoverModal({ policy, clientName, partnerName, onSave, onCancel }: Props) {
  const [provider] = useState(policy.provider);
  const [policyDescription, setPolicyDescription] = useState(policy.policyDescription);
  const [premiumSuper, setPremiumSuper] = useState(String(policy.premiumSuper));
  const [superFreq, setSuperFreq] = useState<PremiumFrequency>(policy.superFrequency);
  const [premiumNonSuper, setPremiumNonSuper] = useState(String(policy.premiumNonSuper));
  const [nonSuperFreq, setNonSuperFreq] = useState<PremiumFrequency>(policy.nonSuperFrequency);
  const [error, setError] = useState<string | null>(null);

  const existingCoversMap = Object.fromEntries(policy.covers.map((c) => [c.coverType, c])) as Partial<Record<ExistingCoverType, ExistingCover>>;

  const [covers, setCovers] = useState<Record<ExistingCoverType, ExistingCover>>(() => {
    const init = {} as Record<ExistingCoverType, ExistingCover>;
    for (const t of COVER_TYPE_ORDER) {
      init[t] = existingCoversMap[t] ?? {
        id: `${t}-${Math.random().toString(36).slice(2, 9)}`,
        coverType: t,
        sumInsured: '',
        premiumStyle: PREMIUM_STYLE_BY_TYPE[t]?.[0]?.code ?? '',
        super: OWNERSHIP_VISIBLE[t] ? 'No' : undefined,
        definition: t === 'TPD' ? 'Any' : t === 'IP' ? 'Agreed Value' : undefined,
        standAlone: t === 'TPD' || t === 'Trauma' ? 'No' : undefined,
        flexiLinked: t === 'TPD' || t === 'Trauma' ? 'No' : undefined,
        superLinked: t === 'IP' || t === 'SBI' ? 'No' : undefined,
        waitingPeriod: t === 'IP' || t === 'BE' ? '30' : undefined,
        benefitPeriod: t === 'IP' ? '65' : undefined,
        addDeathCover: t === 'SBI' ? '' : undefined,
        ownership: OWNERSHIP_VISIBLE[t] ? 'O' : undefined,
      };
    }
    return init;
  });

  const { totalPremium, totalFrequencyLabel } = useMemo(() => {
    const superVal = parseMoney(premiumSuper);
    const nonSuperVal = parseMoney(premiumNonSuper);
    const superPy = superVal * PREMIUM_FREQUENCY_MULTIPLIER[superFreq];
    const nonSuperPy = nonSuperVal * PREMIUM_FREQUENCY_MULTIPLIER[nonSuperFreq];
    const total = superPy + nonSuperPy;
    let freq: PremiumFrequency;
    if (superVal > 0 && nonSuperVal > 0) {
      freq = superFreq === nonSuperFreq ? superFreq : 'Y';
    } else if (superVal > 0) freq = superFreq;
    else if (nonSuperVal > 0) freq = nonSuperFreq;
    else freq = 'Y';
    const displayTotal = freq === 'Y' ? total : total / PREMIUM_FREQUENCY_MULTIPLIER[freq];
    const suffix = freq === 'Y' ? 'pa' : PREMIUM_FREQUENCY_LABELS[freq].toLowerCase();
    return { totalPremium: displayTotal, totalFrequencyLabel: suffix };
  }, [premiumSuper, superFreq, premiumNonSuper, nonSuperFreq]);

  function updateCover(type: ExistingCoverType, patch: Partial<ExistingCover>) {
    setCovers((prev) => {
      const next = { ...prev[type], ...patch };
      if (patch.ownership !== undefined && OWNERSHIP_VISIBLE[type]) {
        next.super = superFromOwnership(patch.ownership);
      }
      if ((type === 'TPD' || type === 'Trauma')) {
        if (patch.standAlone === 'Yes') next.flexiLinked = 'No';
        if (patch.flexiLinked === 'Yes') next.standAlone = 'No';
      }
      return { ...prev, [type]: next };
    });
  }

  function handleSave() {
    const hasPremium = parseMoney(premiumSuper) > 0 || parseMoney(premiumNonSuper) > 0;
    if (!hasPremium) { setError('Please ensure a premium has been entered.'); return; }
    const coversWithValue = COVER_TYPE_ORDER.map((t) => covers[t]).filter((c) => parseMoney(c.sumInsured) > 0);
    const varied: ExistingPolicy = {
      ...policy,
      id: `vary-${Date.now()}`,
      policyDescription: policyDescription.trim() || policy.policyDescription,
      premiumSuper: parseMoney(premiumSuper),
      stampDutySuper: 0,
      superFrequency: superFreq,
      premiumNonSuper: parseMoney(premiumNonSuper),
      stampDutyNonSuper: 0,
      nonSuperFrequency: nonSuperFreq,
      covers: coversWithValue,
      action: 'Review',
    };
    onSave(varied);
  }

  const lifeInsuredLabel = policy.lifeInsured === 'client' ? clientName : (partnerName ?? 'Partner');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-indigo-900 rounded-t-lg">
          <h2 className="text-sm font-semibold text-white">Vary Existing Policy</h2>
          <button className="text-white/70 hover:text-white" onClick={onCancel}><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded px-3 py-2 text-amber-800 text-xs">
              <div className="flex items-center gap-2"><AlertTriangle size={14} /> {error}</div>
              <button onClick={() => setError(null)} className="text-amber-700 hover:text-amber-900"><X size={14} /></button>
            </div>
          )}

          {/* Policy header fields */}
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Provider:</label>
              <input className="w-full border border-gray-300 rounded px-3 py-1.5 bg-slate-50 text-slate-600" value={provider} readOnly />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Policy Description:</label>
              <input className="w-full border border-gray-300 rounded px-3 py-1.5" value={policyDescription} onChange={(e) => setPolicyDescription(e.target.value)} />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Life Insured:</label>
              <input className="w-full border border-gray-300 rounded px-3 py-1.5 bg-slate-50 text-slate-600" value={lifeInsuredLabel} readOnly />
            </div>
          </div>

          {/* Premium Details */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-2 border-b border-gray-200 pb-1">Premium Details</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <label className="text-slate-600 italic w-32">Premium (Super):</label>
                <input className="border border-gray-300 rounded px-2 py-1.5 w-32" value={premiumSuper} onChange={(e) => setPremiumSuper(sanitizeMoneyInput(e.target.value))} />
                <select className="border border-gray-300 rounded px-2 py-1.5" value={superFreq} onChange={(e) => setSuperFreq(e.target.value as PremiumFrequency)}>
                  {Object.entries(PREMIUM_FREQUENCY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-slate-600 italic w-32">Premium (Non-super):</label>
                <input className="border border-gray-300 rounded px-2 py-1.5 w-32" value={premiumNonSuper} onChange={(e) => setPremiumNonSuper(sanitizeMoneyInput(e.target.value))} />
                <select className="border border-gray-300 rounded px-2 py-1.5" value={nonSuperFreq} onChange={(e) => setNonSuperFreq(e.target.value as PremiumFrequency)}>
                  {Object.entries(PREMIUM_FREQUENCY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-2 text-xs font-bold text-slate-800">
              Total Premium: <span className="text-slate-900">${totalPremium.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
              <span className="text-slate-500 font-normal ml-1">/{totalFrequencyLabel}</span>
            </div>
          </div>

          {/* Cover Details */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-2 border-b border-gray-200 pb-1">Cover Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="py-1.5 px-2 text-left text-slate-600 font-semibold w-36">Cover Type</th>
                    <th className="py-1.5 px-2 text-left text-slate-600 font-semibold w-28">Sum Insured</th>
                    <th className="py-1.5 px-2 text-left text-slate-600 font-semibold w-40">Premium Style</th>
                    <th className="py-1.5 px-2 text-left text-slate-600 font-semibold">Super</th>
                    <th className="py-1.5 px-2 text-left text-slate-600 font-semibold">Definition</th>
                    <th className="py-1.5 px-2 text-left text-slate-600 font-semibold">Stand Alone</th>
                    <th className="py-1.5 px-2 text-left text-slate-600 font-semibold">Flexi-Linked</th>
                    <th className="py-1.5 px-2 text-left text-slate-600 font-semibold">Super-Linked</th>
                    <th className="py-1.5 px-2 text-left text-slate-600 font-semibold">Waiting Period</th>
                    <th className="py-1.5 px-2 text-left text-slate-600 font-semibold">Benefit Period</th>
                    <th className="py-1.5 px-2 text-left text-slate-600 font-semibold">Add. Death Cover</th>
                  </tr>
                </thead>
                <tbody>
                  {COVER_TYPE_ORDER.map((type) => {
                    const c = covers[type];
                    const vis = COL_VISIBILITY[type];
                    const styleOpts = PREMIUM_STYLE_BY_TYPE[type];
                    return (
                      <tr key={type} className="border-b border-gray-100">
                        <td className="py-1.5 px-2 font-medium text-slate-700">{COVER_TYPE_LABELS[type]}</td>
                        <td className="py-1.5 px-2">
                          <input
                            className="border border-gray-300 rounded px-2 py-1 w-24"
                            value={c.sumInsured}
                            placeholder="$0"
                            onChange={(e) => updateCover(type, { sumInsured: sanitizeMoneyInput(e.target.value) })}
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          {styleOpts ? (
                            <select className="border border-gray-300 rounded px-1 py-1 w-36" value={c.premiumStyle} onChange={(e) => updateCover(type, { premiumStyle: e.target.value })}>
                              {styleOpts.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
                            </select>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="py-1.5 px-2">
                          {vis.super ? (
                            <select className="border border-gray-300 rounded px-1 py-1" value={c.super ?? 'No'} readOnly disabled>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          ) : null}
                        </td>
                        <td className="py-1.5 px-2">
                          {vis.definition ? (
                            <select className="border border-gray-300 rounded px-1 py-1" value={c.definition ?? ''} onChange={(e) => updateCover(type, { definition: e.target.value })}>
                              {(type === 'TPD' ? TPD_DEFINITIONS : IP_DEFINITIONS).map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                          ) : null}
                        </td>
                        <td className="py-1.5 px-2">
                          {vis.standAlone ? (
                            <select className="border border-gray-300 rounded px-1 py-1" value={c.standAlone ?? 'No'} onChange={(e) => updateCover(type, { standAlone: e.target.value })}>
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </select>
                          ) : null}
                        </td>
                        <td className="py-1.5 px-2">
                          {vis.flexiLinked ? (
                            <select className="border border-gray-300 rounded px-1 py-1" value={c.flexiLinked ?? 'No'} onChange={(e) => updateCover(type, { flexiLinked: e.target.value })}>
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </select>
                          ) : null}
                        </td>
                        <td className="py-1.5 px-2">
                          {vis.superLinked ? (
                            <select className="border border-gray-300 rounded px-1 py-1" value={c.superLinked ?? 'No'} onChange={(e) => updateCover(type, { superLinked: e.target.value })}>
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </select>
                          ) : null}
                        </td>
                        <td className="py-1.5 px-2">
                          {vis.waitingPeriod ? (
                            <select className="border border-gray-300 rounded px-1 py-1" value={c.waitingPeriod ?? ''} onChange={(e) => updateCover(type, { waitingPeriod: e.target.value })}>
                              {(type === 'BE' ? BE_WAITING_PERIODS : IP_WAITING_PERIODS).map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
                            </select>
                          ) : null}
                        </td>
                        <td className="py-1.5 px-2">
                          {vis.benefitPeriod ? (
                            <select className="border border-gray-300 rounded px-1 py-1" value={c.benefitPeriod ?? ''} onChange={(e) => updateCover(type, { benefitPeriod: e.target.value })}>
                              {IP_BENEFIT_PERIODS.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
                            </select>
                          ) : null}
                        </td>
                        <td className="py-1.5 px-2">
                          {vis.addDeathCover ? (
                            <input className="border border-gray-300 rounded px-2 py-1 w-20" value={c.addDeathCover ?? ''} onChange={(e) => updateCover(type, { addDeathCover: e.target.value })} />
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-lg flex justify-end gap-2">
          <Button size="sm" className="bg-indigo-900 hover:bg-indigo-950 text-white text-xs h-8 px-4" onClick={handleSave}>Save</Button>
          <Button size="sm" variant="outline" className="text-xs h-8 px-4" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
