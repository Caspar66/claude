import { Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ClientFormData } from './insuranceData';

interface Props {
  data: ClientFormData;
  onChange: (data: ClientFormData) => void;
  onLaunchNeedsAnalysis: () => void;
  onGetQuotes: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-slate-600 w-28 text-right shrink-0">{label}</label>
      {children}
    </div>
  );
}

function InputField({ value, onChange, className = '' }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <input
      type="text"
      className={`border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function SelectField({ value, onChange, options, className = '' }: { value: string; onChange: (v: string) => void; options: string[]; className?: string }) {
  return (
    <select
      className={`border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

export function ClientDataCapture({ data, onChange, onLaunchNeedsAnalysis, onGetQuotes }: Props) {
  function update(field: keyof ClientFormData, value: string | number) {
    onChange({ ...data, [field]: value });
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-gray-100 to-gray-300">
      {/* Premiums header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-light text-slate-700 tracking-wide">Premiums</h1>
      </div>

      {/* Client form card */}
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 px-8 py-6">
        {/* Row 1: Name + Gender */}
        <div className="grid grid-cols-3 gap-x-6 gap-y-4 mb-4">
          <Field label="First Name">
            <InputField value={data.firstName} onChange={(v) => update('firstName', v)} className="w-40" />
          </Field>
          <Field label="Last Name">
            <InputField value={data.lastName} onChange={(v) => update('lastName', v)} className="w-40" />
          </Field>
          <Field label="Gender">
            <SelectField value={data.gender} onChange={(v) => update('gender', v)} options={['Male', 'Female']} className="w-40" />
          </Field>
        </div>

        {/* Row 2: Smoker + DOB + Age */}
        <div className="grid grid-cols-3 gap-x-6 gap-y-4 mb-4">
          <Field label="Smoker">
            <SelectField value={data.smoker} onChange={(v) => update('smoker', v)} options={['No', 'Yes']} className="w-40" />
          </Field>
          <Field label="Date of Birth">
            <InputField value={data.dateOfBirth} onChange={(v) => update('dateOfBirth', v)} className="w-40" />
          </Field>
          <Field label="Age">
            <input
              type="number"
              className="border border-gray-300 rounded px-3 py-1.5 text-sm w-20 bg-gray-50 focus:outline-none"
              value={data.age}
              readOnly
            />
          </Field>
        </div>

        {/* Row 3: Occupation + Annual Income */}
        <div className="grid grid-cols-3 gap-x-6 gap-y-4 mb-6">
          <Field label="Occupation">
            <div className="flex items-center gap-2">
              <span className="text-sm text-teal-700 font-medium">{data.occupation}</span>
              <button className="text-teal-700 hover:text-teal-800 text-sm flex items-center gap-1">
                <Edit3 size={12} />
                Edit
              </button>
            </div>
          </Field>
          <div />
          <Field label="Annual Income">
            <InputField value={data.annualIncome} onChange={(v) => update('annualIncome', v)} className="w-40" />
          </Field>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-3">
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
    </div>
  );
}
