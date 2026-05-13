import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronDown, ChevronRight, Plus, Trash2, Settings2 } from 'lucide-react';
import RequiredFeaturesModal from './RequiredFeaturesModal';
import { REQUIRED_FEATURES } from './requiredFeaturesData';
import { Button } from '@/components/ui/button';
import type { NeedsShortfall } from './NeedsAnalysisPage';
import type {
  NeedsQuote, Need, NeedCode, LinkedNeedCode, QuoteFrequency,
  TrmFields, TpeFields, TreFields, TpsFields, TrsFields, TprFields,
  IncFields, BusFields, NesFields, ChtFields, ChtChild,
  FieldValue,
  Structure4, Structure3, Structure2,
  Rollover, PremiumWaiver, OccupationType,
  ThreeWay, FourWay, Priority,
  LifeBuyBackTPE, LifeBuyBackTRE,
  AgreedValue, WaitingPeriodINC, WaitingPeriodBUS, BenefitPeriodINC,
  ReplacementRatio, Gender,
} from './needsTypes';
import {
  NEED_CODE_LABELS, LINKED_NEED_LABELS,
  STRUCTURE_4_LABELS, STRUCTURE_3_LABELS, STRUCTURE_2_LABELS,
  OWNER_TRM_LABELS, OWNER_TPE_LABELS, OWNER_INC_LABELS,
  ROLLOVER_LABELS, PREMIUM_WAIVER_LABELS, OCCUPATION_LABELS,
  THREE_WAY_LABELS, FOUR_WAY_LABELS, PRIORITY_LABELS,
  LIFE_BUY_BACK_TPE_LABELS, LIFE_BUY_BACK_TRE_LABELS,
  AGREED_VALUE_LABELS, WAITING_INC_LABELS, WAITING_BUS_LABELS,
  BENEFIT_INC_LABELS, REPLACEMENT_RATIO_LABELS, GENDER_LABELS,
  createNeed, getNeedCode, toSingleValue,
  addLinkedNeedTRM, addLinkedNeedTRS, removeLinkedNeed,
  hasLinkedNeed, serialiseNeeds,
} from './needsTypes';

const FREQ_OPTIONS: { code: QuoteFrequency; label: string }[] = [
  { code: 'W', label: 'Weekly' },
  { code: 'F', label: 'Fortnightly' },
  { code: 'M', label: 'Monthly' },
  { code: 'Q', label: 'Quarterly' },
  { code: 'H', label: 'Half Yearly' },
  { code: 'Y', label: 'Yearly' },
];


interface Props {
  quote: NeedsQuote;
  clientName: string;
  partnerName: string | null;
  shortfalls?: { client: NeedsShortfall; partner: NeedsShortfall };
  onSave: (quote: NeedsQuote) => void;
  onCancel: () => void;
}

// ── Form field helpers ──────────────────────────────────────────

function CodeSel({ label, value, labelMap, onChange }: {
  label: string;
  value: FieldValue;
  labelMap: Record<string, string>;
  onChange: (v: string) => void;
}) {
  const keys = Object.keys(labelMap);
  const sv = toSingleValue(value, keys[0]);
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <label className="text-xs text-slate-600 shrink-0">{label}</label>
      <select
        className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 w-[200px]"
        value={sv}
        onChange={(e) => onChange(e.target.value)}
      >
        {keys.map((code) => (
          <option key={code} value={code}>{labelMap[code]}</option>
        ))}
      </select>
    </div>
  );
}

function NumInp({ label, value, onChange }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <label className="text-xs text-slate-600 shrink-0">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        required
        className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 w-[200px]"
        value={String(value)}
        onChange={(e) => {
          const num = parseInt(e.target.value.replace(/\D/g, ''), 10);
          onChange(isNaN(num) ? 0 : num);
        }}
      />
    </div>
  );
}

function DateInp({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <label className="text-xs text-slate-600 shrink-0">{label}</label>
      <input
        type="date"
        required
        className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 w-[200px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function calculateAge(dob: string): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

function AgeDisplay({ label, dob }: { label: string; dob: string }) {
  const age = calculateAge(dob);
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <label className="text-xs text-slate-600 shrink-0">{label}</label>
      <span className="text-xs text-slate-700 w-[200px] px-2 py-1 bg-gray-50 border border-gray-200 rounded">
        {age} {age === 1 ? 'year' : 'years'}
      </span>
    </div>
  );
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function SingleCodeSel<T extends string>({ label, value, labelMap, onChange }: {
  label: string;
  value: FieldValue<T>;
  labelMap: Record<T, string>;
  onChange: (v: T) => void;
}) {
  const keys = Object.keys(labelMap) as T[];
  const sv = toSingleValue(value, keys[0]);
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <label className="text-xs text-slate-600 shrink-0">{label}</label>
      <select
        className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 w-[200px]"
        value={sv}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {keys.map((code) => (
          <option key={code} value={code}>{labelMap[code]}</option>
        ))}
      </select>
    </div>
  );
}

function MultiCodeSel<T extends string>({ label, value, labelMap, onChange, locked }: {
  label: string;
  value: FieldValue<T>;
  labelMap: Record<T, string>;
  onChange: (v: FieldValue<T>) => void;
  locked?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const keys = Object.keys(labelMap) as T[];
  const isMulti = Array.isArray(value);
  const isAll = isMulti && value.length === keys.length && keys.every((k) => (value as T[]).includes(k));

  if (locked && !isMulti) {
    const sv = toSingleValue(value, keys[0]);
    return (
      <div className="flex items-center justify-between gap-3 py-1">
        <label className="text-xs text-slate-600 shrink-0">{label}</label>
        <select
          className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 w-[200px]"
          value={sv}
          onChange={(e) => onChange(e.target.value as FieldValue<T>)}
        >
          {keys.map((code) => (
            <option key={code} value={code}>{labelMap[code]}</option>
          ))}
        </select>
      </div>
    );
  }
  const selected = new Set<T>(isMulti ? (value as T[]) : [value as T]);

  let display: string;
  if (isAll) display = 'All options';
  else if (isMulti) display = (value as T[]).map((v) => labelMap[v]).join(', ');
  else display = labelMap[value as T] ?? '';

  function toggleAll() {
    if (isAll) onChange(keys[0]);
    else onChange([...keys]);
  }

  function toggleOption(code: T) {
    const current: T[] = isMulti ? (value as T[]) : [value as T];
    const has = current.includes(code);
    if (has) {
      const next = current.filter((c) => c !== code);
      if (next.length === 0) return;
      onChange(next.length === 1 ? next[0] : next);
    } else {
      onChange([...current, code]);
    }
  }

  const isComparison = isMulti;

  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <label className="text-xs text-slate-600 shrink-0">{label}</label>
      <div className="relative w-[200px]" ref={ref}>
        <button
          type="button"
          className={`w-full border rounded px-2 py-1 text-xs bg-white text-left focus:outline-none focus:ring-1 focus:ring-teal-400 flex items-center justify-between ${isComparison ? 'border-teal-500 bg-teal-50 font-semibold' : 'border-slate-300'}`}
          onClick={() => setOpen(!open)}
          title={display}
        >
          <span className="truncate">{display || 'Select…'}</span>
          <ChevronDown size={10} className="shrink-0 text-gray-400" />
        </button>
        {open && (
          <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[240px] max-h-60 overflow-auto">
            <label className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-blue-50 border-b border-gray-200 cursor-pointer bg-gray-50">
              <input type="checkbox" checked={isAll} onChange={toggleAll} />
              <span className="font-semibold">All options</span>
            </label>
            {keys.map((code) => (
              <label key={code} className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-blue-50">
                <input
                  type="checkbox"
                  checked={selected.has(code)}
                  onChange={() => toggleOption(code)}
                />
                <span>{labelMap[code]}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Card header ─────────────────────────────────────────────────

function NeedCardHeader({ code, label, expanded, onToggle, onRemove, linked, shortfallBadge }: {
  code: string;
  label: string;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  linked?: boolean;
  shortfallBadge?: React.ReactNode;
}) {
  return (
    <div className={`flex items-center justify-between px-4 py-2 ${linked ? 'bg-teal-50/50' : 'bg-gray-50'} border-b border-gray-200`}>
      <button className="flex items-center gap-2 text-left flex-1" onClick={onToggle}>
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="text-xs font-bold text-slate-800">{label}</span>
      </button>
      <div className="flex items-center gap-3">
        {shortfallBadge}
        <button className="text-slate-400 hover:text-red-500" title="Remove" onClick={onRemove}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Need picker dropdown ────────────────────────────────────────

const ALL_NEED_CODES: NeedCode[] = ['TRM', 'TPS', 'TRS', 'INC', 'BUS', 'NES', 'CHT'];

function NeedPicker({ existingCodes, onAdd }: {
  existingCodes: NeedCode[];
  onAdd: (code: NeedCode) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const available = ALL_NEED_CODES.filter((c) => !existingCodes.includes(c));
  if (available.length === 0) return null;

  return (
    <div className="relative inline-block" ref={ref}>
      <Button
        size="sm"
        className="bg-indigo-900 hover:bg-indigo-950 text-white text-xs h-8 px-3 flex items-center gap-1"
        onClick={() => setOpen(!open)}
      >
        <Plus size={14} /> Add Need
      </Button>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[200px]">
          {available.map((code) => (
            <button
              key={code}
              className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-slate-700"
              onClick={() => { onAdd(code); setOpen(false); }}
            >
              {NEED_CODE_LABELS[code]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Resolve INC availability query value ────────────────────────

function resolveFieldValue<T extends string>(v: FieldValue<T> | '?', fallback: T): FieldValue<T> {
  return v === '?' ? fallback : v;
}

// ── Main component ──────────────────────────────────────────────

function fmtShortfall(n: number): string {
  const abs = Math.abs(n);
  const str = abs.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return n < 0 ? `-$${str}` : `$${str}`;
}

function fmtShortfallMonthly(n: number): string {
  const monthly = Math.round(n / 12);
  return `${fmtShortfall(monthly)} pm`;
}

function ShortfallBadge({ label, value, monthly }: { label: string; value: number; monthly?: boolean }) {
  if (value >= 0) return null;
  return (
    <span className="text-xs font-semibold text-red-600 whitespace-nowrap">
      {label} shortfall: {monthly ? fmtShortfallMonthly(value) : fmtShortfall(value)}
    </span>
  );
}

export function NeedsEditor({ quote, clientName, partnerName, shortfalls, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<NeedsQuote>(quote);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(quote.needs.map((n) => getNeedCode(n))));
  const [showJson, setShowJson] = useState(false);
  const sf = shortfalls ? (draft.lifeInsured === 'partner' ? shortfalls.partner : shortfalls.client) : null;

  useEffect(() => { setDraft(quote); }, [quote]);

  function toggleExpanded(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  // ── Need list management ──────────────────────────────────────

  function addNeed(code: NeedCode) {
    setDraft((d) => ({ ...d, needs: [...d.needs, createNeed(code)] }));
    setExpanded((prev) => new Set(prev).add(code));
  }

  function removeNeed(index: number) {
    setDraft((d) => ({ ...d, needs: d.needs.filter((_, i) => i !== index) }));
  }

  function updateNeed(index: number, updated: Need) {
    setDraft((d) => ({ ...d, needs: d.needs.map((n, i) => i === index ? updated : n) }));
  }

  // ── Linked need management for TRM ────────────────────────────

  function addLinkedToTrm(trmIdx: number, code: 'TPE' | 'TRE') {
    setDraft((d) => {
      const needs = [...d.needs];
      const trm = (needs[trmIdx] as { TRM: TrmFields }).TRM;
      needs[trmIdx] = { TRM: addLinkedNeedTRM(trm, code) };
      return { ...d, needs };
    });
    setExpanded((prev) => new Set(prev).add(`TRM-${code}`));
  }

  function removeLinkedFromTrm(trmIdx: number, code: LinkedNeedCode) {
    setDraft((d) => {
      const needs = [...d.needs];
      const trm = (needs[trmIdx] as { TRM: TrmFields }).TRM;
      needs[trmIdx] = { TRM: removeLinkedNeed(trm, code) };
      return { ...d, needs };
    });
  }

  function updateLinkedInTrm(trmIdx: number, lnCode: 'TPE' | 'TRE', fields: TpeFields | TreFields) {
    setDraft((d) => {
      const needs = [...d.needs];
      const trm = (needs[trmIdx] as { TRM: TrmFields }).TRM;
      const linkedNeeds = trm.linkedNeeds.map((ln) => {
        if (lnCode === 'TPE' && 'TPE' in ln) return { TPE: fields as TpeFields };
        if (lnCode === 'TRE' && 'TRE' in ln) return { TRE: fields as TreFields };
        return ln;
      });
      needs[trmIdx] = { TRM: { ...trm, linkedNeeds } };
      return { ...d, needs };
    });
  }

  // ── Linked need management for TRS ────────────────────────────

  function addLinkedToTrs(trsIdx: number) {
    setDraft((d) => {
      const needs = [...d.needs];
      const trs = (needs[trsIdx] as { TRS: TrsFields }).TRS;
      needs[trsIdx] = { TRS: addLinkedNeedTRS(trs, 'TPR') };
      return { ...d, needs };
    });
    setExpanded((prev) => new Set(prev).add('TRS-TPR'));
  }

  function removeLinkedFromTrs(trsIdx: number) {
    setDraft((d) => {
      const needs = [...d.needs];
      const trs = (needs[trsIdx] as { TRS: TrsFields }).TRS;
      needs[trsIdx] = { TRS: removeLinkedNeed(trs, 'TPR') };
      return { ...d, needs };
    });
  }

  function updateLinkedInTrs(trsIdx: number, fields: TprFields) {
    setDraft((d) => {
      const needs = [...d.needs];
      const trs = (needs[trsIdx] as { TRS: TrsFields }).TRS;
      needs[trsIdx] = { TRS: { ...trs, linkedNeeds: [{ TPR: fields }] } };
      return { ...d, needs };
    });
  }

  // ── Required Features state ───────────────────────────────────

  const [featuresModal, setFeaturesModal] = useState<{ needCode: string; label: string } | null>(null);

  function updateRequiredFeatures(needCode: string, selected: string[]) {
    setDraft((d) => ({
      ...d,
      requiredFeatures: { ...d.requiredFeatures, [needCode]: selected },
    }));
  }

  function featuresButton(needCode: string, label: string) {
    if (!REQUIRED_FEATURES[needCode]?.length) return null;
    const count = (draft.requiredFeatures[needCode] ?? []).length;
    return (
      <button
        className="flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 font-medium mt-2"
        onClick={() => setFeaturesModal({ needCode, label })}
      >
        <Settings2 size={12} />
        Required Features{count > 0 && ` (${count})`}
      </button>
    );
  }

  // ── Existing codes for picker ─────────────────────────────────

  const existingCodes = draft.needs.map((n) => getNeedCode(n));

  // ── Render need card by type ──────────────────────────────────

  function renderNeedCard(need: Need, index: number) {
    const code = getNeedCode(need);
    const isExp = expanded.has(code);

    switch (code) {
      case 'TRM': {
        const trm = (need as { TRM: TrmFields }).TRM;
        const hasTpe = hasLinkedNeed(trm, 'TPE');
        const hasTre = hasLinkedNeed(trm, 'TRE');
        const availableLinked: ('TPE' | 'TRE')[] = [];
        if (!hasTpe) availableLinked.push('TPE');
        if (!hasTre) availableLinked.push('TRE');

        return (
          <div key={code} className="border border-gray-200 rounded">
            <NeedCardHeader code="TRM" label={NEED_CODE_LABELS.TRM} expanded={isExp} onToggle={() => toggleExpanded(code)} onRemove={() => removeNeed(index)} shortfallBadge={sf && <ShortfallBadge label="Life" value={sf.life} />} />
            {isExp && (
              <div className="px-6 py-3">
                <div className="space-y-0.5">
                  <NumInp label="Sum Insured" value={trm.sumInsured} onChange={(v) => updateNeed(index, { TRM: { ...trm, sumInsured: v } })} />
                  <CodeSel label="Structure" value={trm.structure} labelMap={STRUCTURE_4_LABELS} onChange={(v) => updateNeed(index, { TRM: { ...trm, structure: v as Structure4 } })} />
                  <SingleCodeSel label="Owner" value={trm.owner} labelMap={OWNER_TRM_LABELS} onChange={(v) => updateNeed(index, { TRM: { ...trm, owner: v } })} />
                  <CodeSel label="Rollover" value={trm.rollover} labelMap={ROLLOVER_LABELS} onChange={(v) => updateNeed(index, { TRM: { ...trm, rollover: v as Rollover } })} />
                  <CodeSel label="Premium Waiver" value={trm.premiumWaiver} labelMap={PREMIUM_WAIVER_LABELS} onChange={(v) => updateNeed(index, { TRM: { ...trm, premiumWaiver: v as PremiumWaiver } })} />
                  {featuresButton('TRM', NEED_CODE_LABELS.TRM)}
                </div>

                {/* Linked needs: TPE */}
                {trm.linkedNeeds.map((ln) => {
                  if ('TPE' in ln) {
                    const tpe = ln.TPE;
                    const lnKey = 'TRM-TPE';
                    const lnExp = expanded.has(lnKey);
                    return (
                      <div key="TPE" className="mt-3 ml-4 border-l-2 border-teal-300 pl-3">
                        <NeedCardHeader code="TPE" label={LINKED_NEED_LABELS.TPE} expanded={lnExp} onToggle={() => toggleExpanded(lnKey)} onRemove={() => removeLinkedFromTrm(index, 'TPE')} linked shortfallBadge={sf && <ShortfallBadge label="TPD" value={sf.tpd} />} />
                        {lnExp && (
                          <div className="px-4 py-2 space-y-0.5">
                            <NumInp label="Sum Insured" value={tpe.sumInsured} onChange={(v) => updateLinkedInTrm(index, 'TPE', { ...tpe, sumInsured: v })} />
                            <CodeSel label="Structure" value={tpe.structure} labelMap={STRUCTURE_4_LABELS} onChange={(v) => updateLinkedInTrm(index, 'TPE', { ...tpe, structure: v as Structure4 })} />
                            <SingleCodeSel label="Owner" value={tpe.owner} labelMap={OWNER_TPE_LABELS} onChange={(v) => updateLinkedInTrm(index, 'TPE', { ...tpe, owner: v })} />
                            <CodeSel label="Rollover" value={tpe.rollover} labelMap={ROLLOVER_LABELS} onChange={(v) => updateLinkedInTrm(index, 'TPE', { ...tpe, rollover: v as Rollover })} />
                            <CodeSel label="Occupation Type" value={tpe.occupationType} labelMap={OCCUPATION_LABELS} onChange={(v) => updateLinkedInTrm(index, 'TPE', { ...tpe, occupationType: v as OccupationType })} />
                            <CodeSel label="Life Buy Back" value={tpe.lifeBuyBack} labelMap={LIFE_BUY_BACK_TPE_LABELS} onChange={(v) => updateLinkedInTrm(index, 'TPE', { ...tpe, lifeBuyBack: v as LifeBuyBackTPE })} />
                            <CodeSel label="Double TPD" value={tpe.doubleTPD} labelMap={THREE_WAY_LABELS} onChange={(v) => updateLinkedInTrm(index, 'TPE', { ...tpe, doubleTPD: v as ThreeWay })} />
                            <CodeSel label="Premium Waiver" value={tpe.premiumWaiver} labelMap={PREMIUM_WAIVER_LABELS} onChange={(v) => updateLinkedInTrm(index, 'TPE', { ...tpe, premiumWaiver: v as PremiumWaiver })} />
                            {featuresButton('TPE', LINKED_NEED_LABELS.TPE)}
                          </div>
                        )}
                      </div>
                    );
                  }
                  if ('TRE' in ln) {
                    const tre = ln.TRE;
                    const lnKey = 'TRM-TRE';
                    const lnExp = expanded.has(lnKey);
                    return (
                      <div key="TRE" className="mt-3 ml-4 border-l-2 border-teal-300 pl-3">
                        <NeedCardHeader code="TRE" label={LINKED_NEED_LABELS.TRE} expanded={lnExp} onToggle={() => toggleExpanded(lnKey)} onRemove={() => removeLinkedFromTrm(index, 'TRE')} linked shortfallBadge={sf && <ShortfallBadge label="Trauma" value={sf.trauma} />} />
                        {lnExp && (
                          <div className="px-4 py-2 space-y-0.5">
                            <NumInp label="Sum Insured" value={tre.sumInsured} onChange={(v) => updateLinkedInTrm(index, 'TRE', { ...tre, sumInsured: v })} />
                            <CodeSel label="Structure" value={tre.structure} labelMap={STRUCTURE_4_LABELS} onChange={(v) => updateLinkedInTrm(index, 'TRE', { ...tre, structure: v as Structure4 })} />
                            <CodeSel label="Life Buy Back" value={tre.lifeBuyBack} labelMap={LIFE_BUY_BACK_TRE_LABELS} onChange={(v) => updateLinkedInTrm(index, 'TRE', { ...tre, lifeBuyBack: v as LifeBuyBackTRE })} />
                            <CodeSel label="Double Trauma" value={tre.doubleTrauma} labelMap={THREE_WAY_LABELS} onChange={(v) => updateLinkedInTrm(index, 'TRE', { ...tre, doubleTrauma: v as ThreeWay })} />
                            <CodeSel label="Trauma Reinstatement" value={tre.traumaReinstatement} labelMap={THREE_WAY_LABELS} onChange={(v) => updateLinkedInTrm(index, 'TRE', { ...tre, traumaReinstatement: v as ThreeWay })} />
                            <CodeSel label="Premium Waiver" value={tre.premiumWaiver} labelMap={PREMIUM_WAIVER_LABELS} onChange={(v) => updateLinkedInTrm(index, 'TRE', { ...tre, premiumWaiver: v as PremiumWaiver })} />
                            <CodeSel label="Baby Care" value={tre.babyCare} labelMap={FOUR_WAY_LABELS} onChange={(v) => updateLinkedInTrm(index, 'TRE', { ...tre, babyCare: v as FourWay })} />
                            <CodeSel label="Priority" value={tre.priority} labelMap={PRIORITY_LABELS} onChange={(v) => updateLinkedInTrm(index, 'TRE', { ...tre, priority: v as Priority })} />
                            {featuresButton('TRE', LINKED_NEED_LABELS.TRE)}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}

                {availableLinked.length > 0 && (
                  <div className="flex items-center gap-3 pt-3 ml-4">
                    {availableLinked.map((c) => (
                      <button
                        key={c}
                        className="flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 font-medium"
                        onClick={() => addLinkedToTrm(index, c)}
                      >
                        <Plus size={12} /> {LINKED_NEED_LABELS[c]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      case 'TPS': {
        const tps = (need as { TPS: TpsFields }).TPS;
        return (
          <div key={code} className="border border-gray-200 rounded">
            <NeedCardHeader code="TPS" label={NEED_CODE_LABELS.TPS} expanded={isExp} onToggle={() => toggleExpanded(code)} onRemove={() => removeNeed(index)} shortfallBadge={sf && <ShortfallBadge label="TPD" value={sf.tpd} />} />
            {isExp && (
              <div className="px-6 py-3 space-y-0.5">
                <NumInp label="Sum Insured" value={tps.sumInsured} onChange={(v) => updateNeed(index, { TPS: { ...tps, sumInsured: v } })} />
                <CodeSel label="Structure" value={tps.structure} labelMap={STRUCTURE_4_LABELS} onChange={(v) => updateNeed(index, { TPS: { ...tps, structure: v as Structure4 } })} />
                <SingleCodeSel label="Owner" value={tps.owner} labelMap={OWNER_TPE_LABELS} onChange={(v) => updateNeed(index, { TPS: { ...tps, owner: v } })} />
                <CodeSel label="Rollover" value={tps.rollover} labelMap={ROLLOVER_LABELS} onChange={(v) => updateNeed(index, { TPS: { ...tps, rollover: v as Rollover } })} />
                <CodeSel label="Occupation Type" value={tps.occupationType} labelMap={OCCUPATION_LABELS} onChange={(v) => updateNeed(index, { TPS: { ...tps, occupationType: v as OccupationType } })} />
                <CodeSel label="Premium Waiver" value={tps.premiumWaiver} labelMap={PREMIUM_WAIVER_LABELS} onChange={(v) => updateNeed(index, { TPS: { ...tps, premiumWaiver: v as PremiumWaiver } })} />
                {featuresButton('TPS', NEED_CODE_LABELS.TPS)}
              </div>
            )}
          </div>
        );
      }

      case 'TRS': {
        const trs = (need as { TRS: TrsFields }).TRS;
        const hasTpr = hasLinkedNeed(trs, 'TPR');

        return (
          <div key={code} className="border border-gray-200 rounded">
            <NeedCardHeader code="TRS" label={NEED_CODE_LABELS.TRS} expanded={isExp} onToggle={() => toggleExpanded(code)} onRemove={() => removeNeed(index)} shortfallBadge={sf && <ShortfallBadge label="Trauma" value={sf.trauma} />} />
            {isExp && (
              <div className="px-6 py-3">
                <div className="space-y-0.5">
                  <NumInp label="Sum Insured" value={trs.sumInsured} onChange={(v) => updateNeed(index, { TRS: { ...trs, sumInsured: v } })} />
                  <CodeSel label="Structure" value={trs.structure} labelMap={STRUCTURE_4_LABELS} onChange={(v) => updateNeed(index, { TRS: { ...trs, structure: v as Structure4 } })} />
                  <CodeSel label="Trauma Reinstatement" value={trs.traumaReinstatement} labelMap={THREE_WAY_LABELS} onChange={(v) => updateNeed(index, { TRS: { ...trs, traumaReinstatement: v as ThreeWay } })} />
                  <CodeSel label="Premium Waiver" value={trs.premiumWaiver} labelMap={PREMIUM_WAIVER_LABELS} onChange={(v) => updateNeed(index, { TRS: { ...trs, premiumWaiver: v as PremiumWaiver } })} />
                  <CodeSel label="Baby Care" value={trs.babyCare} labelMap={FOUR_WAY_LABELS} onChange={(v) => updateNeed(index, { TRS: { ...trs, babyCare: v as FourWay } })} />
                  <CodeSel label="Priority" value={trs.priority} labelMap={PRIORITY_LABELS} onChange={(v) => updateNeed(index, { TRS: { ...trs, priority: v as Priority } })} />
                  {featuresButton('TRS', NEED_CODE_LABELS.TRS)}
                </div>

                {/* Linked TPR */}
                {trs.linkedNeeds.map((ln) => {
                  if ('TPR' in ln) {
                    const tpr = ln.TPR;
                    const lnKey = 'TRS-TPR';
                    const lnExp = expanded.has(lnKey);
                    return (
                      <div key="TPR" className="mt-3 ml-4 border-l-2 border-teal-300 pl-3">
                        <NeedCardHeader code="TPR" label={LINKED_NEED_LABELS.TPR} expanded={lnExp} onToggle={() => toggleExpanded(lnKey)} onRemove={() => removeLinkedFromTrs(index)} linked shortfallBadge={sf && <ShortfallBadge label="TPD" value={sf.tpd} />} />
                        {lnExp && (
                          <div className="px-4 py-2 space-y-0.5">
                            <NumInp label="Sum Insured" value={tpr.sumInsured} onChange={(v) => updateLinkedInTrs(index, { ...tpr, sumInsured: v })} />
                            <CodeSel label="Structure" value={tpr.structure} labelMap={STRUCTURE_4_LABELS} onChange={(v) => updateLinkedInTrs(index, { ...tpr, structure: v as Structure4 })} />
                            <SingleCodeSel label="Owner" value={tpr.owner} labelMap={OWNER_INC_LABELS} onChange={(v) => updateLinkedInTrs(index, { ...tpr, owner: v })} />
                            <CodeSel label="Rollover" value={tpr.rollover} labelMap={ROLLOVER_LABELS} onChange={(v) => updateLinkedInTrs(index, { ...tpr, rollover: v as Rollover })} />
                            <CodeSel label="Occupation Type" value={tpr.occupationType} labelMap={OCCUPATION_LABELS} onChange={(v) => updateLinkedInTrs(index, { ...tpr, occupationType: v as OccupationType })} />
                            <CodeSel label="Premium Waiver" value={tpr.premiumWaiver} labelMap={PREMIUM_WAIVER_LABELS} onChange={(v) => updateLinkedInTrs(index, { ...tpr, premiumWaiver: v as PremiumWaiver })} />
                            {featuresButton('TPR', LINKED_NEED_LABELS.TPR)}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}

                {!hasTpr && (
                  <div className="pt-3 ml-4">
                    <button
                      className="flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 font-medium"
                      onClick={() => addLinkedToTrs(index)}
                    >
                      <Plus size={12} /> {LINKED_NEED_LABELS.TPR}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      case 'INC': {
        const inc = (need as { INC: IncFields }).INC;
        return (
          <div key={code} className="border border-gray-200 rounded">
            <NeedCardHeader code="INC" label={NEED_CODE_LABELS.INC} expanded={isExp} onToggle={() => toggleExpanded(code)} onRemove={() => removeNeed(index)} shortfallBadge={sf && <ShortfallBadge label="IP" value={sf.incomeProtection} monthly />} />
            {isExp && (
              <div className="px-6 py-3 space-y-0.5">
                <NumInp label="Monthly Benefit" value={inc.monthlyBenefit} onChange={(v) => updateNeed(index, { INC: { ...inc, monthlyBenefit: v } })} />
                <NumInp label="Super Contribution" value={inc.superContributionOption} onChange={(v) => updateNeed(index, { INC: { ...inc, superContributionOption: v } })} />
                <CodeSel label="Structure" value={inc.structure} labelMap={STRUCTURE_3_LABELS} onChange={(v) => updateNeed(index, { INC: { ...inc, structure: v as Structure3 } })} />
                <SingleCodeSel label="Owner" value={inc.owner} labelMap={OWNER_INC_LABELS} onChange={(v) => updateNeed(index, { INC: { ...inc, owner: v } })} />
                <CodeSel label="Rollover" value={inc.rollover} labelMap={ROLLOVER_LABELS} onChange={(v) => updateNeed(index, { INC: { ...inc, rollover: v as Rollover } })} />
                <CodeSel label="Agreed Value" value={inc.agreedValue} labelMap={AGREED_VALUE_LABELS} onChange={(v) => updateNeed(index, { INC: { ...inc, agreedValue: v as AgreedValue } })} />
                <CodeSel label="Accident Benefit" value={inc.accidentBenefit} labelMap={FOUR_WAY_LABELS} onChange={(v) => updateNeed(index, { INC: { ...inc, accidentBenefit: v as FourWay } })} />
                <CodeSel label="Increase Claim Benefit" value={inc.increaseClaimBenefit} labelMap={FOUR_WAY_LABELS} onChange={(v) => updateNeed(index, { INC: { ...inc, increaseClaimBenefit: v as FourWay } })} />
                <CodeSel label="Waiting Period" value={resolveFieldValue(inc.waitingPeriod, '30' as WaitingPeriodINC)} labelMap={WAITING_INC_LABELS} onChange={(v) => updateNeed(index, { INC: { ...inc, waitingPeriod: v as WaitingPeriodINC } })} />
                <CodeSel label="Benefit Period" value={resolveFieldValue(inc.benefitPeriod, '65' as BenefitPeriodINC)} labelMap={BENEFIT_INC_LABELS} onChange={(v) => updateNeed(index, { INC: { ...inc, benefitPeriod: v as BenefitPeriodINC } })} />
                <CodeSel label="Replacement Ratio" value={inc.initialReplacementRatio} labelMap={REPLACEMENT_RATIO_LABELS} onChange={(v) => updateNeed(index, { INC: { ...inc, initialReplacementRatio: v as ReplacementRatio } })} />
                <CodeSel label="Priority" value={inc.priority} labelMap={PRIORITY_LABELS} onChange={(v) => updateNeed(index, { INC: { ...inc, priority: v as Priority } })} />
                {featuresButton('INC', NEED_CODE_LABELS.INC)}
              </div>
            )}
          </div>
        );
      }

      case 'BUS': {
        const bus = (need as { BUS: BusFields }).BUS;
        return (
          <div key={code} className="border border-gray-200 rounded">
            <NeedCardHeader code="BUS" label={NEED_CODE_LABELS.BUS} expanded={isExp} onToggle={() => toggleExpanded(code)} onRemove={() => removeNeed(index)} shortfallBadge={sf && <ShortfallBadge label="BE" value={sf.businessExpenses} monthly />} />
            {isExp && (
              <div className="px-6 py-3 space-y-0.5">
                <NumInp label="Monthly Benefit" value={bus.monthlyBenefit} onChange={(v) => updateNeed(index, { BUS: { ...bus, monthlyBenefit: v } })} />
                <CodeSel label="Structure" value={bus.structure} labelMap={STRUCTURE_3_LABELS} onChange={(v) => updateNeed(index, { BUS: { ...bus, structure: v as Structure3 } })} />
                <CodeSel label="Waiting Period" value={bus.waitingPeriod} labelMap={WAITING_BUS_LABELS} onChange={(v) => updateNeed(index, { BUS: { ...bus, waitingPeriod: v as WaitingPeriodBUS } })} />
                <div className="flex items-center justify-between gap-3 py-1">
                  <label className="text-xs text-slate-600 shrink-0">Benefit Period</label>
                  <span className="text-xs text-slate-500 w-[200px]">1 year (fixed)</span>
                </div>
                {featuresButton('BUS', NEED_CODE_LABELS.BUS)}
              </div>
            )}
          </div>
        );
      }

      case 'NES': {
        const nes = (need as { NES: NesFields }).NES;
        return (
          <div key={code} className="border border-gray-200 rounded">
            <NeedCardHeader code="NES" label={NEED_CODE_LABELS.NES} expanded={isExp} onToggle={() => toggleExpanded(code)} onRemove={() => removeNeed(index)} />
            {isExp && (
              <div className="px-6 py-3 space-y-0.5">
                <NumInp label="Sum Insured" value={nes.sumInsured} onChange={(v) => updateNeed(index, { NES: { ...nes, sumInsured: v } })} />
                <CodeSel label="Structure" value={nes.structure} labelMap={STRUCTURE_2_LABELS} onChange={(v) => updateNeed(index, { NES: { ...nes, structure: v as Structure2 } })} />
                {featuresButton('NES', NEED_CODE_LABELS.NES)}
              </div>
            )}
          </div>
        );
      }

      case 'CHT': {
        const cht = (need as { CHT: ChtFields }).CHT;

        function updateCht(patch: Partial<ChtFields>) {
          updateNeed(index, { CHT: { ...cht, ...patch } });
        }
        function addChild() {
          updateCht({ children: [...cht.children, { sumInsured: 0, gender: 'M', dateOfBirth: todayISO() }] });
        }
        function updateChild(childIdx: number, patch: Partial<ChtChild>) {
          updateCht({ children: cht.children.map((c, i) => i === childIdx ? { ...c, ...patch } : c) });
        }
        function removeChild(childIdx: number) {
          updateCht({ children: cht.children.filter((_, i) => i !== childIdx) });
        }

        return (
          <div key={code} className="border border-gray-200 rounded">
            <NeedCardHeader code="CHT" label={NEED_CODE_LABELS.CHT} expanded={isExp} onToggle={() => toggleExpanded(code)} onRemove={() => removeNeed(index)} />
            {isExp && (
              <div className="px-6 py-3">
                {cht.children.length === 0 && (
                  <div className="text-xs text-slate-400 py-1">No children added. Max 9.</div>
                )}
                {cht.children.map((child, idx) => (
                  <div key={idx} className="border border-gray-200 rounded p-3 mb-2 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700">Child {idx + 1}</span>
                      <button className="text-slate-400 hover:text-red-500" onClick={() => removeChild(idx)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="space-y-0.5">
                      <NumInp label="Sum Insured" value={child.sumInsured} onChange={(v) => updateChild(idx, { sumInsured: v })} />
                      <DateInp label="Date of Birth" value={child.dateOfBirth ?? todayISO()} onChange={(v) => updateChild(idx, { dateOfBirth: v })} />
                      <AgeDisplay label="Age" dob={child.dateOfBirth ?? todayISO()} />
                      <CodeSel label="Gender" value={child.gender} labelMap={GENDER_LABELS} onChange={(v) => updateChild(idx, { gender: v as Gender })} />
                    </div>
                  </div>
                ))}
                {cht.children.length < 9 && (
                  <button className="flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 font-medium py-1" onClick={addChild}>
                    <Plus size={12} /> Add Child
                  </button>
                )}
                {featuresButton('CHT', NEED_CODE_LABELS.CHT)}
              </div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  }

  // ── Main render ───────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-700 text-white">
        <button onClick={onCancel} className="hover:text-white/80">
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-sm font-bold">Needs Editor</h2>
        <span className="text-xs text-white/70">— {draft.name || 'Untitled'}</span>
      </div>

      {/* Quote metadata bar */}
      <div className="px-8 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-6 flex-wrap">
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
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">Super Frequency</label>
            <select
              className="border border-slate-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
              value={draft.superFrequency}
              onChange={(e) => setDraft((d) => ({ ...d, superFrequency: e.target.value as QuoteFrequency }))}
            >
              {FREQ_OPTIONS.map((f) => <option key={f.code} value={f.code}>{f.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">Non-Super Frequency</label>
            <select
              className="border border-slate-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
              value={draft.nonSuperFrequency}
              onChange={(e) => setDraft((d) => ({ ...d, nonSuperFrequency: e.target.value as QuoteFrequency }))}
            >
              {FREQ_OPTIONS.map((f) => <option key={f.code} value={f.code}>{f.label}</option>)}
            </select>
          </div>
          <NeedPicker existingCodes={existingCodes} onAdd={addNeed} />
        </div>
      </div>

      {/* Needs cards */}
      <div className="flex-1 px-8 py-5 space-y-2">
        {draft.needs.length === 0 && (
          <div className="text-center py-12 text-sm text-slate-400">
            No needs configured. Click "Add Need" to begin.
          </div>
        )}
        {draft.needs.map((need, index) => renderNeedCard(need, index))}
      </div>

      {/* JSON preview */}
      {showJson && (
        <div className="border-t border-gray-200 bg-gray-900 text-green-400 p-4 max-h-80 overflow-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400">Serialised needs[] payload</span>
            <button
              className="text-xs text-gray-500 hover:text-gray-300"
              onClick={() => navigator.clipboard.writeText(JSON.stringify(serialiseNeeds(draft.needs), null, 2))}
            >
              Copy
            </button>
          </div>
          <pre className="text-xs font-mono whitespace-pre-wrap">
            {JSON.stringify(serialiseNeeds(draft.needs), null, 2)}
          </pre>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-8 py-4 border-t border-gray-200 bg-gray-50">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-8"
          onClick={() => setShowJson(!showJson)}
        >
          {showJson ? 'Hide JSON' : 'Preview JSON'}
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button className="bg-teal-700 hover:bg-teal-800 text-white px-6" onClick={() => onSave(draft)}>
            Save Quote
          </Button>
        </div>
      </div>

      {featuresModal && (
        <RequiredFeaturesModal
          needCode={featuresModal.needCode}
          label={featuresModal.label}
          selected={draft.requiredFeatures[featuresModal.needCode] ?? []}
          onSave={(sel) => updateRequiredFeatures(featuresModal.needCode, sel)}
          onClose={() => setFeaturesModal(null)}
        />
      )}
    </div>
  );
}
