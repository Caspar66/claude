import { useState, useEffect } from 'react';
import { ChevronLeft, Check, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  CoverQuote,
  LifeCoverOptions,
  TpdOptions,
  TraumaOptions,
  TpdStandaloneOptions,
  TraumaStandaloneOptions,
  TpdExtensionTraumaOptions,
  IncomeProtectionOptions,
  BusinessExpensesOptions,
  NeedleStickOptions,
  ChildTraumaOptions,
  ChildTraumaChild,
} from './insuranceData';

interface Props {
  quote: CoverQuote;
  clientName: string;
  partnerName: string | null;
  onSave: (quote: CoverQuote) => void;
  onCancel: () => void;
}

function Sel({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <label className="text-xs text-slate-600 shrink-0">{label}</label>
      <select
        className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 w-[200px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Inp({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <label className="text-xs text-slate-600 shrink-0">{label}</label>
      <input
        className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 w-[200px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function SectionCheck({ label, code, checked, onChange }: { label: string; code: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className="flex items-center gap-2 py-2 w-full text-left"
      onClick={() => onChange(!checked)}
    >
      <div className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${checked ? 'bg-teal-700 border-teal-700 text-white' : 'border-slate-300 bg-white'}`}>
        {checked && <Check size={10} strokeWidth={3} />}
      </div>
      <span className="text-xs font-bold text-slate-800">
        {label}
      </span>
    </button>
  );
}

function Section({ code, label, checked, onToggle, children }: {
  code: string;
  label: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded overflow-hidden">
      <div className="px-4 py-1 bg-gray-50 border-b border-gray-200">
        <SectionCheck label={label} code={code} checked={checked} onChange={onToggle} />
      </div>
      {checked && children && (
        <div className="px-6 py-3 space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

const EXTENDED_STRUCTURE = ['Stepped', 'Blended', 'Level to Age 65', 'Level to Age 70'] as const;
const THREE_WAY = ['Exclude if possible', 'Include', 'Exclude'] as const;
const PREMIUM_WAIVER = ['Include if possible', 'Include', 'Exclude'] as const;
const BABY_CARE = ['Exclude if possible', 'Include if possible', 'Include', 'Exclude'] as const;
const TRAUMA_PRIORITY = ['Cheapest', 'Best', 'Intermediate'] as const;
const TPS_OWNER = ['Non-Super', 'SMSF', 'Super', 'SuperLink'] as const;
const ALL_OWNER = ['Non-Super', 'SMSF', 'Super', 'SuperLink', 'SMSF SuperLink'] as const;
const ROLLOVER = ['Include if possible', 'Exclude'] as const;
const OCCUPATION_TYPE = ['Any', 'Own', 'Homemaker', 'ADL', 'Best available'] as const;
const LIFE_BUY_BACK = ['Exclude if possible', 'Best available', 'Exclude', '1 year', '3 years'] as const;
const IP_STRUCTURE = ['Stepped', 'Blended', 'Level'] as const;
const IP_WAITING = ['14 days', '30 days', '60 days', '90 days', '180 days', '1 year', '2 years'] as const;
const IP_BENEFIT = ['1 year', '2 years', '5 years', 'To age 55', 'To age 60', 'To age 65', 'To age 67', 'To age 70'] as const;
const IP_AGREED = ['Indemnity if possible', 'Indemnity'] as const;
const IP_FOUR_WAY = ['Exclude if possible', 'Include if possible', 'Include', 'Exclude'] as const;
const IP_RATIO = ['Any', 'Greater than 75%', '70% to 75%', '60% to 69%', 'Less than 60%'] as const;
const BE_WAITING = ['14 days', '30 days', '60 days', '90 days'] as const;
const NES_STRUCTURE = ['Stepped', 'Level'] as const;

export function QuoteOptionsPage({ quote, clientName, partnerName, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<CoverQuote>(quote);

  useEffect(() => {
    setDraft(quote);
  }, [quote]);

  function updateLife(patch: Partial<LifeCoverOptions>) {
    setDraft((d) => ({ ...d, lifeCover: { ...d.lifeCover, ...patch } }));
  }
  function updateTpd(patch: Partial<TpdOptions>) {
    setDraft((d) => ({ ...d, tpd: { ...d.tpd, ...patch } }));
  }
  function updateTrauma(patch: Partial<TraumaOptions>) {
    setDraft((d) => ({ ...d, trauma: { ...d.trauma, ...patch } }));
  }
  function updateTpdStandalone(patch: Partial<TpdStandaloneOptions>) {
    setDraft((d) => ({ ...d, tpdStandalone: { ...d.tpdStandalone, ...patch } }));
  }
  function updateTraumaStandalone(patch: Partial<TraumaStandaloneOptions>) {
    setDraft((d) => ({ ...d, traumaStandalone: { ...d.traumaStandalone, ...patch } }));
  }
  function updateTpr(patch: Partial<TpdExtensionTraumaOptions>) {
    setDraft((d) => ({ ...d, tpdExtensionTrauma: { ...d.tpdExtensionTrauma, ...patch } }));
  }
  function updateIp(patch: Partial<IncomeProtectionOptions>) {
    setDraft((d) => ({ ...d, incomeProtection: { ...d.incomeProtection, ...patch } }));
  }
  function updateBe(patch: Partial<BusinessExpensesOptions>) {
    setDraft((d) => ({ ...d, businessExpenses: { ...d.businessExpenses, ...patch } }));
  }
  function updateNes(patch: Partial<NeedleStickOptions>) {
    setDraft((d) => ({ ...d, needleStick: { ...d.needleStick, ...patch } }));
  }
  function updateCht(patch: Partial<ChildTraumaOptions>) {
    setDraft((d) => ({ ...d, childTrauma: { ...d.childTrauma, ...patch } }));
  }

  function addChild() {
    const child: ChildTraumaChild = {
      id: crypto.randomUUID(),
      dateOfBirth: '',
      age: '',
      gender: 'Male',
      sumInsured: '',
    };
    setDraft((d) => ({
      ...d,
      childTrauma: { ...d.childTrauma, children: [...d.childTrauma.children, child] },
    }));
  }

  function updateChild(childId: string, patch: Partial<ChildTraumaChild>) {
    setDraft((d) => ({
      ...d,
      childTrauma: {
        ...d.childTrauma,
        children: d.childTrauma.children.map((c) => c.id === childId ? { ...c, ...patch } : c),
      },
    }));
  }

  function removeChild(childId: string) {
    setDraft((d) => ({
      ...d,
      childTrauma: {
        ...d.childTrauma,
        children: d.childTrauma.children.filter((c) => c.id !== childId),
      },
    }));
  }

  const showLifeExtensions = draft.lifeCover.enabled;
  const showTraumaExtensions = draft.traumaStandalone.enabled;

  return (
    <div className="flex-1 overflow-auto flex flex-col">
      <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-700 text-white">
        <button onClick={onCancel} className="hover:text-white/80">
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-sm font-bold">Quote Options</h2>
        <span className="text-xs text-white/70">— {draft.name || 'Untitled'}</span>
      </div>

      <div className="px-8 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">Quote Name</label>
            <input
              type="text"
              className="border border-slate-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-60"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">Life Insured</label>
            <select
              className="border border-slate-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              value={draft.lifeInsured}
              onChange={(e) => setDraft((d) => ({ ...d, lifeInsured: e.target.value as 'client' | 'partner' }))}
            >
              <option value="client">{clientName}</option>
              {partnerName && <option value="partner">{partnerName}</option>}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 px-8 py-5 space-y-1">
        {/* TRM – Life */}
        <Section code="TRM" label="Life" checked={draft.lifeCover.enabled} onToggle={(v) => updateLife({ enabled: v })}>
          <Inp label="Sum Insured" value={draft.lifeCover.sumInsured} onChange={(v) => updateLife({ sumInsured: v })} />
          <Sel label="Premium Structure" value={draft.lifeCover.structure} options={['Stepped', 'Level']} onChange={(v) => updateLife({ structure: v as 'Stepped' | 'Level' })} />
          <Sel label="Premium Waiver" value={draft.lifeCover.premiumWaiver} options={['Exclude', 'Include if possible']} onChange={(v) => updateLife({ premiumWaiver: v as 'Exclude' | 'Include if possible' })} />
          <Sel label="Ownership" value={draft.lifeCover.ownership} options={['Non-Super', 'Super Fund']} onChange={(v) => updateLife({ ownership: v as 'Non-Super' | 'Super Fund' })} />
          <Sel label="Pay by Rollover" value={draft.lifeCover.payByRollover} options={['Exclude', 'Include']} onChange={(v) => updateLife({ payByRollover: v as 'Exclude' | 'Include' })} />
        </Section>

        {/* TPE – TPD Extension to Life (only if TRM enabled) */}
        {showLifeExtensions && (
          <Section code="TPE" label="TPD Extension to Life" checked={draft.tpd.enabled} onToggle={(v) => updateTpd({ enabled: v })}>
            <Inp label="Sum Insured" value={draft.tpd.sumInsured} onChange={(v) => updateTpd({ sumInsured: v })} />
            <Sel label="Premium Structure" value={draft.tpd.structure} options={['Stepped', 'Level']} onChange={(v) => updateTpd({ structure: v as 'Stepped' | 'Level' })} />
            <Sel label="Premium Waiver" value={draft.tpd.premiumWaiver} options={['Exclude', 'Include if possible']} onChange={(v) => updateTpd({ premiumWaiver: v as 'Exclude' | 'Include if possible' })} />
            <Sel label="Ownership" value={draft.tpd.ownership} options={['Non-Super', 'Super Fund']} onChange={(v) => updateTpd({ ownership: v as 'Non-Super' | 'Super Fund' })} />
            <Sel label="Life Buy Back" value={draft.tpd.lifeBuyBack} options={['Exclude if possible', 'Include if possible']} onChange={(v) => updateTpd({ lifeBuyBack: v as 'Exclude if possible' | 'Include if possible' })} />
            <Sel label="Double TPD" value={draft.tpd.doubleTpd} options={['Exclude if possible', 'Include if possible']} onChange={(v) => updateTpd({ doubleTpd: v as 'Exclude if possible' | 'Include if possible' })} />
            <Sel label="Occupation Type" value={draft.tpd.occupationType} options={['Best Available', 'Own Occupation', 'Any Occupation']} onChange={(v) => updateTpd({ occupationType: v as 'Best Available' | 'Own Occupation' | 'Any Occupation' })} />
            <Sel label="Pay by Rollover" value={draft.tpd.payByRollover} options={['Exclude', 'Include']} onChange={(v) => updateTpd({ payByRollover: v as 'Exclude' | 'Include' })} />
          </Section>
        )}

        {/* TRE – Trauma Extension to Life (only if TRM enabled) */}
        {showLifeExtensions && (
          <Section code="TRE" label="Trauma Extension to Life" checked={draft.trauma.enabled} onToggle={(v) => updateTrauma({ enabled: v })}>
            <Inp label="Sum Insured" value={draft.trauma.sumInsured} onChange={(v) => updateTrauma({ sumInsured: v })} />
            <Sel label="Premium Structure" value={draft.trauma.structure} options={EXTENDED_STRUCTURE} onChange={(v) => updateTrauma({ structure: v as TraumaOptions['structure'] })} />
            <Sel label="Life Buy Back" value={draft.trauma.lifeBuyBack} options={LIFE_BUY_BACK} onChange={(v) => updateTrauma({ lifeBuyBack: v as TraumaOptions['lifeBuyBack'] })} />
            <Sel label="Double Trauma" value={draft.trauma.doubleTrauma} options={THREE_WAY} onChange={(v) => updateTrauma({ doubleTrauma: v as TraumaOptions['doubleTrauma'] })} />
            <Sel label="Trauma Reinstatement" value={draft.trauma.traumaReinstatement} options={THREE_WAY} onChange={(v) => updateTrauma({ traumaReinstatement: v as TraumaOptions['traumaReinstatement'] })} />
            <Sel label="Premium Waiver" value={draft.trauma.premiumWaiver} options={PREMIUM_WAIVER} onChange={(v) => updateTrauma({ premiumWaiver: v as TraumaOptions['premiumWaiver'] })} />
            <Sel label="Baby Care" value={draft.trauma.babyCare} options={BABY_CARE} onChange={(v) => updateTrauma({ babyCare: v as TraumaOptions['babyCare'] })} />
            <Sel label="Priority" value={draft.trauma.priority} options={TRAUMA_PRIORITY} onChange={(v) => updateTrauma({ priority: v as TraumaOptions['priority'] })} />
          </Section>
        )}

        {/* TPS – Total and Permanent Disability (Standalone) */}
        <Section code="TPS" label="Total and Permanent Disability" checked={draft.tpdStandalone.enabled} onToggle={(v) => updateTpdStandalone({ enabled: v })}>
          <Inp label="Sum Insured" value={draft.tpdStandalone.sumInsured} onChange={(v) => updateTpdStandalone({ sumInsured: v })} />
          <Sel label="Owner" value={draft.tpdStandalone.owner} options={TPS_OWNER} onChange={(v) => updateTpdStandalone({ owner: v as TpdStandaloneOptions['owner'] })} />
          <Sel label="Rollover" value={draft.tpdStandalone.rollover} options={ROLLOVER} onChange={(v) => updateTpdStandalone({ rollover: v as TpdStandaloneOptions['rollover'] })} />
          <Sel label="Premium Structure" value={draft.tpdStandalone.structure} options={EXTENDED_STRUCTURE} onChange={(v) => updateTpdStandalone({ structure: v as TpdStandaloneOptions['structure'] })} />
          <Sel label="Occupation Type" value={draft.tpdStandalone.occupationType} options={OCCUPATION_TYPE} onChange={(v) => updateTpdStandalone({ occupationType: v as TpdStandaloneOptions['occupationType'] })} />
          <Sel label="Premium Waiver" value={draft.tpdStandalone.premiumWaiver} options={PREMIUM_WAIVER} onChange={(v) => updateTpdStandalone({ premiumWaiver: v as TpdStandaloneOptions['premiumWaiver'] })} />
        </Section>

        {/* TRS – Trauma (Standalone) */}
        <Section code="TRS" label="Trauma" checked={draft.traumaStandalone.enabled} onToggle={(v) => updateTraumaStandalone({ enabled: v })}>
          <Inp label="Sum Insured" value={draft.traumaStandalone.sumInsured} onChange={(v) => updateTraumaStandalone({ sumInsured: v })} />
          <Sel label="Premium Structure" value={draft.traumaStandalone.structure} options={EXTENDED_STRUCTURE} onChange={(v) => updateTraumaStandalone({ structure: v as TraumaStandaloneOptions['structure'] })} />
          <Sel label="Trauma Reinstatement" value={draft.traumaStandalone.traumaReinstatement} options={THREE_WAY} onChange={(v) => updateTraumaStandalone({ traumaReinstatement: v as TraumaStandaloneOptions['traumaReinstatement'] })} />
          <Sel label="Premium Waiver" value={draft.traumaStandalone.premiumWaiver} options={PREMIUM_WAIVER} onChange={(v) => updateTraumaStandalone({ premiumWaiver: v as TraumaStandaloneOptions['premiumWaiver'] })} />
          <Sel label="Baby Care" value={draft.traumaStandalone.babyCare} options={BABY_CARE} onChange={(v) => updateTraumaStandalone({ babyCare: v as TraumaStandaloneOptions['babyCare'] })} />
          <Sel label="Priority" value={draft.traumaStandalone.priority} options={TRAUMA_PRIORITY} onChange={(v) => updateTraumaStandalone({ priority: v as TraumaStandaloneOptions['priority'] })} />
        </Section>

        {/* TPR – TPD Extension to Trauma (only if TRS enabled) */}
        {showTraumaExtensions && (
          <Section code="TPR" label="TPD Extension to Trauma" checked={draft.tpdExtensionTrauma.enabled} onToggle={(v) => updateTpr({ enabled: v })}>
            <Inp label="Sum Insured" value={draft.tpdExtensionTrauma.sumInsured} onChange={(v) => updateTpr({ sumInsured: v })} />
            <Sel label="Owner" value={draft.tpdExtensionTrauma.owner} options={ALL_OWNER} onChange={(v) => updateTpr({ owner: v as TpdExtensionTraumaOptions['owner'] })} />
            <Sel label="Rollover" value={draft.tpdExtensionTrauma.rollover} options={ROLLOVER} onChange={(v) => updateTpr({ rollover: v as TpdExtensionTraumaOptions['rollover'] })} />
            <Sel label="Premium Structure" value={draft.tpdExtensionTrauma.structure} options={EXTENDED_STRUCTURE} onChange={(v) => updateTpr({ structure: v as TpdExtensionTraumaOptions['structure'] })} />
            <Sel label="Occupation Type" value={draft.tpdExtensionTrauma.occupationType} options={OCCUPATION_TYPE} onChange={(v) => updateTpr({ occupationType: v as TpdExtensionTraumaOptions['occupationType'] })} />
            <Sel label="Premium Waiver" value={draft.tpdExtensionTrauma.premiumWaiver} options={PREMIUM_WAIVER} onChange={(v) => updateTpr({ premiumWaiver: v as TpdExtensionTraumaOptions['premiumWaiver'] })} />
          </Section>
        )}

        {/* INC – Income Protection */}
        <Section code="INC" label="Income Protection" checked={draft.incomeProtection.enabled} onToggle={(v) => updateIp({ enabled: v })}>
          <Inp label="Monthly Benefit" value={draft.incomeProtection.monthlyBenefit} onChange={(v) => updateIp({ monthlyBenefit: v })} />
          <Inp label="Super Contribution Option" value={draft.incomeProtection.superContributionOption} onChange={(v) => updateIp({ superContributionOption: v })} placeholder="Monthly amount" />
          <Sel label="Owner" value={draft.incomeProtection.owner} options={ALL_OWNER} onChange={(v) => updateIp({ owner: v as IncomeProtectionOptions['owner'] })} />
          <Sel label="Rollover" value={draft.incomeProtection.rollover} options={ROLLOVER} onChange={(v) => updateIp({ rollover: v as IncomeProtectionOptions['rollover'] })} />
          <Sel label="Premium Structure" value={draft.incomeProtection.structure} options={IP_STRUCTURE} onChange={(v) => updateIp({ structure: v as IncomeProtectionOptions['structure'] })} />
          <Sel label="Agreed Value" value={draft.incomeProtection.agreedValue} options={IP_AGREED} onChange={(v) => updateIp({ agreedValue: v as IncomeProtectionOptions['agreedValue'] })} />
          <Sel label="Accident Benefit" value={draft.incomeProtection.accidentBenefit} options={IP_FOUR_WAY} onChange={(v) => updateIp({ accidentBenefit: v as IncomeProtectionOptions['accidentBenefit'] })} />
          <Sel label="Increase Claim Benefit" value={draft.incomeProtection.increaseClaimBenefit} options={IP_FOUR_WAY} onChange={(v) => updateIp({ increaseClaimBenefit: v as IncomeProtectionOptions['increaseClaimBenefit'] })} />
          <Sel label="Waiting Period" value={draft.incomeProtection.waitingPeriod} options={IP_WAITING} onChange={(v) => updateIp({ waitingPeriod: v as IncomeProtectionOptions['waitingPeriod'] })} />
          <Sel label="Benefit Period" value={draft.incomeProtection.benefitPeriod} options={IP_BENEFIT} onChange={(v) => updateIp({ benefitPeriod: v as IncomeProtectionOptions['benefitPeriod'] })} />
          <Sel label="Initial Replacement Ratio" value={draft.incomeProtection.initialReplacementRatio} options={IP_RATIO} onChange={(v) => updateIp({ initialReplacementRatio: v as IncomeProtectionOptions['initialReplacementRatio'] })} />
          <Sel label="Priority" value={draft.incomeProtection.priority} options={TRAUMA_PRIORITY} onChange={(v) => updateIp({ priority: v as IncomeProtectionOptions['priority'] })} />
        </Section>

        {/* BUS – Business Expenses */}
        <Section code="BUS" label="Business Expenses" checked={draft.businessExpenses.enabled} onToggle={(v) => updateBe({ enabled: v })}>
          <Inp label="Monthly Benefit" value={draft.businessExpenses.monthlyBenefit} onChange={(v) => updateBe({ monthlyBenefit: v })} />
          <Sel label="Premium Structure" value={draft.businessExpenses.structure} options={IP_STRUCTURE} onChange={(v) => updateBe({ structure: v as BusinessExpensesOptions['structure'] })} />
          <Sel label="Waiting Period" value={draft.businessExpenses.waitingPeriod} options={BE_WAITING} onChange={(v) => updateBe({ waitingPeriod: v as BusinessExpensesOptions['waitingPeriod'] })} />
          <Sel label="Benefit Period" value={draft.businessExpenses.benefitPeriod} options={['1 year']} onChange={(v) => updateBe({ benefitPeriod: v as BusinessExpensesOptions['benefitPeriod'] })} />
        </Section>

        {/* NES – Needle Stick */}
        <Section code="NES" label="Needle Stick" checked={draft.needleStick.enabled} onToggle={(v) => updateNes({ enabled: v })}>
          <Inp label="Sum Insured" value={draft.needleStick.sumInsured} onChange={(v) => updateNes({ sumInsured: v })} />
          <Sel label="Premium Structure" value={draft.needleStick.structure} options={NES_STRUCTURE} onChange={(v) => updateNes({ structure: v as NeedleStickOptions['structure'] })} />
        </Section>

        {/* CHT – Child Trauma */}
        <Section code="CHT" label="Child Trauma" checked={draft.childTrauma.enabled} onToggle={(v) => updateCht({ enabled: v })}>
          {draft.childTrauma.children.length === 0 && (
            <div className="text-xs text-slate-400 py-1">No children added. Max 9.</div>
          )}
          {draft.childTrauma.children.map((child, idx) => (
            <div key={child.id} className="border border-gray-200 rounded p-3 mb-2 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">Child {idx + 1}</span>
                <button className="text-slate-400 hover:text-red-500" onClick={() => removeChild(child.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="space-y-0.5">
                <Inp label="Date of Birth" value={child.dateOfBirth} onChange={(v) => updateChild(child.id, { dateOfBirth: v })} placeholder="YYYY-MM-DD" />
                <Inp label="Age" value={child.age} onChange={(v) => updateChild(child.id, { age: v })} placeholder="Optional if DOB set" />
                <Sel label="Gender" value={child.gender} options={['Male', 'Female']} onChange={(v) => updateChild(child.id, { gender: v as 'Male' | 'Female' })} />
                <Inp label="Sum Insured" value={child.sumInsured} onChange={(v) => updateChild(child.id, { sumInsured: v })} />
              </div>
            </div>
          ))}
          {draft.childTrauma.children.length < 9 && (
            <button
              className="flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 font-medium py-1"
              onClick={addChild}
            >
              <Plus size={12} /> Add Child
            </button>
          )}
        </Section>
      </div>

      <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-gray-200 bg-gray-50">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="bg-teal-700 hover:bg-teal-800 text-white px-6"
          onClick={() => onSave(draft)}
        >
          Save Quote Options
        </Button>
      </div>
    </div>
  );
}
