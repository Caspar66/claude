import { useState, useRef, useEffect } from 'react';
import { Edit3, Info, Calendar, Loader2, Search, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useOccupations } from '@/hooks/useOccupations';
import type { OccupationOption } from '@/services/omnilifeApi';
import type { ClientFormData, EmploymentStatus, ExistingPolicy, HealthDiscount, Loadings } from './insuranceData';
import { EMPLOYMENT_STATUS_LABELS, HEALTH_DISCOUNT_LABELS, hasLoadings } from './insuranceData';
import type { NeedsQuote, WorkspacePreferences } from './needsTypes';
import { createNeedsQuote, loadPreferences } from './needsTypes';
import { OccupationRatingsModal } from './OccupationRatingsModal';
import { CurrentSituationSection } from './CurrentSituationSection';
import { CoverSelectionSection } from './CoverSelectionSection';
import { NeedsEditor } from './NeedsEditor';
import { AddCoverPage } from './AddCoverPage';
import type { NeedsShortfall } from './NeedsAnalysisPage';

interface Props {
  clientData: ClientFormData;
  partnerData: ClientFormData | null;
  onClientChange: (data: ClientFormData) => void;
  onPartnerChange: (data: ClientFormData) => void;
  onLaunchNeedsAnalysis: () => void;
  onGetQuotes: () => void;
  onNext?: () => void;
  hasQuoteResults?: boolean;
  policies: ExistingPolicy[];
  onChangePolicies: (policies: ExistingPolicy[]) => void;
  quotes: NeedsQuote[];
  onChangeQuotes: (quotes: NeedsQuote[]) => void;
  getQuotesDisabled?: boolean;
  getQuotesLabel?: string;
  quoteGeneratedDates?: Record<string, string>;
  onOpenScenarioSettings?: () => void;
  needsShortfalls?: { client: NeedsShortfall; partner: NeedsShortfall };
}

function Inp({ value, onChange, className = '' }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <input
      type="text"
      className={`border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function Sel({ value, onChange, options, className = '' }: { value: string; onChange: (v: string) => void; options: string[]; className?: string }) {
  return (
    <select
      className={`border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${className}`}
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
        className="border border-slate-300 rounded px-2.5 py-1.5 text-sm bg-white text-left w-60 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setOpen(!open)}
      >
        <Search size={12} className="text-gray-400 shrink-0" />
        <span className={`truncate ${value ? 'text-slate-800' : 'text-gray-400'}`}>{displayValue}</span>
        {loading && <Loader2 size={12} className="text-blue-500 animate-spin ml-auto shrink-0" />}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-72 bg-white border border-slate-300 rounded shadow-lg">
          <div className="p-1.5 border-b border-gray-200">
            <input
              type="text"
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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

// ── Loadings Modal ──────────────────────────────────────────────────────────

const LOADING_COVER_TYPES: { key: keyof Loadings; label: string }[] = [
  { key: 'life', label: 'Life' },
  { key: 'tpd', label: 'TPD' },
  { key: 'trauma', label: 'Trauma' },
  { key: 'incomeProtection', label: 'Income Protection' },
  { key: 'businessExpenses', label: 'Business Expenses' },
];

function LoadingsModal({
  open,
  onClose,
  loadings,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  loadings: Loadings;
  onSave: (l: Loadings) => void;
}) {
  const [draft, setDraft] = useState<Loadings>(loadings);

  useEffect(() => {
    if (open) setDraft(loadings);
  }, [open, loadings]);

  function updateEntry(key: keyof Loadings, field: 'percentage' | 'dollarPer1000', raw: string) {
    const num = raw === '' ? 0 : parseFloat(raw);
    if (isNaN(num)) return;
    setDraft((prev) => ({ ...prev, [key]: { ...prev[key], [field]: num } }));
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[600px] w-[600px] p-0 overflow-hidden">
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 bg-slate-700 text-white">
            <h3 className="text-sm font-bold">Loadings</h3>
            <button onClick={onClose} className="text-white/70 hover:text-white"><X size={16} /></button>
          </div>

          {/* Insurer selector */}
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
            <label className="text-xs font-medium text-blue-700">Insurer</label>
            <select className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option>Generic</option>
            </select>
          </div>

          {/* Table */}
          <div className="px-5 py-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300">
                  <th className="text-left py-2 pr-4 font-semibold text-slate-700">Cover type</th>
                  <th className="text-center py-2 px-4 font-semibold text-slate-700">Percentage</th>
                  <th className="text-center py-2 pl-4 font-semibold text-slate-700">Dollar per $1,000</th>
                </tr>
              </thead>
              <tbody>
                {LOADING_COVER_TYPES.map(({ key, label }) => (
                  <tr key={key} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-slate-700">{label}</td>
                    <td className="py-2 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          className="w-20 border border-slate-300 rounded px-2 py-1 text-sm text-right bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={draft[key].percentage || ''}
                          onChange={(e) => updateEntry(key, 'percentage', e.target.value)}
                          placeholder="0"
                        />
                        <span className="text-xs text-slate-500 font-medium">%</span>
                      </div>
                    </td>
                    <td className="py-2 pl-4">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs text-slate-500 font-medium bg-gray-100 px-1.5 py-1 rounded">$</span>
                        <input
                          type="number"
                          step="0.01"
                          className="w-20 border border-slate-300 rounded px-2 py-1 text-sm text-right bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={draft[key].dollarPer1000 || ''}
                          onChange={(e) => updateEntry(key, 'dollarPer1000', e.target.value)}
                          placeholder="0.0"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50">
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={onClose}>Close</Button>
            <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-7" onClick={() => { onSave(draft); onClose(); }}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
  onEditLoadings,
}: {
  data: ClientFormData;
  onChange: (d: ClientFormData) => void;
  occupationOptions: string[];
  occupationsLoading: boolean;
  allOccupations: OccupationOption[];
  onOccupationInfo: (label: string, code: string) => void;
  onEditLoadings: (current: Loadings) => void;
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
        className="border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-60"
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
        className="border border-slate-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-28"
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
        <span className="text-sm text-slate-600">{hasLoadings(data.loadings) ? 'Loadings Applied' : 'No Loadings'}</span>
        <button className="text-blue-500 hover:text-blue-700" title="Edit loadings" onClick={() => onEditLoadings(data.loadings)}><Edit3 size={12} /></button>
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
      <td className="py-2 pr-10 align-top w-1/2">{clientField}</td>
      {partnerField !== undefined && <td className="py-2 align-top w-1/2">{partnerField}</td>}
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
  onNext,
  hasQuoteResults,
  policies,
  onChangePolicies,
  quotes: coverQuotes,
  onChangeQuotes,
  getQuotesDisabled,
  getQuotesLabel,
  quoteGeneratedDates,
  onOpenScenarioSettings,
  needsShortfalls,
}: Props) {
  const showPartner = partnerData !== null;
  const { options: occupations, loading: occupationsLoading, error: occupationsError } = useOccupations();
  const occupationLabels = occupations.map((o) => o.label);

  const [ratingsModal, setRatingsModal] = useState<{ label: string; code: string } | null>(null);
  const [loadingsTarget, setLoadingsTarget] = useState<'client' | 'partner' | null>(null);
  const [addCoverOpen, setAddCoverOpen] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [workspacePrefs, setWorkspacePrefs] = useState<WorkspacePreferences>(() => loadPreferences());

  const clientDisplayName = `${clientData.lastName || 'Client'}, ${clientData.firstName || ''}`.trim().replace(/,$/, '');
  const partnerDisplayName = partnerData ? `${partnerData.lastName || 'Partner'}, ${partnerData.firstName || ''}`.trim().replace(/,$/, '') : null;

  function handleSaveNewCover(policy: ExistingPolicy) {
    onChangePolicies([...policies, policy]);
    setAddCoverOpen(false);
  }

  function handleSaveEditedCover(policy: ExistingPolicy) {
    onChangePolicies(policies.map((p) => p.id === policy.id ? policy : p));
    setEditingPolicyId(null);
  }

  function handleAddQuote() {
    const newQuote = createNeedsQuote(`Quote ${coverQuotes.length + 1}`, 'client', workspacePrefs);
    onChangeQuotes([...coverQuotes, newQuote]);
    setEditingQuoteId(newQuote.id);
  }

  function handleChangeQuotes(updated: NeedsQuote[]) {
    onChangeQuotes(updated);
  }

  function handleSaveQuote(updated: NeedsQuote) {
    onChangeQuotes(coverQuotes.map((q) => q.id === updated.id ? updated : q));
    setEditingQuoteId(null);
  }

  function openRatings(label: string, code: string) {
    setRatingsModal({ label, code });
  }

  function handleSaveLoadings(l: Loadings) {
    if (loadingsTarget === 'partner' && partnerData) {
      onPartnerChange({ ...partnerData, loadings: l });
    } else {
      onClientChange({ ...clientData, loadings: l });
    }
  }

  const c = PersonFields({
    data: clientData,
    onChange: onClientChange,
    occupationOptions: occupationLabels,
    occupationsLoading,
    allOccupations: occupations,
    onOccupationInfo: openRatings,
    onEditLoadings: () => setLoadingsTarget('client'),
  });
  const p = showPartner && partnerData
    ? PersonFields({
        data: partnerData,
        onChange: onPartnerChange,
        occupationOptions: occupationLabels,
        occupationsLoading,
        allOccupations: occupations,
        onOccupationInfo: openRatings,
        onEditLoadings: () => setLoadingsTarget('partner'),
      })
    : null;

  const showHealthDiscount = clientData.smoker === 'No' || (partnerData && partnerData.smoker === 'No');

  const editingQuote = editingQuoteId ? coverQuotes.find((q) => q.id === editingQuoteId) ?? null : null;

  if (editingQuote) {
    return (
      <NeedsEditor
        quote={editingQuote}
        clientName={clientDisplayName}
        partnerName={partnerDisplayName}
        shortfalls={needsShortfalls}
        workspacePrefs={workspacePrefs}
        onSave={handleSaveQuote}
        onCancel={() => setEditingQuoteId(null)}
      />
    );
  }

  const editingPolicy = editingPolicyId ? policies.find((p) => p.id === editingPolicyId) ?? null : null;

  if (editingPolicy) {
    return (
      <AddCoverPage
        clientName={clientDisplayName}
        partnerName={partnerDisplayName}
        existingPolicy={editingPolicy}
        onSave={handleSaveEditedCover}
        onCancel={() => setEditingPolicyId(null)}
      />
    );
  }

  if (addCoverOpen) {
    return (
      <AddCoverPage
        clientName={clientDisplayName}
        partnerName={partnerDisplayName}
        onSave={handleSaveNewCover}
        onCancel={() => setAddCoverOpen(false)}
      />
    );
  }

  return (
    <div className="flex-1 overflow-auto flex flex-col">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-blue-700 text-white">
        <h2 className="text-sm font-bold">Personal Details</h2>
        <div className="flex items-center gap-2">
          {onOpenScenarioSettings && (
            <button
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              onClick={onOpenScenarioSettings}
            >
              <Settings size={12} />
              Scenario Settings
            </button>
          )}
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
        <table className="text-sm w-full">
          <thead>
            <tr>
              <th className="w-[160px]" />
              <th className="text-left pb-3 pr-10 text-sm font-semibold text-slate-700 w-1/2">
                {clientData.firstName}, {clientData.lastName}
              </th>
              {showPartner && partnerData && (
                <th className="text-left pb-3 text-sm font-semibold text-slate-700 w-1/2">
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

      {/* Current Situation section */}
      <CurrentSituationSection
        policies={policies}
        clientName={clientDisplayName}
        partnerName={partnerDisplayName}
        onAddCover={() => setAddCoverOpen(true)}
        onEditPolicy={(id) => setEditingPolicyId(id)}
        onChangePolicies={onChangePolicies}
      />

      {/* Cover Selection section */}
      <CoverSelectionSection
        quotes={coverQuotes}
        clientName={clientDisplayName}
        partnerName={partnerDisplayName}
        onAddQuote={handleAddQuote}
        onEditQuote={(id) => setEditingQuoteId(id)}
        onChangeQuotes={handleChangeQuotes}
        quoteGeneratedDates={quoteGeneratedDates}
        workspacePrefs={workspacePrefs}
        onChangePrefs={setWorkspacePrefs}
      />

      {/* Action buttons */}
      <div className="flex justify-center gap-3 py-4 border-t border-gray-200 bg-gray-50">
        <Button className="bg-teal-700 hover:bg-teal-800 text-white px-6" onClick={onLaunchNeedsAnalysis}>
          Launch Needs Analysis
        </Button>
        <Button
          className="bg-teal-700 hover:bg-teal-800 text-white px-6 disabled:bg-slate-300 disabled:cursor-not-allowed"
          onClick={onGetQuotes}
          disabled={getQuotesDisabled || coverQuotes.length === 0}
          title={coverQuotes.length === 0 ? 'Add at least one quote to the Cover Selection section' : undefined}
        >
          {getQuotesLabel ?? 'Get Quotes'}
        </Button>
        {onNext && (
          <Button
            variant="outline"
            className="border-slate-800 text-slate-800 hover:bg-slate-100 px-6 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={onNext}
            disabled={!hasQuoteResults}
            title={!hasQuoteResults ? 'Run Get Quotes first to view results' : undefined}
          >
            Next
          </Button>
        )}
      </div>

      {/* Occupation Ratings Modal */}
      <OccupationRatingsModal
        open={ratingsModal !== null}
        onClose={() => setRatingsModal(null)}
        occupationLabel={ratingsModal?.label ?? ''}
        occupationId={ratingsModal?.code ?? ''}
      />

      {/* Loadings Modal */}
      <LoadingsModal
        open={loadingsTarget !== null}
        onClose={() => setLoadingsTarget(null)}
        loadings={loadingsTarget === 'partner' && partnerData ? partnerData.loadings : clientData.loadings}
        onSave={handleSaveLoadings}
      />
    </div>
  );
}
