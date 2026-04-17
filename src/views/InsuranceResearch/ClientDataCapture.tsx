import { Edit3, Info, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOccupations } from '@/hooks/useOccupations';
import type { ClientFormData } from './insuranceData';

interface Props {
  clientData: ClientFormData;
  partnerData: ClientFormData | null;
  onClientChange: (data: ClientFormData) => void;
  onPartnerChange: (data: ClientFormData) => void;
  onLaunchNeedsAnalysis: () => void;
  onGetQuotes: () => void;
}

function Inp({ value, onChange, className = '' }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <input
      type="text"
      className={`border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function Sel({ value, onChange, options, className = '' }: { value: string; onChange: (v: string) => void; options: string[]; className?: string }) {
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

const STATE_OPTIONS = ['Queensland', 'New South Wales', 'Victoria', 'Western Australia', 'South Australia', 'Tasmania', 'ACT', 'Northern Territory'];

function PersonFields({
  data,
  onChange,
  occupationOptions,
  occupationsLoading,
}: {
  data: ClientFormData;
  onChange: (d: ClientFormData) => void;
  occupationOptions: string[];
  occupationsLoading: boolean;
}) {
  function update(field: keyof ClientFormData, value: string | number) {
    onChange({ ...data, [field]: value });
  }

  // Ensure the current value is included in the options so it always renders
  const opts = occupationOptions.includes(data.occupationCode)
    ? occupationOptions
    : [data.occupationCode, ...occupationOptions].filter(Boolean);

  return {
    name: (
      <div className="flex items-center gap-2">
        <Inp value="" onChange={() => {}} className="w-36" />
        <span className="text-xs text-orange-500 cursor-pointer hover:underline">(Keyword Search)</span>
      </div>
    ),
    occupation: (
      <div className="flex items-center gap-1.5">
        <Sel
          value={data.occupationCode}
          onChange={(v) => update('occupationCode', v)}
          options={opts}
          className="w-60"
        />
        {occupationsLoading && <Loader2 size={14} className="text-blue-500 animate-spin" />}
        <button className="text-blue-500 hover:text-blue-700" title="Occupation info"><Info size={14} /></button>
      </div>
    ),
    selfEmployed: (
      <Sel value={data.selfEmployed} onChange={(v) => update('selfEmployed', v)} options={['No', 'Yes']} className="w-16" />
    ),
    dob: (
      <div className="flex items-center gap-1.5">
        <Inp value={data.dateOfBirth} onChange={(v) => update('dateOfBirth', v)} className="w-28" />
        <button className="text-slate-400 hover:text-slate-600"><Calendar size={14} /></button>
      </div>
    ),
    gender: (
      <Sel value={data.gender} onChange={(v) => update('gender', v)} options={['Male', 'Female']} className="w-20" />
    ),
    smoker: (
      <Sel
        value={data.smoker === 'No' ? 'Non-Smoker' : 'Smoker'}
        onChange={(v) => update('smoker', v === 'Non-Smoker' ? 'No' : 'Yes')}
        options={['Non-Smoker', 'Smoker']}
        className="w-32"
      />
    ),
    state: (
      <Sel value={data.state} onChange={(v) => update('state', v)} options={STATE_OPTIONS} className="w-40" />
    ),
    income: (
      <Inp value={data.annualIncome} onChange={(v) => update('annualIncome', v)} className="w-28" />
    ),
    loadings: (
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">{data.loadings}</span>
        <button className="text-blue-500 hover:text-blue-700" title="Edit loadings"><Edit3 size={12} /></button>
      </div>
    ),
  };
}

interface RowProps {
  label: string;
  labelColor?: string;
  clientField: React.ReactNode;
  partnerField?: React.ReactNode;
}

function FormRow({ label, labelColor = 'text-slate-700', clientField, partnerField }: RowProps) {
  return (
    <tr>
      <td className={`py-2 pr-6 text-sm font-semibold ${labelColor} align-top whitespace-nowrap`}>
        {label}
      </td>
      <td className="py-2 pr-10 align-top">{clientField}</td>
      {partnerField !== undefined && <td className="py-2 align-top">{partnerField}</td>}
    </tr>
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
  const { options: occupations, loading: occupationsLoading, error: occupationsError } = useOccupations();
  const occupationLabels = occupations.map((o) => o.label);

  const c = PersonFields({
    data: clientData,
    onChange: onClientChange,
    occupationOptions: occupationLabels,
    occupationsLoading,
  });
  const p = showPartner && partnerData
    ? PersonFields({
        data: partnerData,
        onChange: onPartnerChange,
        occupationOptions: occupationLabels,
        occupationsLoading,
      })
    : null;

  return (
    <div className="flex-1 overflow-auto flex flex-col">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-blue-700 text-white">
        <h2 className="text-sm font-bold">Personal Details</h2>
        <div className="flex items-center gap-2 text-white/80">
          <button className="hover:text-white" title="Settings"><Info size={14} /></button>
        </div>
      </div>

      {/* API error banner */}
      {occupationsError && (
        <div className="px-8 pt-3 -mb-2 text-xs text-amber-700">
          Could not load occupations — {occupationsError}
        </div>
      )}

      {/* Form body */}
      <div className="flex-1 px-8 py-5">
        <table className="text-sm">
          <thead>
            <tr>
              <th />
              <th className="text-left pb-3 pr-10 text-sm font-semibold text-slate-700">
                {clientData.firstName}, {clientData.lastName}
              </th>
              {showPartner && partnerData && (
                <th className="text-left pb-3 text-sm font-semibold text-slate-700">
                  {partnerData.firstName}, {partnerData.lastName}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            <FormRow label="Name" labelColor="text-blue-800" clientField={c.name} partnerField={p?.name} />
            <FormRow label="Occupation" clientField={c.occupation} partnerField={p?.occupation} />
            <FormRow label="Self Employed" clientField={c.selfEmployed} partnerField={p?.selfEmployed} />
            <FormRow label="Date of Birth" clientField={c.dob} partnerField={p?.dob} />
            <FormRow label="Gender" clientField={c.gender} partnerField={p?.gender} />
            <FormRow label="Smoker Status" clientField={c.smoker} partnerField={p?.smoker} />
            <FormRow label="State" clientField={c.state} partnerField={p?.state} />
            <FormRow label="Annual Income&#10;(ex super)" clientField={c.income} partnerField={p?.income} />
            <FormRow label="Loadings" labelColor="text-blue-800" clientField={c.loadings} partnerField={p?.loadings} />
          </tbody>
        </table>
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-3 py-4 border-t border-gray-200 bg-gray-50">
        <Button className="bg-teal-700 hover:bg-teal-800 text-white px-6" onClick={onLaunchNeedsAnalysis}>
          Launch Needs Analysis
        </Button>
        <Button className="bg-teal-700 hover:bg-teal-800 text-white px-6" onClick={onGetQuotes}>
          Get Quotes
        </Button>
      </div>
    </div>
  );
}
