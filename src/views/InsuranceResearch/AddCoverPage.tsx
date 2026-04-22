import { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLegacySuppliers } from '@/hooks/useLegacySuppliers';
import type { ExistingCover, ExistingCoverType, ExistingPolicy, PremiumFrequency } from './insuranceData';
import { COVER_TYPE_LABELS, OWNERSHIP_OPTIONS_BY_TYPE, PREMIUM_FREQUENCY_LABELS, PREMIUM_FREQUENCY_MULTIPLIER } from './insuranceData';

const COVER_TYPE_ORDER: ExistingCoverType[] = ['Life', 'TPD', 'Trauma', 'IP', 'BE', 'SBI', 'ChildCover', 'Needlestick'];

// Which columns are visible for each cover type
const COL_VISIBILITY: Record<ExistingCoverType, {
  super: boolean;
  definition: boolean;
  standAlone: boolean;
  flexiLinked: boolean;
  superLinked: boolean;
  waitingPeriod: boolean;
  benefitPeriod: boolean;
  addDeathCover: boolean;
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

interface PremiumStyleOption { code: string; label: string }

const PREMIUM_STYLE_BY_TYPE: Partial<Record<ExistingCoverType, PremiumStyleOption[]>> = {
  Life:   [{ code: 'S', label: 'Variable age-stepped' }, { code: 'B', label: 'Blended' }, { code: 'L', label: 'Variable to age 65' }, { code: '70', label: 'Variable to age 65' }],
  TPD:    [{ code: 'S', label: 'Variable age-stepped' }, { code: 'B', label: 'Blended' }, { code: 'L', label: 'Variable to age 65' }, { code: '70', label: 'Variable to age 65' }],
  Trauma: [{ code: 'S', label: 'Variable age-stepped' }, { code: 'B', label: 'Blended' }, { code: 'L', label: 'Variable to age 65' }, { code: '70', label: 'Variable to age 65' }],
  IP:     [{ code: 'S', label: 'Variable age-stepped' }, { code: 'B', label: 'Blended' }, { code: 'L', label: 'Variable to age' }],
  BE:     [{ code: 'S', label: 'Variable age-stepped' }, { code: 'B', label: 'Blended' }, { code: 'L', label: 'Variable to age' }],
  SBI:    [{ code: 'S', label: 'Variable age-stepped' }, { code: 'B', label: 'Blended' }, { code: 'L', label: 'Variable to age' }],
};

const OWNERSHIP_VISIBLE: Record<ExistingCoverType, boolean> = {
  Life: true, TPD: true, Trauma: false, IP: true, BE: false, SBI: false, ChildCover: false, Needlestick: false,
};

interface CodedOption { code: string; label: string }

const IP_WAITING_PERIODS: CodedOption[] = [
  { code: '14', label: '14 days' },
  { code: '30', label: '30 days' },
  { code: '60', label: '60 days' },
  { code: '90', label: '90 days' },
  { code: '180', label: '180 days' },
  { code: '365', label: '1 year' },
  { code: '730', label: '2 years' },
];

const BE_WAITING_PERIODS: CodedOption[] = [
  { code: '14', label: '14 days' },
  { code: '30', label: '30 days' },
  { code: '60', label: '60 days' },
  { code: '90', label: '90 days' },
];

const IP_BENEFIT_PERIODS: CodedOption[] = [
  { code: '1', label: '1 year' },
  { code: '2', label: '2 years' },
  { code: '5', label: '5 years' },
  { code: '55', label: 'To age 55' },
  { code: '60', label: 'To age 60' },
  { code: '65', label: 'To age 65' },
  { code: '67', label: 'To age 67' },
  { code: '70', label: 'To age 70' },
];

const IP_DEFINITIONS = ['Indemnity', 'Agreed Value'];
const TPD_DEFINITIONS = ['Any', 'Own', 'Super-linked', 'ADL'];

interface Props {
  scenarioTitle: string;
  clientName: string;
  partnerName: string | null;
  onSave: (policy: ExistingPolicy) => void;
  onCancel: () => void;
}

function superFromOwnership(ownership: string | undefined): 'Yes' | 'No' {
  return ownership && ownership !== 'O' ? 'Yes' : 'No';
}

function emptyCover(type: ExistingCoverType): ExistingCover {
  const styleOpts = PREMIUM_STYLE_BY_TYPE[type];
  const ownership = OWNERSHIP_VISIBLE[type] ? 'O' : undefined;
  return {
    id: `${type}-${Math.random().toString(36).slice(2, 9)}`,
    coverType: type,
    sumInsured: '',
    premiumStyle: styleOpts ? styleOpts[0].code : '',
    super: OWNERSHIP_VISIBLE[type] ? superFromOwnership(ownership) : undefined,
    definition: type === 'TPD' ? 'Any' : type === 'IP' ? 'Agreed Value' : undefined,
    standAlone: type === 'TPD' || type === 'Trauma' ? 'No' : undefined,
    flexiLinked: type === 'TPD' || type === 'Trauma' ? 'No' : undefined,
    superLinked: type === 'IP' || type === 'SBI' ? 'No' : undefined,
    waitingPeriod: type === 'IP' || type === 'BE' ? '30' : undefined,
    benefitPeriod: type === 'IP' ? '65' : undefined,
    addDeathCover: type === 'SBI' ? '' : undefined,
    ownership,
  };
}

function parseMoney(s: string): number {
  const clean = s.replace(/[^0-9.]/g, '');
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

export function AddCoverPage({ scenarioTitle, clientName, partnerName, onSave, onCancel }: Props) {
  const { suppliers: legacySuppliers, loading: suppliersLoading } = useLegacySuppliers();

  const [provider, setProvider] = useState('');
  const [providerQuery, setProviderQuery] = useState('');
  const [providerOpen, setProviderOpen] = useState(false);
  const [policyDescription, setPolicyDescription] = useState('');
  const [lifeInsured, setLifeInsured] = useState<'client' | 'partner'>('client');
  const [premiumSuper, setPremiumSuper] = useState('0');
  const [premiumNonSuper, setPremiumNonSuper] = useState('0');
  const [premiumFreq, setPremiumFreq] = useState<PremiumFrequency>('M');
  const [stampDutySuper, setStampDutySuper] = useState('0');
  const [stampDutyNonSuper, setStampDutyNonSuper] = useState('0');
  const [stampDutyFreq, setStampDutyFreq] = useState<PremiumFrequency>('Y');

  const [covers, setCovers] = useState<Record<ExistingCoverType, ExistingCover>>(() => {
    const init = {} as Record<ExistingCoverType, ExistingCover>;
    COVER_TYPE_ORDER.forEach((t) => { init[t] = emptyCover(t); });
    return init;
  });

  const [error, setError] = useState<string | null>(null);

  const { totalPremium, totalFrequencyLabel } = useMemo(() => {
    const total = parseMoney(premiumSuper) + parseMoney(premiumNonSuper);
    const suffix = PREMIUM_FREQUENCY_LABELS[premiumFreq].toLowerCase();
    return { totalPremium: total, totalFrequencyLabel: suffix };
  }, [premiumSuper, premiumNonSuper, premiumFreq]);

  const filteredSuppliers = providerQuery
    ? legacySuppliers.filter((s) => s.name.toLowerCase().includes(providerQuery.toLowerCase())).slice(0, 20)
    : legacySuppliers.slice(0, 20);

  function updateCover(type: ExistingCoverType, patch: Partial<ExistingCover>) {
    setCovers((prev) => {
      const next: ExistingCover = { ...prev[type], ...patch };
      if (patch.ownership !== undefined && OWNERSHIP_VISIBLE[type]) {
        next.super = superFromOwnership(patch.ownership);
      }
      if (type === 'TPD' || type === 'Trauma') {
        if (patch.standAlone === 'Yes') next.flexiLinked = 'No';
        if (patch.flexiLinked === 'Yes') next.standAlone = 'No';
      }
      return { ...prev, [type]: next };
    });
  }

  // SMSF SuperLink (K) for TPD only allowed when Trauma has a value AND Trauma Stand Alone is 'Yes'.
  // If condition becomes false while TPD ownership is 'K', reset TPD ownership to 'O'.
  const traumaSumInsured = parseMoney(covers.Trauma.sumInsured);
  const traumaStandAlone = covers.Trauma.standAlone;
  const smsfSuperLinkAllowed = traumaSumInsured > 0 && traumaStandAlone === 'Yes';

  useEffect(() => {
    if (!smsfSuperLinkAllowed && covers.TPD.ownership === 'K') {
      setCovers((prev) => ({ ...prev, TPD: { ...prev.TPD, ownership: 'O', super: 'No' } }));
    }
  }, [smsfSuperLinkAllowed, covers.TPD.ownership]);

  function handleSave() {
    const hasPremium = parseMoney(premiumSuper) > 0 || parseMoney(premiumNonSuper) > 0;
    if (!hasPremium) {
      setError('Please ensure a premium has been entered.');
      return;
    }
    for (const t of COVER_TYPE_ORDER) {
      const c = covers[t];
      if (parseMoney(c.sumInsured) > 0 && OWNERSHIP_VISIBLE[t] && !c.ownership) {
        setError(`Ownership is required for ${COVER_TYPE_LABELS[t]}.`);
        return;
      }
    }
    const coversWithSumInsured = COVER_TYPE_ORDER
      .map((t) => covers[t])
      .filter((c) => parseMoney(c.sumInsured) > 0);

    const policy: ExistingPolicy = {
      id: `pol-${Date.now()}`,
      provider: provider.trim() || 'Unknown',
      policyDescription: policyDescription.trim(),
      lifeInsured,
      premiumSuper: parseMoney(premiumSuper),
      premiumNonSuper: parseMoney(premiumNonSuper),
      premiumFrequency: premiumFreq,
      stampDutySuper: parseMoney(stampDutySuper),
      stampDutyNonSuper: parseMoney(stampDutyNonSuper),
      stampDutyFrequency: stampDutyFreq,
      covers: coversWithSumInsured,
      action: 'Not Considered',
    };
    onSave(policy);
  }

  const selectedSupplierMatch = legacySuppliers.find((s) => s.name === provider);

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Title bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white">
        <h2 className="text-sm font-bold text-slate-800">
          Risk Researcher: <span className="font-normal">{scenarioTitle}</span>
        </h2>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-indigo-900 hover:bg-indigo-950 text-white text-xs h-8 px-4" onClick={handleSave}>Save</Button>
          <Button size="sm" variant="outline" className="text-xs h-8 px-4" onClick={onCancel}>Cancel</Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-5 mt-3 flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded px-3 py-2 text-amber-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
          <button onClick={() => setError(null)} className="text-amber-700 hover:text-amber-900"><X size={14} /></button>
        </div>
      )}

      {/* Section header */}
      <div className="mx-5 mt-4 px-4 py-2 bg-slate-400/70 text-white text-sm font-bold rounded-t">
        Add Existing Cover
      </div>

      {/* Form */}
      <div className="mx-5 bg-white border border-gray-200 rounded-b p-5 space-y-4">
        {/* Provider */}
        <div className="grid grid-cols-[160px_1fr] gap-3 items-center">
          <label className="text-sm font-semibold text-slate-700">Provider:</label>
          <div className="relative max-w-md">
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={provider}
              onChange={(e) => { setProvider(e.target.value); setProviderQuery(e.target.value); setProviderOpen(true); }}
              onFocus={() => setProviderOpen(true)}
              onBlur={() => setTimeout(() => setProviderOpen(false), 150)}
              placeholder={suppliersLoading ? 'Loading suppliers…' : 'Select or type provider'}
            />
            {suppliersLoading && <Loader2 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-blue-500" />}
            {providerOpen && filteredSuppliers.length > 0 && (
              <div className="absolute z-50 mt-0.5 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                {filteredSuppliers.map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 ${selectedSupplierMatch?.code === s.code ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
                    onMouseDown={(e) => { e.preventDefault(); setProvider(s.name); setProviderQuery(''); setProviderOpen(false); }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Policy Description */}
        <div className="grid grid-cols-[160px_1fr] gap-3 items-center">
          <label className="text-sm font-semibold text-slate-700">Policy Description:</label>
          <input
            type="text"
            className="max-w-md border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={policyDescription}
            onChange={(e) => setPolicyDescription(e.target.value)}
          />
        </div>

        {/* Life Insured */}
        <div className="grid grid-cols-[160px_1fr] gap-3 items-center">
          <label className="text-sm font-semibold text-slate-700">Life Insured:</label>
          <select
            className="max-w-md border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={lifeInsured}
            onChange={(e) => setLifeInsured(e.target.value as 'client' | 'partner')}
          >
            <option value="client">{clientName}</option>
            {partnerName && <option value="partner">{partnerName}</option>}
          </select>
        </div>

        {/* Premium Details */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-2">Premium Details</h3>
          <div className="grid grid-cols-[160px_140px_140px_120px] gap-2 items-center mb-1">
            <div />
            <div className="text-xs font-bold text-slate-600 text-center">Super</div>
            <div className="text-xs font-bold text-slate-600 text-center">Non-Super</div>
            <div className="text-xs font-bold text-slate-600 text-center">Frequency</div>
          </div>
          <div className="grid grid-cols-[160px_140px_140px_120px] gap-2 items-center mb-2">
            <label className="text-sm italic text-slate-600">Premium:</label>
            <input
              type="text"
              className="border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={premiumSuper}
              onChange={(e) => setPremiumSuper(e.target.value)}
            />
            <input
              type="text"
              className="border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={premiumNonSuper}
              onChange={(e) => setPremiumNonSuper(e.target.value)}
            />
            <select
              className="border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={premiumFreq}
              onChange={(e) => setPremiumFreq(e.target.value as PremiumFrequency)}
            >
              {(Object.entries(PREMIUM_FREQUENCY_LABELS) as [PremiumFrequency, string][]).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-[160px_140px_140px_120px] gap-2 items-center mb-2">
            <label className="text-sm italic text-slate-600">Stamp Duty:</label>
            <input
              type="text"
              className="border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={stampDutySuper}
              onChange={(e) => setStampDutySuper(e.target.value)}
            />
            <input
              type="text"
              className="border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={stampDutyNonSuper}
              onChange={(e) => setStampDutyNonSuper(e.target.value)}
            />
            <select
              className="border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={stampDutyFreq}
              onChange={(e) => setStampDutyFreq(e.target.value as PremiumFrequency)}
            >
              {(Object.entries(PREMIUM_FREQUENCY_LABELS) as [PremiumFrequency, string][]).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-[160px_auto] gap-2 items-center">
            <label className="text-sm italic text-slate-600">Total Premium:</label>
            <span className="text-sm text-slate-700">
              <strong>${totalPremium.toFixed(2)}</strong>
              <span className="text-teal-600 ml-1"> / {totalFrequencyLabel}</span>
            </span>
          </div>
        </div>

        {/* Cover Details */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-2">Cover Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="text-left px-2 py-2 font-bold text-slate-700">Cover Type</th>
                  <th className="text-left px-2 py-2 font-bold text-slate-700">Sum Insured</th>
                  <th className="text-left px-2 py-2 font-bold text-slate-700">Premium Style</th>
                  <th className="text-left px-2 py-2 font-bold text-slate-700">Ownership</th>
                  <th className="text-left px-2 py-2 font-bold text-slate-700">Super</th>
                  <th className="text-left px-2 py-2 font-bold text-slate-700">Definition</th>
                  <th className="text-left px-2 py-2 font-bold text-slate-700">Stand Alone</th>
                  <th className="text-left px-2 py-2 font-bold text-slate-700">Flexi-Linked</th>
                  <th className="text-left px-2 py-2 font-bold text-slate-700">Super-Linked</th>
                  <th className="text-left px-2 py-2 font-bold text-slate-700">Waiting Period</th>
                  <th className="text-left px-2 py-2 font-bold text-slate-700">Benefit Period</th>
                  <th className="text-left px-2 py-2 font-bold text-slate-700">Add. Death Cover</th>
                </tr>
              </thead>
              <tbody>
                {COVER_TYPE_ORDER.map((type) => {
                  const c = covers[type];
                  const vis = COL_VISIBILITY[type];
                  const allOwnershipOpts = OWNERSHIP_OPTIONS_BY_TYPE[type];
                  const ownershipOpts = type === 'TPD' && !smsfSuperLinkAllowed
                    ? allOwnershipOpts.filter((o) => o.code !== 'K')
                    : allOwnershipOpts;
                  const styleOpts = PREMIUM_STYLE_BY_TYPE[type];
                  const showOwnership = OWNERSHIP_VISIBLE[type];
                  const waitingOpts = type === 'IP' ? IP_WAITING_PERIODS : type === 'BE' ? BE_WAITING_PERIODS : [];
                  const benefitOpts = type === 'IP' ? IP_BENEFIT_PERIODS : [];
                  return (
                    <tr key={type} className="border-b border-gray-100 even:bg-gray-50/50">
                      <td className="px-2 py-1.5 text-slate-700 font-medium">{COVER_TYPE_LABELS[type]}</td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          className="w-24 border border-gray-300 rounded px-1.5 py-1 text-xs text-right bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={c.sumInsured}
                          onChange={(e) => updateCover(type, { sumInsured: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        {styleOpts ? (
                          <select
                            className="w-36 border border-gray-300 rounded px-1.5 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={c.premiumStyle}
                            onChange={(e) => updateCover(type, { premiumStyle: e.target.value })}
                          >
                            {styleOpts.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
                          </select>
                        ) : null}
                      </td>
                      <td className="px-2 py-1.5">
                        {showOwnership ? (
                          <select
                            className="w-32 border border-gray-300 rounded px-1.5 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={c.ownership ?? 'O'}
                            onChange={(e) => updateCover(type, { ownership: e.target.value })}
                          >
                            {ownershipOpts.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
                          </select>
                        ) : null}
                      </td>
                      <td className="px-2 py-1.5">
                        {vis.super ? (
                          <span className="text-slate-600">{superFromOwnership(c.ownership)}</span>
                        ) : null}
                      </td>
                      <td className="px-2 py-1.5">
                        {vis.definition ? (
                          <select
                            className="w-32 border border-gray-300 rounded px-1.5 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={c.definition ?? ''}
                            onChange={(e) => updateCover(type, { definition: e.target.value })}
                          >
                            {(type === 'TPD' ? TPD_DEFINITIONS : IP_DEFINITIONS).map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : null}
                      </td>
                      <td className="px-2 py-1.5">
                        {vis.standAlone ? (
                          <select
                            className="w-16 border border-gray-300 rounded px-1.5 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={c.standAlone ?? 'No'}
                            onChange={(e) => updateCover(type, { standAlone: e.target.value })}
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        ) : null}
                      </td>
                      <td className="px-2 py-1.5">
                        {vis.flexiLinked ? (
                          <select
                            className="w-16 border border-gray-300 rounded px-1.5 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={c.flexiLinked ?? 'No'}
                            onChange={(e) => updateCover(type, { flexiLinked: e.target.value })}
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        ) : null}
                      </td>
                      <td className="px-2 py-1.5">
                        {vis.superLinked ? (
                          <select
                            className="w-16 border border-gray-300 rounded px-1.5 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={c.superLinked ?? 'No'}
                            onChange={(e) => updateCover(type, { superLinked: e.target.value })}
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        ) : null}
                      </td>
                      <td className="px-2 py-1.5">
                        {vis.waitingPeriod ? (
                          <select
                            className="w-24 border border-gray-300 rounded px-1.5 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={c.waitingPeriod ?? ''}
                            onChange={(e) => updateCover(type, { waitingPeriod: e.target.value })}
                          >
                            {waitingOpts.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
                          </select>
                        ) : null}
                      </td>
                      <td className="px-2 py-1.5">
                        {vis.benefitPeriod ? (
                          <select
                            className="w-24 border border-gray-300 rounded px-1.5 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={c.benefitPeriod ?? ''}
                            onChange={(e) => updateCover(type, { benefitPeriod: e.target.value })}
                          >
                            {benefitOpts.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
                          </select>
                        ) : null}
                      </td>
                      <td className="px-2 py-1.5">
                        {vis.addDeathCover ? (
                          <input
                            type="text"
                            className="w-24 border border-gray-300 rounded px-1.5 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={c.addDeathCover ?? ''}
                            onChange={(e) => updateCover(type, { addDeathCover: e.target.value })}
                          />
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

      <div className="h-8" />
    </div>
  );
}
