import { useState, useRef, useEffect } from 'react';
import { Edit3, Info, Calendar, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOccupations } from '@/hooks/useOccupations';
import type { OccupationOption } from '@/services/omnilifeApi';
import type { ClientFormData, EmploymentStatus, HealthDiscount } from './insuranceData';
import { EMPLOYMENT_STATUS_LABELS, HEALTH_DISCOUNT_LABELS } from './insuranceData';
import { OccupationRatingsModal } from './OccupationRatingsModal';

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

function OccupationSearch({
  value,
  options,
  loading,
  onChange,
}: {
  value: string;
  options: string[];
  loading: boolean;
  onChange: (v: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase())).slice(0, 50)
    : options;

  const displayValue = value || 'Select occupation…';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white text-left w-60 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setOpen(!open)}
      >
        <Search size={12} className="text-gray-400 shrink-0" />
        <span className={`truncate ${value ? 'text-slate-800' : 'text-gray-400'}`}>{displayValue}</span>
        {loading && <Loader2 size={12} className="text-blue-500 animate-spin ml-auto shrink-0" />}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-72 bg-white border border-gray-300 rounded shadow-lg">
          <div className="p-1.5 border-b border-gray-200">
            <input
              type="text"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Search occupations…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-400">No matches</div>
            )}
            {filtered.map((o) => (
              <button
                key={o}
                type="button"
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 ${o === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
                onClick={() => { onChange(o); setOpen(false); setQuery(''); }}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const STATE_OPTIONS = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

function PersonFields({
  data,
  onChange,
  occupationOptions,
  occupationsLoading,
  allOccupations,
  onOccupationInfo,
}: {
  data: ClientFormData;
  onChange: (d: ClientFormData) => void;
  occupationOptions: string[];
  occupationsLoading: boolean;
  allOccupations: OccupationOption[];
  onOccupationInfo: (label: string, code: string) => void;
}) {
  function update(field: keyof ClientFormData, value: string | number) {
    onChange({ ...data, [field]: value });
  }

  function handleOccupationInfo() {
    const match = allOccupations.find((o) => o.label === data.occupationCode);
    if (match) onOccupationInfo(match.label, match.code);
  }

  return {
    occupation: (
      <div className="flex items-center gap-1.5">
        <OccupationSearch
          value={data.occupationCode}
          options={occupationOptions}
          loading={occupationsLoading}
          onChange={(v) => update('occupationCode', v)}
        />
        <button
          className={`${data.occupationCode ? 'text-blue-500 hover:text-blue-700' : 'text-gray-300 cursor-default'}`}
          title="Occupation ratings"
          onClick={handleOccupationInfo}
          disabled={!data.occupationCode}
        >
          <Info size={14} />
        </button>
      </div>
    ),
    employmentStatus: (
      <select
        className="border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-60"
        value={data.employmentStatus}
        onChange={(e) => update('employmentStatus', e.target.value as EmploymentStatus)}
      >
        {(Object.entries(EMPLOYMENT_STATUS_LABELS) as [EmploymentStatus, string][]).map(([code, label]) => (
          <option key={code} value={code}>{label}</option>
        ))}
      </select>
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
      <Sel value={data.smoker} onChange={(v) => update('smoker', v)} options={['Yes', 'No']} className="w-16" />
    ),
    healthDiscount: data.smoker === 'No' ? (
      <select
        className="border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-28"
        value={data.healthDiscount}
        onChange={(e) => update('healthDiscount', e.target.value as HealthDiscount)}
      >
        {(Object.entries(HEALTH_DISCOUNT_LABELS) as [HealthDiscount, string][]).map(([code, label]) => (
          <option key={code} value={code}>{label}</option>
        ))}
      </select>
    ) : null,
    state: (
      <Sel value={data.state} onChange={(v) => update('state', v)} options={STATE_OPTIONS} className="w-24" />
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
  show?: boolean;
}

function FormRow({ label, labelColor = 'text-slate-700', clientField, partnerField, show = true }: RowProps) {
  if (!show) return null;
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

  const [ratingsModal, setRatingsModal] = useState<{ label: string; code: string } | null>(null);

  function openRatings(label: string, code: string) {
    setRatingsModal({ label, code });
  }

  const c = PersonFields({
    data: clientData,
    onChange: onClientChange,
    occupationOptions: occupationLabels,
    occupationsLoading,
    allOccupations: occupations,
    onOccupationInfo: openRatings,
  });
  const p = showPartner && partnerData
    ? PersonFields({
        data: partnerData,
        onChange: onPartnerChange,
        occupationOptions: occupationLabels,
        occupationsLoading,
        allOccupations: occupations,
        onOccupationInfo: openRatings,
      })
    : null;

  const showHealthDiscount = clientData.smoker === 'No' || (partnerData && partnerData.smoker === 'No');

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
            <FormRow label="Occupation" clientField={c.occupation} partnerField={p?.occupation} />
            <FormRow label="Employment Status" clientField={c.employmentStatus} partnerField={p?.employmentStatus} />
            <FormRow label="Date of Birth" clientField={c.dob} partnerField={p?.dob} />
            <FormRow label="Gender" clientField={c.gender} partnerField={p?.gender} />
            <FormRow label="Smoker" clientField={c.smoker} partnerField={p?.smoker} />
            <FormRow label="Health Discount" clientField={c.healthDiscount} partnerField={p?.healthDiscount} show={!!showHealthDiscount} />
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

      {/* Occupation Ratings Modal */}
      <OccupationRatingsModal
        open={ratingsModal !== null}
        onClose={() => setRatingsModal(null)}
        occupationLabel={ratingsModal?.label ?? ''}
        occupationId={ratingsModal?.code ?? ''}
      />
    </div>
  );
}
