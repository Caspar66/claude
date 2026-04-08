import { useState, useEffect, useRef } from 'react';
import { Edit3, ChevronDown, ChevronRight, Save, FolderOpen, Trash2, CircleDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  QuoteFormState,
  QuoteSectionKey,
} from './quoteFormTypes';
import { SECTION_LABELS, getSectionSummary } from './quoteFormTypes';
import {
  loadSavedQuoteSets,
  saveQuoteSet,
  deleteSavedQuoteSet,
  generateQuoteName,
  isFormDirty,
} from './savedQuotes';
import type { SavedQuoteSet } from './savedQuotes';

// ── Tiny form helpers ────────────────────────────────────────────────────────

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

function NumInp({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <label className="text-xs text-slate-600 shrink-0">{label}</label>
      <input
        type="number"
        min={0}
        className="border border-gray-300 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 w-[140px]"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      />
    </div>
  );
}

// ── Collapsible card section ─────────────────────────────────────────────────

function SectionCard({
  sectionKey,
  form,
  expanded,
  onToggle,
  children,
}: {
  sectionKey: QuoteSectionKey;
  form: QuoteFormState;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const label = SECTION_LABELS[sectionKey];
  const summary = getSectionSummary(sectionKey, form);

  return (
    <div
      className="border border-gray-200 rounded-md bg-white"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none" onClick={onToggle}>
        {expanded ? <ChevronDown size={14} className="text-slate-500 shrink-0" /> : <ChevronRight size={14} className="text-slate-500 shrink-0" />}
        <span className="text-xs font-bold text-slate-800 flex-1">{label}</span>
        {!expanded && hovered && (
          <button
            className="text-slate-400 hover:text-teal-600 p-0.5 rounded transition-colors"
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            title={`Edit ${label}`}
          >
            <Edit3 size={12} />
          </button>
        )}
      </div>

      {/* Collapsed summary */}
      {!expanded && (
        <div className="px-3 pb-2 -mt-0.5">
          <span className="text-[11px] text-slate-500 leading-tight">{summary}</span>
        </div>
      )}

      {/* Expanded form */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-100 pt-2 space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Premium structure options ────────────────────────────────────────────────

const PREMIUM_STRUCTURE_OPTIONS = ['Stepped', 'Blended', 'Level to 65', 'Level to 70'];
const LIFE_BUY_BACK_OPTIONS = ['Exclude', 'Exclude if possible / Lowest pr.', 'Include'];
const DOUBLE_TPD_OPTIONS = ['Exclude if possible', 'Include'];
const OCCUPATION_TYPE_OPTIONS = ['Best available', 'Own occupation', 'Any occupation', 'Suited occupation'];
const REINSTATEMENT_OPTIONS = ['Exclude if possible', 'Include'];
const DOUBLE_TRAUMA_OPTIONS = ['Exclude if possible', 'Include'];
const BABY_CARE_OPTIONS = ['Exclude', 'Include'];
const PAY_BY_ROLLOVER_OPTIONS = ['Exclude', 'Include'];

// ── Popout form field helpers ───────────────────────────────────────────────

function PopoutInp({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-0.5">
      <label className="text-[10px] text-blue-600 font-medium">{label}</label>
      <input
        className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function PopoutSel({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Parse comma-separated values
  const selected = new Set(value.split(',').map((s) => s.trim()).filter(Boolean));

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function toggle(opt: string) {
    const next = new Set(selected);
    if (next.has(opt)) {
      next.delete(opt);
      // If nothing left, keep the clicked one (at least one must be selected)
      if (next.size === 0) return;
    } else {
      next.add(opt);
    }
    onChange(Array.from(next).join(', '));
  }

  const displayText = selected.size <= 1
    ? Array.from(selected)[0] || options[0]
    : `${selected.size} Selected`;

  return (
    <div className="space-y-0.5 relative" ref={ref}>
      <label className="text-[10px] text-slate-500">{label}</label>
      <button
        type="button"
        className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white text-left flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-gray-400"
        onClick={() => setOpen(!open)}
      >
        <span className={`truncate ${selected.size > 1 ? 'text-blue-600 font-medium' : ''}`}>{displayText}</span>
        <ChevronDown size={12} className="text-gray-400 shrink-0 ml-1" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-10 bg-white border border-gray-300 rounded shadow-lg mt-0.5 py-1 max-h-40 overflow-y-auto">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 px-2 py-1 hover:bg-blue-50 cursor-pointer text-xs"
            >
              <input
                type="checkbox"
                checked={selected.has(opt)}
                onChange={() => toggle(opt)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="text-slate-700">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Term Life and Extensions Popout ─────────────────────────────────────────

function TermLifePopout({
  form,
  onChange,
  onClose,
}: {
  form: QuoteFormState;
  onChange: (f: QuoteFormState) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<QuoteFormState>(structuredClone(form));

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const life = draft.termLife;
  const tpd = draft.tpdExtension;
  const trauma = draft.traumaExtension;

  const upLife = (patch: Partial<typeof life>) => setDraft((prev) => ({ ...prev, termLife: { ...prev.termLife, ...patch } }));
  const upTpd = (patch: Partial<typeof tpd>) => setDraft((prev) => ({ ...prev, tpdExtension: { ...prev.tpdExtension, ...patch } }));
  const upTrauma = (patch: Partial<typeof trauma>) => setDraft((prev) => ({ ...prev, traumaExtension: { ...prev.traumaExtension, ...patch } }));

  function handleSave() {
    onChange(draft);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[80px]" style={{ background: 'rgba(0,0,0,0.15)' }}>
      <div ref={panelRef} className="bg-white rounded-lg shadow-2xl border border-gray-200 w-[720px] max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200">
          <h3 className="text-sm font-bold text-slate-800">Term Life and Extensions</h3>
          <button
            className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-xs font-bold"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* 3 column grid */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="grid grid-cols-3 gap-4">
            {/* Life column */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 border-b border-blue-200 pb-1">Life</h4>
              <PopoutInp label="Sum Insured" value={life.sumInsured} onChange={(v) => upLife({ sumInsured: v })} />
              <PopoutSel label="Premium Structure" value={life.premiumStructure} options={PREMIUM_STRUCTURE_OPTIONS} onChange={(v) => upLife({ premiumStructure: v })} />
              <PopoutSel label="Ownership" value={life.ownership} options={['Non-Super', 'Super']} onChange={(v) => upLife({ ownership: v as 'Non-Super' | 'Super' })} />
              <PopoutSel label="Premium Waiver" value={life.premiumWaiver} options={['Exclude', 'Include']} onChange={(v) => upLife({ premiumWaiver: v as 'Exclude' | 'Include' })} />
              <PopoutSel label="Pay by Rollover" value={life.payByRollover} options={PAY_BY_ROLLOVER_OPTIONS} onChange={(v) => upLife({ payByRollover: v })} />
              <PopoutSel label="Life Buy Back" value={life.lifeBuyBack} options={LIFE_BUY_BACK_OPTIONS} onChange={(v) => upLife({ lifeBuyBack: v })} />
              <PopoutSel label="Double TPD" value={life.doubleTpd} options={DOUBLE_TPD_OPTIONS} onChange={(v) => upLife({ doubleTpd: v })} />
              <PopoutSel label="Occupation Type" value={life.occupationType} options={OCCUPATION_TYPE_OPTIONS} onChange={(v) => upLife({ occupationType: v })} />
              <PopoutSel label="Reinstatement" value={life.reinstatement} options={REINSTATEMENT_OPTIONS} onChange={(v) => upLife({ reinstatement: v })} />
            </div>

            {/* TPD Extension column */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 border-b border-blue-200 pb-1">TPD Extension</h4>
              <PopoutInp label="Sum Insured" value={tpd.sumInsured} onChange={(v) => upTpd({ sumInsured: v })} />
              <PopoutSel label="Premium Structure" value={tpd.premiumStructure} options={PREMIUM_STRUCTURE_OPTIONS} onChange={(v) => upTpd({ premiumStructure: v })} />
              <PopoutSel label="Ownership" value={tpd.ownership} options={['Non-Super', 'Super']} onChange={(v) => upTpd({ ownership: v as 'Non-Super' | 'Super' })} />
              <PopoutSel label="Premium Waiver" value={tpd.premiumWaiver} options={['Exclude', 'Include']} onChange={(v) => upTpd({ premiumWaiver: v as 'Exclude' | 'Include' })} />
              <PopoutSel label="Pay by Rollover" value={tpd.payByRollover} options={PAY_BY_ROLLOVER_OPTIONS} onChange={(v) => upTpd({ payByRollover: v })} />
              <PopoutSel label="Life Buy Back" value={tpd.lifeBuyBack} options={LIFE_BUY_BACK_OPTIONS} onChange={(v) => upTpd({ lifeBuyBack: v })} />
              <PopoutSel label="Double TPD" value={tpd.doubleTpd} options={DOUBLE_TPD_OPTIONS} onChange={(v) => upTpd({ doubleTpd: v })} />
            </div>

            {/* Trauma Extension column */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 border-b border-blue-200 pb-1">Trauma Extension</h4>
              <PopoutInp label="Sum Insured" value={trauma.sumInsured} onChange={(v) => upTrauma({ sumInsured: v })} />
              <PopoutSel label="Premium Structure" value={trauma.premiumStructure} options={PREMIUM_STRUCTURE_OPTIONS} onChange={(v) => upTrauma({ premiumStructure: v })} />
              <PopoutSel label="Trauma Features" value={trauma.traumaFeatures} options={['Basic', 'Intermediate', 'Comprehensive']} onChange={(v) => upTrauma({ traumaFeatures: v as 'Basic' | 'Intermediate' | 'Comprehensive' })} />
              <PopoutSel label="Premium Waiver" value={trauma.premiumWaiver} options={['Exclude', 'Include']} onChange={(v) => upTrauma({ premiumWaiver: v as 'Exclude' | 'Include' })} />
              <PopoutSel label="Life Buy Back" value={trauma.lifeBuyBack} options={LIFE_BUY_BACK_OPTIONS} onChange={(v) => upTrauma({ lifeBuyBack: v })} />
              <PopoutSel label="Double Trauma" value={trauma.doubleTrauma} options={DOUBLE_TRAUMA_OPTIONS} onChange={(v) => upTrauma({ doubleTrauma: v })} />
              <PopoutSel label="Baby Care" value={trauma.babyCare} options={BABY_CARE_OPTIONS} onChange={(v) => upTrauma({ babyCare: v })} />
              <PopoutSel label="Reinstatement" value={trauma.reinstatement} options={REINSTATEMENT_OPTIONS} onChange={(v) => upTrauma({ reinstatement: v })} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 py-2.5 border-t border-gray-200">
          <Button
            size="sm"
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs px-6"
            onClick={handleSave}
          >
            SAVE CHANGES
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Multi-value display helper ──────────────────────────────────────────────

function multiLabel(value: string): string {
  const parts = value.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 1) return parts[0] || '—';
  return `${parts.length} Selected`;
}

// ── Popout-enabled section card for Term Life group ─────────────────────────

function TermLifeSectionCard({
  form,
  onOpenPopout,
}: {
  form: QuoteFormState;
  onOpenPopout: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const life = form.termLife;
  const tpd = form.tpdExtension;
  const trauma = form.traumaExtension;

  // Count how many extensions are active (have a sum insured)
  const selectedCount = [life.sumInsured, tpd.sumInsured, trauma.sumInsured].filter(Boolean).length;

  return (
    <div className="space-y-1.5">
      {/* Term Life and Extensions */}
      <div
        className="border border-blue-200 rounded-md bg-blue-50/40 cursor-pointer hover:bg-blue-50"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onOpenPopout}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          <ChevronRight size={14} className="text-slate-500 shrink-0" />
          <span className="text-xs font-bold text-slate-800 flex-1">Term Life and Extensions</span>
          {hovered && (
            <button className="text-slate-400 hover:text-teal-600 p-0.5 rounded transition-colors">
              <Edit3 size={12} />
            </button>
          )}
        </div>
        <div className="px-3 pb-2 -mt-0.5 text-[10px] text-slate-500">
          {selectedCount > 0 && <span>{selectedCount} Selected</span>}
        </div>
        <div className="grid grid-cols-3 gap-1 px-3 pb-2 text-[10px]">
          <div>
            <div className="text-slate-400">Premium Structure</div>
            <div className="text-slate-600 font-medium">{multiLabel(life.premiumStructure)}</div>
          </div>
          <div>
            <div className="text-slate-400">Ownership</div>
            <div className="text-slate-600 font-medium">{multiLabel(life.ownership)}</div>
          </div>
          <div>
            <div className="text-slate-400">Premium Waiver</div>
            <div className="text-slate-600 font-medium">{multiLabel(life.premiumWaiver)}</div>
          </div>
        </div>
      </div>

      {/* TPD Extension */}
      <div
        className="border border-gray-200 rounded-md bg-white cursor-pointer hover:bg-gray-50/50"
        onClick={onOpenPopout}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          <ChevronRight size={14} className="text-slate-500 shrink-0" />
          <span className="text-xs font-bold text-slate-800 flex-1">TPD Extension</span>
        </div>
        <div className="grid grid-cols-3 gap-1 px-3 pb-2 text-[10px]">
          <div>
            <div className="text-slate-400">Premium Structure</div>
            <div className="text-slate-600 font-medium">{multiLabel(tpd.premiumStructure)}</div>
          </div>
          <div>
            <div className="text-slate-400">Ownership</div>
            <div className="text-slate-600 font-medium">{multiLabel(tpd.ownership)}</div>
          </div>
          <div>
            <div className="text-slate-400">Premium Waiver</div>
            <div className="text-slate-600 font-medium">{multiLabel(tpd.premiumWaiver)}</div>
          </div>
        </div>
      </div>

      {/* Trauma Extension */}
      <div
        className="border border-gray-200 rounded-md bg-white cursor-pointer hover:bg-gray-50/50"
        onClick={onOpenPopout}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          <ChevronRight size={14} className="text-slate-500 shrink-0" />
          <span className="text-xs font-bold text-slate-800 flex-1">Trauma Extension</span>
        </div>
        <div className="grid grid-cols-3 gap-1 px-3 pb-2 text-[10px]">
          <div>
            <div className="text-slate-400">Premium Structure</div>
            <div className="text-slate-600 font-medium">{multiLabel(trauma.premiumStructure)}</div>
          </div>
          <div>
            <div className="text-slate-400">Trauma Features</div>
            <div className="text-slate-600 font-medium">{multiLabel(trauma.traumaFeatures)}</div>
          </div>
          <div>
            <div className="text-slate-400">Premium Waiver</div>
            <div className="text-slate-600 font-medium">{multiLabel(trauma.premiumWaiver)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section form bodies ──────────────────────────────────────────────────────

function LifeInsuredForm({ form, onChange }: { form: QuoteFormState; onChange: (f: QuoteFormState) => void }) {
  const d = form.lifeInsured;
  const up = (patch: Partial<typeof d>) => onChange({ ...form, lifeInsured: { ...d, ...patch } });
  return (
    <>
      <Sel label="Gender" value={d.gender} options={['Male', 'Female']} onChange={(v) => up({ gender: v as 'Male' | 'Female' })} />
      <NumInp label="Age Next Birthday" value={d.ageNextBirthday} onChange={(v) => up({ ageNextBirthday: v })} />
      <Sel label="Smoker" value={d.smoker} options={['No', 'Yes']} onChange={(v) => up({ smoker: v as 'Yes' | 'No' })} />
      <Sel label="State" value={d.state} options={['Queensland', 'New South Wales', 'Victoria', 'Western Australia', 'South Australia', 'Tasmania', 'ACT', 'Northern Territory']} onChange={(v) => up({ state: v })} />
      <Inp label="Annual Income" value={d.annualIncome} onChange={(v) => up({ annualIncome: v })} />
      <Inp label="Occupation" value={d.occupation} onChange={(v) => up({ occupation: v })} />
    </>
  );
}

function TermLifeForm({ form, onChange }: { form: QuoteFormState; onChange: (f: QuoteFormState) => void }) {
  const d = form.termLife;
  const up = (patch: Partial<typeof d>) => onChange({ ...form, termLife: { ...d, ...patch } });
  return (
    <>
      <Inp label="Sum Insured" value={d.sumInsured} onChange={(v) => up({ sumInsured: v })} />
      <Sel label="Premium Structure" value={d.premiumStructure} options={['Stepped', 'Level']} onChange={(v) => up({ premiumStructure: v as 'Stepped' | 'Level' })} />
      <Sel label="Ownership" value={d.ownership} options={['Non-Super', 'Super']} onChange={(v) => up({ ownership: v as 'Non-Super' | 'Super' })} />
      <Sel label="Premium Waiver" value={d.premiumWaiver} options={['Exclude', 'Include']} onChange={(v) => up({ premiumWaiver: v as 'Exclude' | 'Include' })} />
    </>
  );
}

function TpdExtensionForm({ form, onChange }: { form: QuoteFormState; onChange: (f: QuoteFormState) => void }) {
  const d = form.tpdExtension;
  const up = (patch: Partial<typeof d>) => onChange({ ...form, tpdExtension: { ...d, ...patch } });
  return (
    <>
      <Inp label="Sum Insured" value={d.sumInsured} onChange={(v) => up({ sumInsured: v })} />
      <Sel label="Premium Structure" value={d.premiumStructure} options={['Stepped', 'Level']} onChange={(v) => up({ premiumStructure: v as 'Stepped' | 'Level' })} />
      <Sel label="Ownership" value={d.ownership} options={['Non-Super', 'Super']} onChange={(v) => up({ ownership: v as 'Non-Super' | 'Super' })} />
      <Sel label="Premium Waiver" value={d.premiumWaiver} options={['Exclude', 'Include']} onChange={(v) => up({ premiumWaiver: v as 'Exclude' | 'Include' })} />
    </>
  );
}

function TraumaExtensionForm({ form, onChange }: { form: QuoteFormState; onChange: (f: QuoteFormState) => void }) {
  const d = form.traumaExtension;
  const up = (patch: Partial<typeof d>) => onChange({ ...form, traumaExtension: { ...d, ...patch } });
  return (
    <>
      <Inp label="Sum Insured" value={d.sumInsured} onChange={(v) => up({ sumInsured: v })} />
      <Sel label="Trauma Features" value={d.traumaFeatures} options={['Basic', 'Intermediate', 'Comprehensive']} onChange={(v) => up({ traumaFeatures: v as 'Basic' | 'Intermediate' | 'Comprehensive' })} />
      <Sel label="Premium Waiver" value={d.premiumWaiver} options={['Exclude', 'Include']} onChange={(v) => up({ premiumWaiver: v as 'Exclude' | 'Include' })} />
    </>
  );
}

function TpdStandaloneForm({ form, onChange }: { form: QuoteFormState; onChange: (f: QuoteFormState) => void }) {
  const d = form.tpdStandalone;
  const up = (patch: Partial<typeof d>) => onChange({ ...form, tpdStandalone: { ...d, ...patch } });
  return <Inp label="Sum Insured" value={d.sumInsured} onChange={(v) => up({ sumInsured: v })} />;
}

function TraumaStandaloneForm({ form, onChange }: { form: QuoteFormState; onChange: (f: QuoteFormState) => void }) {
  const d = form.traumaStandalone;
  const up = (patch: Partial<typeof d>) => onChange({ ...form, traumaStandalone: { ...d, ...patch } });
  return <Inp label="Sum Insured" value={d.sumInsured} onChange={(v) => up({ sumInsured: v })} />;
}

function ChildTraumaForm({ form, onChange }: { form: QuoteFormState; onChange: (f: QuoteFormState) => void }) {
  const d = form.childTrauma;
  const up = (patch: Partial<typeof d>) => onChange({ ...form, childTrauma: { ...d, ...patch } });
  return <NumInp label="No. of Children" value={d.numberOfChildren} onChange={(v) => up({ numberOfChildren: v })} />;
}

function IncomeProtectionForm({ form, onChange }: { form: QuoteFormState; onChange: (f: QuoteFormState) => void }) {
  const d = form.incomeProtection;
  const up = (patch: Partial<typeof d>) => onChange({ ...form, incomeProtection: { ...d, ...patch } });
  return (
    <>
      <Inp label="Monthly Benefit" value={d.monthlyBenefit} onChange={(v) => up({ monthlyBenefit: v })} />
      <Sel label="Owner" value={d.owner} options={['Non-Super', 'Super']} onChange={(v) => up({ owner: v as 'Non-Super' | 'Super' })} />
      <Sel label="Premium Structure" value={d.premiumStructure} options={['Stepped', 'Level']} onChange={(v) => up({ premiumStructure: v as 'Stepped' | 'Level' })} />
      <Sel label="Waiting Period" value={d.waitingPeriod} options={['30 days', '60 days', '90 days']} onChange={(v) => up({ waitingPeriod: v as '30 days' | '60 days' | '90 days' })} />
      <Sel label="Benefit Period" value={d.benefitPeriod} options={['2 years', '5 years', 'To Age 65']} onChange={(v) => up({ benefitPeriod: v as '2 years' | '5 years' | 'To Age 65' })} />
      <Sel label="Benefit Type" value={d.benefitType} options={['Indemnity', 'Agreed', 'Indemnity if possible']} onChange={(v) => up({ benefitType: v as 'Indemnity' | 'Agreed' | 'Indemnity if possible' })} />
      <Sel label="Inc Claim Benefit" value={d.incClaimBenefit} options={['Exclude if possible', 'Include']} onChange={(v) => up({ incClaimBenefit: v as 'Exclude if possible' | 'Include' })} />
      <Sel label="Accidental Benefit" value={d.accidentalBenefit} options={['Exclude if possible', 'Include']} onChange={(v) => up({ accidentalBenefit: v as 'Exclude if possible' | 'Include' })} />
      <Sel label="IP Feature" value={d.ipFeature} options={['Standard', 'Day 1']} onChange={(v) => up({ ipFeature: v as 'Standard' | 'Day 1' })} />
      <Sel label="Pay by Rollover" value={d.payByRollover} options={['Exclude', 'Include']} onChange={(v) => up({ payByRollover: v as 'Exclude' | 'Include' })} />
    </>
  );
}

function BusinessExpensesForm({ form, onChange }: { form: QuoteFormState; onChange: (f: QuoteFormState) => void }) {
  const d = form.businessExpenses;
  const up = (patch: Partial<typeof d>) => onChange({ ...form, businessExpenses: { ...d, ...patch } });
  return <Inp label="Sum Insured" value={d.sumInsured} onChange={(v) => up({ sumInsured: v })} />;
}

function NeedleStickForm({ form, onChange }: { form: QuoteFormState; onChange: (f: QuoteFormState) => void }) {
  const d = form.needleStick;
  const up = (patch: Partial<typeof d>) => onChange({ ...form, needleStick: { ...d, ...patch } });
  return <Inp label="Sum Insured" value={d.sumInsured} onChange={(v) => up({ sumInsured: v })} />;
}

function PremiumLoadingForm({ form, onChange }: { form: QuoteFormState; onChange: (f: QuoteFormState) => void }) {
  const d = form.premiumLoading;
  const up = (patch: Partial<typeof d>) => onChange({ ...form, premiumLoading: { ...d, ...patch } });
  return <Inp label="Loading" value={d.loading} onChange={(v) => up({ loading: v })} />;
}

function ExistingPoliciesForm({ form, onChange, onMapPolicies }: { form: QuoteFormState; onChange: (f: QuoteFormState) => void; onMapPolicies?: () => void }) {
  const d = form.existingPolicies;
  const up = (patch: Partial<typeof d>) => onChange({ ...form, existingPolicies: { ...d, ...patch } });
  return (
    <>
      <NumInp label="No. of Policies" value={d.count} onChange={(v) => up({ count: v })} />
      {onMapPolicies && (
        <button
          className="mt-1 text-xs text-teal-700 hover:text-teal-800 hover:underline font-medium"
          onClick={onMapPolicies}
        >
          Map Existing Policy...
        </button>
      )}
    </>
  );
}

// ── Section key → form body mapping ──────────────────────────────────────────

const SECTION_FORMS: Record<QuoteSectionKey, React.FC<{ form: QuoteFormState; onChange: (f: QuoteFormState) => void; onMapPolicies?: () => void }>> = {
  lifeInsured: LifeInsuredForm,
  termLife: TermLifeForm,
  tpdExtension: TpdExtensionForm,
  traumaExtension: TraumaExtensionForm,
  tpdStandalone: TpdStandaloneForm,
  traumaStandalone: TraumaStandaloneForm,
  childTrauma: ChildTraumaForm,
  incomeProtection: IncomeProtectionForm,
  businessExpenses: BusinessExpensesForm,
  needleStick: NeedleStickForm,
  premiumLoading: PremiumLoadingForm,
  existingPolicies: ExistingPoliciesForm,
};

const ALL_SECTIONS: QuoteSectionKey[] = [
  'lifeInsured',
  'termLife',
  'tpdExtension',
  'traumaExtension',
  'tpdStandalone',
  'traumaStandalone',
  'childTrauma',
  'incomeProtection',
  'businessExpenses',
  'needleStick',
  'premiumLoading',
  'existingPolicies',
];

// ── Save quote inline dialog ─────────────────────────────────────────────────

function SaveQuoteInline({
  suggestedName,
  onSave,
  onCancel,
}: {
  suggestedName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(suggestedName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <div className="px-2.5 py-2 bg-teal-50 border-b border-teal-200 space-y-1.5">
      <label className="text-[11px] font-semibold text-teal-800">Save Quote Set As:</label>
      <input
        ref={inputRef}
        type="text"
        className="w-full border border-teal-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && name.trim()) onSave(name.trim());
          if (e.key === 'Escape') onCancel();
        }}
      />
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          className="bg-teal-700 hover:bg-teal-800 text-white text-[11px] h-6 flex-1"
          disabled={!name.trim()}
          onClick={() => onSave(name.trim())}
        >
          Save
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-[11px] h-6 flex-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Saved quotes dropdown ────────────────────────────────────────────────────

function SavedQuotesDropdown({
  open,
  onClose,
  onLoad,
}: {
  open: boolean;
  onClose: () => void;
  onLoad: (set: SavedQuoteSet) => void;
}) {
  const [sets, setSets] = useState<SavedQuoteSet[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setSets(loadSavedQuoteSets());
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;

  function handleDelete(id: string) {
    deleteSavedQuoteSet(id);
    setSets(loadSavedQuoteSets());
  }

  return (
    <div
      ref={ref}
      className="absolute left-0 right-0 top-full z-20 bg-white border border-gray-200 rounded-b-md shadow-lg max-h-60 overflow-y-auto"
    >
      {sets.length === 0 ? (
        <div className="px-3 py-4 text-center text-xs text-muted-foreground">
          No saved quote sets yet.
        </div>
      ) : (
        sets.map((s) => {
          const date = new Date(s.savedAt);
          const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
          return (
            <div
              key={s.id}
              className="flex items-center gap-2 px-3 py-2 hover:bg-teal-50 border-b border-gray-100 last:border-b-0 group cursor-pointer"
              onClick={() => { onLoad(s); onClose(); }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-slate-700 truncate">{s.name}</div>
                <div className="text-[10px] text-slate-400">{dateStr}</div>
              </div>
              <button
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-0.5 transition-opacity"
                onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                title="Delete saved set"
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Main panel ───────────────────────────────────────────────────────────────

interface Props {
  form: QuoteFormState;
  onChange: (form: QuoteFormState) => void;
  onReset: () => void;
  onSaveQuotes: () => void;
  onUpdateQuotes: () => void;
  onMapExistingPolicies?: () => void;
}

const POPOUT_SECTIONS = new Set<QuoteSectionKey>(['termLife', 'tpdExtension', 'traumaExtension']);

export function QuoteLeftPanel({ form, onChange, onReset, onSaveQuotes, onUpdateQuotes, onMapExistingPolicies }: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<QuoteSectionKey>>(new Set(['lifeInsured']));
  const [termLifePopoutOpen, setTermLifePopoutOpen] = useState(false);

  // ── Saved quotes state ──────────────────────────────────────────────────
  const [showSaveInline, setShowSaveInline] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);
  const [savedBaseline, setSavedBaseline] = useState<QuoteFormState | null>(null);
  const [activeSavedName, setActiveSavedName] = useState<string | null>(null);

  const dirty = isFormDirty(form, savedBaseline);

  function handleSaveQuoteSet(name: string) {
    saveQuoteSet(name, form);
    setSavedBaseline(structuredClone(form));
    setActiveSavedName(name);
    setShowSaveInline(false);
  }

  function handleLoadQuoteSet(set: SavedQuoteSet) {
    onChange(structuredClone(set.form));
    setSavedBaseline(structuredClone(set.form));
    setActiveSavedName(set.name);
  }

  function handleReset() {
    onReset();
    setSavedBaseline(null);
    setActiveSavedName(null);
  }

  function toggleSection(key: QuoteSectionKey) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="w-[300px] shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col overflow-hidden">
      {/* Header with saved quotes controls */}
      <div className="border-b border-gray-200 bg-white relative">
        <div className="flex items-center justify-between px-3 py-2">
          <h3 className="text-sm font-bold text-slate-800">Quote Parameters</h3>
          <div className="flex items-center gap-1">
            <button
              className="text-slate-400 hover:text-teal-600 p-1 rounded transition-colors"
              title="View Saved Quotes"
              onClick={() => { setShowSavedList(!showSavedList); setShowSaveInline(false); }}
            >
              <FolderOpen size={14} />
            </button>
            <button
              className="text-slate-400 hover:text-teal-600 p-1 rounded transition-colors"
              title="Save Current Parameters"
              onClick={() => { setShowSaveInline(!showSaveInline); setShowSavedList(false); }}
            >
              <Save size={14} />
            </button>
          </div>
        </div>

        {/* Active saved name + dirty indicator */}
        <div className="flex items-center gap-1.5 px-3 pb-2 -mt-0.5">
          {activeSavedName ? (
            <>
              <span className="text-[11px] text-slate-500 truncate max-w-[200px]">{activeSavedName}</span>
              {dirty ? (
                <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-medium shrink-0">
                  <CircleDot size={10} />
                  Unsaved
                </span>
              ) : (
                <span className="text-[10px] text-emerald-600 font-medium shrink-0">Saved</span>
              )}
            </>
          ) : (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-medium">
              <CircleDot size={10} />
              Unsaved Quotes
            </span>
          )}
        </div>

        {/* Saved quotes list dropdown */}
        <SavedQuotesDropdown
          open={showSavedList}
          onClose={() => setShowSavedList(false)}
          onLoad={handleLoadQuoteSet}
        />
      </div>

      {/* Save inline form (shown when save icon clicked) */}
      {showSaveInline && (
        <SaveQuoteInline
          suggestedName={activeSavedName && !dirty ? activeSavedName : generateQuoteName(form)}
          onSave={handleSaveQuoteSet}
          onCancel={() => setShowSaveInline(false)}
        />
      )}

      {/* Scrollable cards */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-1.5">
        {ALL_SECTIONS.map((key) => {
          // Skip tpdExtension and traumaExtension — they're rendered inside the Term Life group
          if (key === 'tpdExtension' || key === 'traumaExtension') return null;

          // Term Life group: render the popout-enabled section card
          if (key === 'termLife') {
            return (
              <TermLifeSectionCard
                key="termLifeGroup"
                form={form}
                onOpenPopout={() => setTermLifePopoutOpen(true)}
              />
            );
          }

          const FormBody = SECTION_FORMS[key];
          return (
            <SectionCard
              key={key}
              sectionKey={key}
              form={form}
              expanded={expandedSections.has(key)}
              onToggle={() => toggleSection(key)}
            >
              <FormBody
                form={form}
                onChange={onChange}
                onMapPolicies={key === 'existingPolicies' ? onMapExistingPolicies : undefined}
              />
            </SectionCard>
          );
        })}
      </div>

      {/* Term Life and Extensions popout */}
      {termLifePopoutOpen && (
        <TermLifePopout
          form={form}
          onChange={onChange}
          onClose={() => setTermLifePopoutOpen(false)}
        />
      )}

      {/* Bottom action buttons */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-200 bg-white">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7 flex-1"
          onClick={handleReset}
        >
          Reset
        </Button>
        <Button
          size="sm"
          className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-7 flex-1"
          onClick={() => {
            setShowSaveInline(true);
            setShowSavedList(false);
          }}
        >
          Save Quotes
        </Button>
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 flex-1"
          onClick={onUpdateQuotes}
        >
          Update Quotes
        </Button>
      </div>
    </div>
  );
}
