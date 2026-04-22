import { Check } from 'lucide-react';
import type {
  QuoteOptions,
  LifeCoverOptions,
  TpdOptions,
  IncomeProtectionOptions,
  TraumaOptions,
  BusinessExpensesOptions,
} from './insuranceData';

interface Props {
  quoteOptions: QuoteOptions;
  lifeCover: LifeCoverOptions;
  tpd: TpdOptions;
  trauma: TraumaOptions;
  incomeProtection: IncomeProtectionOptions;
  businessExpenses: BusinessExpensesOptions;
  onQuoteOptionsChange: (v: QuoteOptions) => void;
  onLifeCoverChange: (v: LifeCoverOptions) => void;
  onTpdChange: (v: TpdOptions) => void;
  onTraumaChange: (v: TraumaOptions) => void;
  onIncomeProtectionChange: (v: IncomeProtectionOptions) => void;
  onBusinessExpensesChange: (v: BusinessExpensesOptions) => void;
}

function Sel({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <label className="text-xs text-slate-600 shrink-0">{label}</label>
      <select
        className="border border-gray-300 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 w-[140px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Inp({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <label className="text-xs text-slate-600 shrink-0">{label}</label>
      <input
        className="border border-gray-300 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 w-[140px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SectionCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className="flex items-center gap-2 py-1.5 w-full text-left"
      onClick={() => onChange(!checked)}
    >
      <div className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${checked ? 'bg-teal-600 border-teal-600 text-white' : 'border-gray-400 bg-white'}`}>
        {checked && <Check size={10} strokeWidth={3} />}
      </div>
      <span className="text-sm font-semibold text-slate-800">{label}</span>
    </button>
  );
}

export function QuoteOptionsSidebar({
  quoteOptions, lifeCover, tpd, trauma, incomeProtection, businessExpenses,
  onQuoteOptionsChange, onLifeCoverChange, onTpdChange, onTraumaChange,
  onIncomeProtectionChange, onBusinessExpensesChange,
}: Props) {
  return (
    <div className="w-[280px] shrink-0 border-r border-gray-200 bg-white overflow-y-auto text-sm">
      {/* Quote Options header */}
      <div className="px-3 py-2.5 border-b border-gray-200">
        <h3 className="text-sm font-bold text-slate-800">Quote Options</h3>
      </div>

      <div className="px-3 py-2 space-y-1">
        <Sel label="State" value={quoteOptions.state} options={['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']} onChange={(v) => onQuoteOptionsChange({ ...quoteOptions, state: v })} />
        <Sel label="Options Mode" value={quoteOptions.optionsMode} options={['Flexible', 'Fixed']} onChange={(v) => onQuoteOptionsChange({ ...quoteOptions, optionsMode: v as 'Flexible' | 'Fixed' })} />
        <Sel label="Multi-Select" value={quoteOptions.multiSelect} options={['No', 'Yes']} onChange={(v) => onQuoteOptionsChange({ ...quoteOptions, multiSelect: v as 'No' | 'Yes' })} />
        <Sel label="AutoRefresh Quote" value={quoteOptions.autoRefreshQuote} options={['Yes', 'No']} onChange={(v) => onQuoteOptionsChange({ ...quoteOptions, autoRefreshQuote: v as 'Yes' | 'No' })} />
      </div>

      {/* Life */}
      <div className="border-t border-gray-200 px-3 py-1">
        <SectionCheck label="Life" checked={lifeCover.enabled} onChange={(v) => onLifeCoverChange({ ...lifeCover, enabled: v })} />
        {lifeCover.enabled && (
          <div className="pl-6 pb-2 space-y-0.5">
            <Inp label="Sum Insured" value={lifeCover.sumInsured} onChange={(v) => onLifeCoverChange({ ...lifeCover, sumInsured: v })} />
            <Sel label="Structure" value={lifeCover.structure} options={['Stepped', 'Level']} onChange={(v) => onLifeCoverChange({ ...lifeCover, structure: v as 'Stepped' | 'Level' })} />
            <Sel label="Premium Waiver" value={lifeCover.premiumWaiver} options={['Exclude', 'Include if possible']} onChange={(v) => onLifeCoverChange({ ...lifeCover, premiumWaiver: v as 'Exclude' | 'Include if possible' })} />
            <Sel label="Ownership" value={lifeCover.ownership} options={['Non-Super', 'Super Fund']} onChange={(v) => onLifeCoverChange({ ...lifeCover, ownership: v as 'Non-Super' | 'Super Fund' })} />
            <Sel label="Pay by Rollover" value={lifeCover.payByRollover} options={['Exclude', 'Include']} onChange={(v) => onLifeCoverChange({ ...lifeCover, payByRollover: v as 'Exclude' | 'Include' })} />
          </div>
        )}
      </div>

      {/* TPD Extension */}
      <div className="border-t border-gray-200 px-3 py-1">
        <SectionCheck label="TPD Extension" checked={tpd.enabled} onChange={(v) => onTpdChange({ ...tpd, enabled: v })} />
        {tpd.enabled && (
          <div className="pl-6 pb-2 space-y-0.5">
            <Inp label="Sum Insured" value={tpd.sumInsured} onChange={(v) => onTpdChange({ ...tpd, sumInsured: v })} />
            <Sel label="Structure" value={tpd.structure} options={['Stepped', 'Level']} onChange={(v) => onTpdChange({ ...tpd, structure: v as 'Stepped' | 'Level' })} />
            <Sel label="Premium Waiver" value={tpd.premiumWaiver} options={['Exclude', 'Include if possible']} onChange={(v) => onTpdChange({ ...tpd, premiumWaiver: v as 'Exclude' | 'Include if possible' })} />
            <Sel label="Ownership" value={tpd.ownership} options={['Non-Super', 'Super Fund']} onChange={(v) => onTpdChange({ ...tpd, ownership: v as 'Non-Super' | 'Super Fund' })} />
            <Sel label="Life Buy Back" value={tpd.lifeBuyBack} options={['Exclude if possible', 'Include if possible']} onChange={(v) => onTpdChange({ ...tpd, lifeBuyBack: v as 'Exclude if possible' | 'Include if possible' })} />
            <Sel label="Double TPD" value={tpd.doubleTpd} options={['Exclude if possible', 'Include if possible']} onChange={(v) => onTpdChange({ ...tpd, doubleTpd: v as 'Exclude if possible' | 'Include if possible' })} />
            <Sel label="Occupation type" value={tpd.occupationType} options={['Best Available', 'Own Occupation', 'Any Occupation']} onChange={(v) => onTpdChange({ ...tpd, occupationType: v as 'Best Available' | 'Own Occupation' | 'Any Occupation' })} />
            <Sel label="Pay by Rollover" value={tpd.payByRollover} options={['Exclude', 'Include']} onChange={(v) => onTpdChange({ ...tpd, payByRollover: v as 'Exclude' | 'Include' })} />
          </div>
        )}
      </div>

      {/* Trauma Extension */}
      <div className="border-t border-gray-200 px-3 py-1">
        <SectionCheck label="Trauma Extension" checked={trauma.enabled} onChange={(v) => onTraumaChange({ ...trauma, enabled: v })} />
      </div>

      {/* Total And Permanent Disability (standalone, disabled label) */}
      <div className="border-t border-gray-200 px-3 py-1">
        <SectionCheck label="Total And Permanent Disability" checked={false} onChange={() => {}} />
      </div>

      {/* Trauma (standalone) */}
      <div className="border-t border-gray-200 px-3 py-1">
        <SectionCheck label="Trauma" checked={false} onChange={() => {}} />
      </div>

      {/* Income Protection */}
      <div className="border-t border-gray-200 px-3 py-1">
        <SectionCheck label="Income Protection" checked={incomeProtection.enabled} onChange={(v) => onIncomeProtectionChange({ ...incomeProtection, enabled: v })} />
        {incomeProtection.enabled && (
          <div className="pl-6 pb-2 space-y-0.5">
            <Inp label="Monthly Benefit" value={incomeProtection.monthlyBenefit} onChange={(v) => onIncomeProtectionChange({ ...incomeProtection, monthlyBenefit: v })} />
            <Sel label="Structure" value={incomeProtection.structure} options={['Stepped', 'Blended', 'Level']} onChange={(v) => onIncomeProtectionChange({ ...incomeProtection, structure: v as 'Stepped' | 'Blended' | 'Level' })} />
            <Sel label="Owner" value={incomeProtection.owner} options={['Non-Super', 'SMSF', 'Super', 'SuperLink', 'SMSF SuperLink']} onChange={(v) => onIncomeProtectionChange({ ...incomeProtection, owner: v as IncomeProtectionOptions['owner'] })} />
            <Sel label="Waiting Period" value={incomeProtection.waitingPeriod} options={['14 days', '30 days', '60 days', '90 days', '180 days', '1 year', '2 years']} onChange={(v) => onIncomeProtectionChange({ ...incomeProtection, waitingPeriod: v as IncomeProtectionOptions['waitingPeriod'] })} />
            <Sel label="Benefit Period" value={incomeProtection.benefitPeriod} options={['1 year', '2 years', '5 years', 'To age 55', 'To age 60', 'To age 65', 'To age 67', 'To age 70']} onChange={(v) => onIncomeProtectionChange({ ...incomeProtection, benefitPeriod: v as IncomeProtectionOptions['benefitPeriod'] })} />
            <Sel label="Increase Claim Benefit" value={incomeProtection.increaseClaimBenefit} options={['Exclude if possible', 'Include if possible', 'Include', 'Exclude']} onChange={(v) => onIncomeProtectionChange({ ...incomeProtection, increaseClaimBenefit: v as IncomeProtectionOptions['increaseClaimBenefit'] })} />
            <Sel label="Accident Benefit" value={incomeProtection.accidentBenefit} options={['Exclude if possible', 'Include if possible', 'Include', 'Exclude']} onChange={(v) => onIncomeProtectionChange({ ...incomeProtection, accidentBenefit: v as IncomeProtectionOptions['accidentBenefit'] })} />
            <Sel label="Rollover" value={incomeProtection.rollover} options={['Include if possible', 'Exclude']} onChange={(v) => onIncomeProtectionChange({ ...incomeProtection, rollover: v as IncomeProtectionOptions['rollover'] })} />
            <Sel label="Agreed Value" value={incomeProtection.agreedValue} options={['Indemnity if possible', 'Indemnity']} onChange={(v) => onIncomeProtectionChange({ ...incomeProtection, agreedValue: v as IncomeProtectionOptions['agreedValue'] })} />
          </div>
        )}
      </div>

      {/* Business Expenses */}
      <div className="border-t border-gray-200 px-3 py-1 pb-4">
        <SectionCheck label="Business Expenses" checked={businessExpenses.enabled} onChange={(v) => onBusinessExpensesChange({ ...businessExpenses, enabled: v })} />
      </div>
    </div>
  );
}
