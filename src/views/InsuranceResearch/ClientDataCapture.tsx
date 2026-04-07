import { Edit3, Info, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ClientFormData } from './insuranceData';

interface Props {
  clientData: ClientFormData;
  partnerData: ClientFormData | null;
  onClientChange: (data: ClientFormData) => void;
  onPartnerChange: (data: ClientFormData) => void;
  onLaunchNeedsAnalysis: () => void;
  onGetQuotes: () => void;
}

function InputField({ value, onChange, className = '' }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <input
      type="text"
      className={`border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function SelectField({ value, onChange, options, className = '' }: { value: string; onChange: (v: string) => void; options: string[]; className?: string }) {
  return (
    <select
      className={`border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function PersonColumn({
  data,
  onChange,
  label,
}: {
  data: ClientFormData;
  onChange: (d: ClientFormData) => void;
  label: string;
}) {
  function update(field: keyof ClientFormData, value: string | number) {
    onChange({ ...data, [field]: value });
  }

  return (
    <div className="flex-1 space-y-3">
      {/* Name header */}
      <div className="text-sm font-semibold text-slate-700 mb-2">{label}</div>

      {/* Occupation keyword search */}
      <div className="flex items-center gap-2">
        <InputField value="" onChange={() => {}} className="w-36" />
        <span className="text-xs text-blue-600 cursor-pointer hover:underline">(Keyword Search)</span>
      </div>

      {/* Occupation dropdown */}
      <div className="flex items-center gap-1.5">
        <SelectField
          value={data.occupationCode}
          onChange={(v) => update('occupationCode', v)}
          options={[
            '1P - Accounting Professionals',
            '1P - Actuarial Professionals',
            '2B - Clerical & Administration',
            '3A - Sales Representatives',
            '4A - Trades & Labour',
          ]}
          className="w-64"
        />
        <button className="text-blue-500 hover:text-blue-700" title="Occupation info">
          <Info size={14} />
        </button>
      </div>

      {/* Self Employed */}
      <SelectField
        value={data.selfEmployed}
        onChange={(v) => update('selfEmployed', v)}
        options={['No', 'Yes']}
        className="w-16"
      />

      {/* Date of Birth */}
      <div className="flex items-center gap-1.5">
        <InputField value={data.dateOfBirth} onChange={(v) => update('dateOfBirth', v)} className="w-28" />
        <button className="text-slate-400 hover:text-slate-600">
          <Calendar size={14} />
        </button>
      </div>

      {/* Gender */}
      <SelectField
        value={data.gender}
        onChange={(v) => update('gender', v)}
        options={['Male', 'Female']}
        className="w-20"
      />

      {/* Smoker Status */}
      <SelectField
        value={data.smoker === 'No' ? 'Non-Smoker' : 'Smoker'}
        onChange={(v) => update('smoker', v === 'Non-Smoker' ? 'No' : 'Yes')}
        options={['Non-Smoker', 'Smoker']}
        className="w-32"
      />

      {/* State */}
      <SelectField
        value={data.state}
        onChange={(v) => update('state', v)}
        options={['Queensland', 'New South Wales', 'Victoria', 'Western Australia', 'South Australia', 'Tasmania', 'ACT', 'Northern Territory']}
        className="w-40"
      />

      {/* Annual Income */}
      <InputField
        value={data.annualIncome}
        onChange={(v) => update('annualIncome', v)}
        className="w-28"
      />

      {/* Loadings */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">{data.loadings}</span>
        <button className="text-blue-500 hover:text-blue-700" title="Edit loadings">
          <Edit3 size={12} />
        </button>
      </div>
    </div>
  );
}

export function ClientDataCapture({
  clientData,
  partnerData,
  onClientChange,
  onPartnerChange,
  onLaunchNeedsAnalysis,
  onGetQuotes,
}: Props) {
  const showPartner = partnerData !== null;

  return (
    <div className="flex-1 overflow-auto">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-blue-700 text-white">
        <h2 className="text-sm font-bold">Personal Details</h2>
        <div className="flex items-center gap-2 text-white/80">
          <button className="hover:text-white" title="Settings">
            <Info size={14} />
          </button>
        </div>
      </div>

      {/* Form body */}
      <div className="px-5 py-4">
        {/* Labels column + person columns */}
        <div className="flex gap-6">
          {/* Labels */}
          <div className="w-28 shrink-0 space-y-3 pt-8">
            <div className="text-sm font-semibold text-blue-800 h-[34px] flex items-center">Name</div>
            <div className="text-sm font-semibold text-slate-600 h-[34px] flex items-center">Occupation</div>
            <div className="h-[34px] flex items-center" />
            <div className="text-sm font-semibold text-slate-600 h-[34px] flex items-center">Self Employed</div>
            <div className="text-sm font-semibold text-slate-600 h-[34px] flex items-center">Date of Birth</div>
            <div className="text-sm font-semibold text-slate-600 h-[34px] flex items-center">Gender</div>
            <div className="text-sm font-semibold text-slate-600 h-[34px] flex items-center">Smoker Status</div>
            <div className="text-sm font-semibold text-slate-600 h-[34px] flex items-center">State</div>
            <div className="text-sm font-semibold text-slate-600 h-[34px] flex items-center">Annual Income (ex super)</div>
            <div className="text-sm font-semibold text-blue-800 h-[34px] flex items-center">Loadings</div>
          </div>

          {/* Client column */}
          <PersonColumn
            data={clientData}
            onChange={onClientChange}
            label={`${clientData.firstName}, ${clientData.lastName}`}
          />

          {/* Partner column */}
          {showPartner && partnerData && (
            <PersonColumn
              data={partnerData}
              onChange={onPartnerChange}
              label={`${partnerData.firstName}, ${partnerData.lastName}`}
            />
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-3 py-4 border-t border-gray-200 bg-gray-50">
        <Button
          className="bg-teal-700 hover:bg-teal-800 text-white px-6"
          onClick={onLaunchNeedsAnalysis}
        >
          Launch Needs Analysis
        </Button>
        <Button
          className="bg-teal-700 hover:bg-teal-800 text-white px-6"
          onClick={onGetQuotes}
        >
          Get Quotes
        </Button>
      </div>
    </div>
  );
}
