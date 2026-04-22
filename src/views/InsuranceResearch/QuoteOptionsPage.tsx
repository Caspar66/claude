import { useState, useEffect } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  CoverQuote,
  LifeCoverOptions,
  TpdOptions,
  TraumaOptions,
  IncomeProtectionOptions,
  BusinessExpensesOptions,
} from './insuranceData';
import {
  getDefaultLifeCover,
  getDefaultTpd,
  getDefaultIncomeProtection,
} from './insuranceData';

interface Props {
  quote: CoverQuote;
  clientName: string;
  partnerName: string | null;
  onSave: (quote: CoverQuote) => void;
  onCancel: () => void;
}

function Sel({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <label className="text-xs text-slate-600 shrink-0">{label}</label>
      <select
        className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 w-[180px]"
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
    <div className="flex items-center justify-between gap-3 py-1.5">
      <label className="text-xs text-slate-600 shrink-0">{label}</label>
      <input
        className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 w-[180px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
      <div className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${checked ? 'bg-teal-600 border-teal-600 text-white' : 'border-gray-400 bg-white'}`}>
        {checked && <Check size={10} strokeWidth={3} />}
      </div>
      <span className="text-xs font-bold text-slate-800">
        {code} – {label}
      </span>
    </button>
  );
}

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

  function updateIp(patch: Partial<IncomeProtectionOptions>) {
    setDraft((d) => ({ ...d, incomeProtection: { ...d.incomeProtection, ...patch } }));
  }

  function updateBe(patch: Partial<BusinessExpensesOptions>) {
    setDraft((d) => ({ ...d, businessExpenses: { ...d.businessExpenses, ...patch } }));
  }

  const lifeInsuredLabel = draft.lifeInsured === 'client' ? clientName : (partnerName ?? 'Partner');

  return (
    <div className="flex-1 overflow-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-700 text-white">
        <button onClick={onCancel} className="hover:text-white/80">
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-sm font-bold">Quote Options</h2>
        <span className="text-xs text-white/70">— {draft.name || 'Untitled'}</span>
      </div>

      {/* Quote meta */}
      <div className="px-8 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">Quote Name</label>
            <input
              type="text"
              className="border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-60"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">Life Insured</label>
            <select
              className="border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              value={draft.lifeInsured}
              onChange={(e) => setDraft((d) => ({ ...d, lifeInsured: e.target.value as 'client' | 'partner' }))}
            >
              <option value="client">{clientName}</option>
              {partnerName && <option value="partner">{partnerName}</option>}
            </select>
          </div>
        </div>
      </div>

      {/* Cover sections */}
      <div className="flex-1 px-8 py-5 space-y-1">
        {/* TRM – Life */}
        <div className="border border-gray-200 rounded overflow-hidden">
          <div className="px-4 py-1 bg-gray-50 border-b border-gray-200">
            <SectionCheck
              label="Life"
              code="TRM"
              checked={draft.lifeCover.enabled}
              onChange={(v) => updateLife({ enabled: v })}
            />
          </div>
          {draft.lifeCover.enabled && (
            <div className="px-6 py-3 space-y-0.5">
              <Inp label="Sum Insured" value={draft.lifeCover.sumInsured} onChange={(v) => updateLife({ sumInsured: v })} />
              <Sel label="Premium Structure" value={draft.lifeCover.structure} options={['Stepped', 'Level']} onChange={(v) => updateLife({ structure: v as 'Stepped' | 'Level' })} />
              <Sel label="Premium Waiver" value={draft.lifeCover.premiumWaiver} options={['Exclude', 'Include if possible']} onChange={(v) => updateLife({ premiumWaiver: v as 'Exclude' | 'Include if possible' })} />
              <Sel label="Ownership" value={draft.lifeCover.ownership} options={['Non-Super', 'Super Fund']} onChange={(v) => updateLife({ ownership: v as 'Non-Super' | 'Super Fund' })} />
              <Sel label="Pay by Rollover" value={draft.lifeCover.payByRollover} options={['Exclude', 'Include']} onChange={(v) => updateLife({ payByRollover: v as 'Exclude' | 'Include' })} />
            </div>
          )}
        </div>

        {/* TPE – TPD Extension to Life */}
        <div className="border border-gray-200 rounded overflow-hidden">
          <div className="px-4 py-1 bg-gray-50 border-b border-gray-200">
            <SectionCheck
              label="TPD Extension to Life"
              code="TPE"
              checked={draft.tpd.enabled}
              onChange={(v) => updateTpd({ enabled: v })}
            />
          </div>
          {draft.tpd.enabled && (
            <div className="px-6 py-3 space-y-0.5">
              <Inp label="Sum Insured" value={draft.tpd.sumInsured} onChange={(v) => updateTpd({ sumInsured: v })} />
              <Sel label="Premium Structure" value={draft.tpd.structure} options={['Stepped', 'Level']} onChange={(v) => updateTpd({ structure: v as 'Stepped' | 'Level' })} />
              <Sel label="Premium Waiver" value={draft.tpd.premiumWaiver} options={['Exclude', 'Include if possible']} onChange={(v) => updateTpd({ premiumWaiver: v as 'Exclude' | 'Include if possible' })} />
              <Sel label="Ownership" value={draft.tpd.ownership} options={['Non-Super', 'Super Fund']} onChange={(v) => updateTpd({ ownership: v as 'Non-Super' | 'Super Fund' })} />
              <Sel label="Life Buy Back" value={draft.tpd.lifeBuyBack} options={['Exclude if possible', 'Include if possible']} onChange={(v) => updateTpd({ lifeBuyBack: v as 'Exclude if possible' | 'Include if possible' })} />
              <Sel label="Double TPD" value={draft.tpd.doubleTpd} options={['Exclude if possible', 'Include if possible']} onChange={(v) => updateTpd({ doubleTpd: v as 'Exclude if possible' | 'Include if possible' })} />
              <Sel label="Occupation Type" value={draft.tpd.occupationType} options={['Best Available', 'Own Occupation', 'Any Occupation']} onChange={(v) => updateTpd({ occupationType: v as 'Best Available' | 'Own Occupation' | 'Any Occupation' })} />
              <Sel label="Pay by Rollover" value={draft.tpd.payByRollover} options={['Exclude', 'Include']} onChange={(v) => updateTpd({ payByRollover: v as 'Exclude' | 'Include' })} />
            </div>
          )}
        </div>

        {/* TRE – Trauma Extension to Life */}
        <div className="border border-gray-200 rounded overflow-hidden">
          <div className="px-4 py-1 bg-gray-50 border-b border-gray-200">
            <SectionCheck
              label="Trauma Extension to Life"
              code="TRE"
              checked={draft.trauma.enabled}
              onChange={(v) => updateTrauma({ enabled: v })}
            />
          </div>
        </div>

        {/* TPS – Total And Permanent Disability (Standalone) */}
        <div className="border border-gray-200 rounded overflow-hidden">
          <div className="px-4 py-1 bg-gray-50 border-b border-gray-200">
            <SectionCheck
              label="Total and Permanent Disability"
              code="TPS"
              checked={false}
              onChange={() => {}}
            />
          </div>
        </div>

        {/* TRS – Trauma (Standalone) */}
        <div className="border border-gray-200 rounded overflow-hidden">
          <div className="px-4 py-1 bg-gray-50 border-b border-gray-200">
            <SectionCheck
              label="Trauma"
              code="TRS"
              checked={false}
              onChange={() => {}}
            />
          </div>
        </div>

        {/* INC – Income Protection */}
        <div className="border border-gray-200 rounded overflow-hidden">
          <div className="px-4 py-1 bg-gray-50 border-b border-gray-200">
            <SectionCheck
              label="Income Protection"
              code="INC"
              checked={draft.incomeProtection.enabled}
              onChange={(v) => updateIp({ enabled: v })}
            />
          </div>
          {draft.incomeProtection.enabled && (
            <div className="px-6 py-3 space-y-0.5">
              <Inp label="Monthly Benefit" value={draft.incomeProtection.monthlyBenefit} onChange={(v) => updateIp({ monthlyBenefit: v })} />
              <Sel label="Premium Structure" value={draft.incomeProtection.structure} options={['Stepped', 'Level']} onChange={(v) => updateIp({ structure: v as 'Stepped' | 'Level' })} />
              <Sel label="Ownership" value={draft.incomeProtection.ownership} options={['Non-Super', 'Super Fund']} onChange={(v) => updateIp({ ownership: v as 'Non-Super' | 'Super Fund' })} />
              <Sel label="Waiting Period" value={draft.incomeProtection.waitingPeriod} options={['14 days', '30 days', '60 days', '90 days']} onChange={(v) => updateIp({ waitingPeriod: v as '14 days' | '30 days' | '60 days' | '90 days' })} />
              <Sel label="Benefit Period" value={draft.incomeProtection.benefitPeriod} options={['2 years', '5 years', 'To age 65', 'To age 70']} onChange={(v) => updateIp({ benefitPeriod: v as '2 years' | '5 years' | 'To age 65' | 'To age 70' })} />
              <Sel label="Increase Claim Benefit" value={draft.incomeProtection.increaseClaimBenefit} options={['Exclude if possible', 'Include if possible']} onChange={(v) => updateIp({ increaseClaimBenefit: v as 'Exclude if possible' | 'Include if possible' })} />
              <Sel label="Accident Benefit" value={draft.incomeProtection.accidentBenefit} options={['Exclude if possible', 'Include if possible']} onChange={(v) => updateIp({ accidentBenefit: v as 'Exclude if possible' | 'Include if possible' })} />
              <Sel label="Pay by Rollover" value={draft.incomeProtection.payByRollover} options={['Exclude', 'Include']} onChange={(v) => updateIp({ payByRollover: v as 'Exclude' | 'Include' })} />
              <Sel label="IP Features" value={draft.incomeProtection.ipFeatures} options={['Standard', 'Enhanced']} onChange={(v) => updateIp({ ipFeatures: v as 'Standard' | 'Enhanced' })} />
            </div>
          )}
        </div>

        {/* BUS – Business Expenses */}
        <div className="border border-gray-200 rounded overflow-hidden">
          <div className="px-4 py-1 bg-gray-50 border-b border-gray-200">
            <SectionCheck
              label="Business Expenses"
              code="BUS"
              checked={draft.businessExpenses.enabled}
              onChange={(v) => updateBe({ enabled: v })}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
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
