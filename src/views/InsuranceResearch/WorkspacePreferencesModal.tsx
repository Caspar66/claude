import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSuppliers } from '@/hooks/useSuppliers';
import type { CommissionChoice } from '@/services/omnilifeApi';
import type { WorkspacePreferences } from './needsTypes';
import {
  getDefaultPreferences,
  STRUCTURE_4_LABELS, STRUCTURE_3_LABELS, STRUCTURE_2_LABELS,
  OWNER_TRM_LABELS, OWNER_TPE_LABELS, OWNER_INC_LABELS,
  ROLLOVER_LABELS, PREMIUM_WAIVER_LABELS, OCCUPATION_LABELS,
  LIFE_BUY_BACK_TPE_LABELS, LIFE_BUY_BACK_TRE_LABELS,
  THREE_WAY_LABELS, FOUR_WAY_LABELS, PRIORITY_LABELS,
  AGREED_VALUE_LABELS, WAITING_INC_LABELS, WAITING_BUS_LABELS,
  BENEFIT_INC_LABELS, REPLACEMENT_RATIO_LABELS,
} from './needsTypes';

const FREQ_LABELS: Record<string, string> = {
  W: 'Weekly', F: 'Fortnightly', M: 'Monthly', Q: 'Quarterly', H: 'Half Yearly', Y: 'Yearly',
};

type TabKey = 'general' | 'globalOptions' | 'commissions' | 'trm' | 'tpe' | 'tre' | 'tps' | 'trs' | 'tpr' | 'inc' | 'bus' | 'nes';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'globalOptions', label: 'Global Options' },
  { key: 'commissions', label: 'Commissions' },
  { key: 'trm', label: 'Life' },
  { key: 'tpe', label: 'TPD Extension' },
  { key: 'tre', label: 'Trauma Extension' },
  { key: 'tps', label: 'TPD Standalone' },
  { key: 'trs', label: 'Trauma Standalone' },
  { key: 'tpr', label: 'TPD Ext. to Trauma' },
  { key: 'inc', label: 'Income Protection' },
  { key: 'bus', label: 'Business Expenses' },
  { key: 'nes', label: 'Needle Stick' },
];

interface Props {
  prefs: WorkspacePreferences;
  onSave: (prefs: WorkspacePreferences) => void;
  onClose: () => void;
}

function Sel<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Record<string, string>; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-xs text-slate-700">{label}</span>
      <select
        className="border border-slate-300 rounded px-2 py-1 text-xs bg-white w-[200px]"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    </div>
  );
}

export function WorkspacePreferencesModal({ prefs, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<WorkspacePreferences>(JSON.parse(JSON.stringify(prefs)));
  const [tab, setTab] = useState<TabKey>('general');

  function update<K extends keyof WorkspacePreferences>(section: K, patch: Partial<WorkspacePreferences[K]>) {
    setDraft((d) => ({ ...d, [section]: { ...d[section], ...patch } }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-xl w-[720px] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-slate-50 rounded-t-lg">
          <h3 className="text-sm font-bold text-slate-800">Workspace Preferences</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Tab sidebar */}
          <div className="w-48 border-r border-gray-200 bg-gray-50 overflow-auto shrink-0">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`w-full text-left px-4 py-2.5 text-xs font-medium ${tab === t.key ? 'text-blue-700 bg-blue-50 border-r-2 border-blue-700' : 'text-slate-600 hover:bg-gray-100'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto px-5 py-4">
            {tab === 'general' && (
              <>
                <Sel label="Super Frequency" value={draft.general.superFrequency} options={FREQ_LABELS} onChange={(v) => update('general', { superFrequency: v as WorkspacePreferences['general']['superFrequency'] })} />
                <Sel label="Non-Super Frequency" value={draft.general.nonSuperFrequency} options={FREQ_LABELS} onChange={(v) => update('general', { nonSuperFrequency: v as WorkspacePreferences['general']['nonSuperFrequency'] })} />
              </>
            )}

            {tab === 'globalOptions' && (
              <GlobalOptionsTab draft={draft} onChange={setDraft} />
            )}

            {tab === 'commissions' && (
              <CommissionsTab draft={draft} onChange={setDraft} />
            )}

            {tab === 'trm' && (
              <>
                <Sel label="Structure" value={draft.trm.structure} options={STRUCTURE_4_LABELS} onChange={(v) => update('trm', { structure: v })} />
                <Sel label="Owner" value={draft.trm.owner} options={OWNER_TRM_LABELS} onChange={(v) => update('trm', { owner: v })} />
                <Sel label="Rollover" value={draft.trm.rollover} options={ROLLOVER_LABELS} onChange={(v) => update('trm', { rollover: v })} />
                <Sel label="Premium Waiver" value={draft.trm.premiumWaiver} options={PREMIUM_WAIVER_LABELS} onChange={(v) => update('trm', { premiumWaiver: v })} />
              </>
            )}

            {tab === 'tpe' && (
              <>
                <Sel label="Structure" value={draft.tpe.structure} options={STRUCTURE_4_LABELS} onChange={(v) => update('tpe', { structure: v })} />
                <Sel label="Owner" value={draft.tpe.owner} options={OWNER_TPE_LABELS} onChange={(v) => update('tpe', { owner: v })} />
                <Sel label="Rollover" value={draft.tpe.rollover} options={ROLLOVER_LABELS} onChange={(v) => update('tpe', { rollover: v })} />
                <Sel label="Occupation Type" value={draft.tpe.occupationType} options={OCCUPATION_LABELS} onChange={(v) => update('tpe', { occupationType: v })} />
                <Sel label="Life Buy Back" value={draft.tpe.lifeBuyBack} options={LIFE_BUY_BACK_TPE_LABELS} onChange={(v) => update('tpe', { lifeBuyBack: v })} />
                <Sel label="Double TPD" value={draft.tpe.doubleTPD} options={THREE_WAY_LABELS} onChange={(v) => update('tpe', { doubleTPD: v })} />
                <Sel label="Premium Waiver" value={draft.tpe.premiumWaiver} options={PREMIUM_WAIVER_LABELS} onChange={(v) => update('tpe', { premiumWaiver: v })} />
              </>
            )}

            {tab === 'tre' && (
              <>
                <Sel label="Structure" value={draft.tre.structure} options={STRUCTURE_4_LABELS} onChange={(v) => update('tre', { structure: v })} />
                <Sel label="Life Buy Back" value={draft.tre.lifeBuyBack} options={LIFE_BUY_BACK_TRE_LABELS} onChange={(v) => update('tre', { lifeBuyBack: v })} />
                <Sel label="Double Trauma" value={draft.tre.doubleTrauma} options={THREE_WAY_LABELS} onChange={(v) => update('tre', { doubleTrauma: v })} />
                <Sel label="Trauma Reinstatement" value={draft.tre.traumaReinstatement} options={THREE_WAY_LABELS} onChange={(v) => update('tre', { traumaReinstatement: v })} />
                <Sel label="Premium Waiver" value={draft.tre.premiumWaiver} options={PREMIUM_WAIVER_LABELS} onChange={(v) => update('tre', { premiumWaiver: v })} />
                <Sel label="Baby Care" value={draft.tre.babyCare} options={FOUR_WAY_LABELS} onChange={(v) => update('tre', { babyCare: v })} />
                <Sel label="Priority" value={draft.tre.priority} options={PRIORITY_LABELS} onChange={(v) => update('tre', { priority: v })} />
              </>
            )}

            {tab === 'tps' && (
              <>
                <Sel label="Structure" value={draft.tps.structure} options={STRUCTURE_4_LABELS} onChange={(v) => update('tps', { structure: v })} />
                <Sel label="Owner" value={draft.tps.owner} options={OWNER_TPE_LABELS} onChange={(v) => update('tps', { owner: v })} />
                <Sel label="Rollover" value={draft.tps.rollover} options={ROLLOVER_LABELS} onChange={(v) => update('tps', { rollover: v })} />
                <Sel label="Occupation Type" value={draft.tps.occupationType} options={OCCUPATION_LABELS} onChange={(v) => update('tps', { occupationType: v })} />
                <Sel label="Premium Waiver" value={draft.tps.premiumWaiver} options={PREMIUM_WAIVER_LABELS} onChange={(v) => update('tps', { premiumWaiver: v })} />
              </>
            )}

            {tab === 'trs' && (
              <>
                <Sel label="Structure" value={draft.trs.structure} options={STRUCTURE_4_LABELS} onChange={(v) => update('trs', { structure: v })} />
                <Sel label="Trauma Reinstatement" value={draft.trs.traumaReinstatement} options={THREE_WAY_LABELS} onChange={(v) => update('trs', { traumaReinstatement: v })} />
                <Sel label="Premium Waiver" value={draft.trs.premiumWaiver} options={PREMIUM_WAIVER_LABELS} onChange={(v) => update('trs', { premiumWaiver: v })} />
                <Sel label="Baby Care" value={draft.trs.babyCare} options={FOUR_WAY_LABELS} onChange={(v) => update('trs', { babyCare: v })} />
                <Sel label="Priority" value={draft.trs.priority} options={PRIORITY_LABELS} onChange={(v) => update('trs', { priority: v })} />
              </>
            )}

            {tab === 'tpr' && (
              <>
                <Sel label="Structure" value={draft.tpr.structure} options={STRUCTURE_4_LABELS} onChange={(v) => update('tpr', { structure: v })} />
                <Sel label="Owner" value={draft.tpr.owner} options={OWNER_INC_LABELS} onChange={(v) => update('tpr', { owner: v })} />
                <Sel label="Rollover" value={draft.tpr.rollover} options={ROLLOVER_LABELS} onChange={(v) => update('tpr', { rollover: v })} />
                <Sel label="Occupation Type" value={draft.tpr.occupationType} options={OCCUPATION_LABELS} onChange={(v) => update('tpr', { occupationType: v })} />
                <Sel label="Premium Waiver" value={draft.tpr.premiumWaiver} options={PREMIUM_WAIVER_LABELS} onChange={(v) => update('tpr', { premiumWaiver: v })} />
              </>
            )}

            {tab === 'inc' && (
              <>
                <Sel label="Structure" value={draft.inc.structure} options={STRUCTURE_3_LABELS} onChange={(v) => update('inc', { structure: v })} />
                <Sel label="Owner" value={draft.inc.owner} options={OWNER_INC_LABELS} onChange={(v) => update('inc', { owner: v })} />
                <Sel label="Rollover" value={draft.inc.rollover} options={ROLLOVER_LABELS} onChange={(v) => update('inc', { rollover: v })} />
                <Sel label="Agreed Value" value={draft.inc.agreedValue} options={AGREED_VALUE_LABELS} onChange={(v) => update('inc', { agreedValue: v })} />
                <Sel label="Accident Benefit" value={draft.inc.accidentBenefit} options={FOUR_WAY_LABELS} onChange={(v) => update('inc', { accidentBenefit: v })} />
                <Sel label="Increase Claim Benefit" value={draft.inc.increaseClaimBenefit} options={FOUR_WAY_LABELS} onChange={(v) => update('inc', { increaseClaimBenefit: v })} />
                <Sel label="Waiting Period" value={draft.inc.waitingPeriod} options={WAITING_INC_LABELS} onChange={(v) => update('inc', { waitingPeriod: v })} />
                <Sel label="Benefit Period" value={draft.inc.benefitPeriod} options={BENEFIT_INC_LABELS} onChange={(v) => update('inc', { benefitPeriod: v })} />
                <Sel label="Replacement Ratio" value={draft.inc.initialReplacementRatio} options={REPLACEMENT_RATIO_LABELS} onChange={(v) => update('inc', { initialReplacementRatio: v })} />
                <Sel label="Priority" value={draft.inc.priority} options={PRIORITY_LABELS} onChange={(v) => update('inc', { priority: v })} />
              </>
            )}

            {tab === 'bus' && (
              <>
                <Sel label="Structure" value={draft.bus.structure} options={STRUCTURE_3_LABELS} onChange={(v) => update('bus', { structure: v })} />
                <Sel label="Waiting Period" value={draft.bus.waitingPeriod} options={WAITING_BUS_LABELS} onChange={(v) => update('bus', { waitingPeriod: v })} />
              </>
            )}

            {tab === 'nes' && (
              <Sel label="Structure" value={draft.nes.structure} options={STRUCTURE_2_LABELS} onChange={(v) => update('nes', { structure: v })} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-slate-50 rounded-b-lg">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => setDraft(getDefaultPreferences())}>
            Reset to Defaults
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>Cancel</Button>
            <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs" onClick={() => onSave(draft)}>Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Global Options tab ──────────────────────────────────────────────────────

const PROJECTION_OPTIONS: Record<string, string> = {
  '3': '3 Years', '5': '5 Years', '10': '10 Years', '15': '15 Years', '20': '20 Years',
};

const APL_OPTIONS: Record<string, string> = { adviser: 'Adviser', user: 'User' };
const MIN_COMM_OPTIONS: Record<string, string> = { no: 'No', yes: 'Yes' };

function GlobalOptionsTab({ draft, onChange }: { draft: WorkspacePreferences; onChange: (d: WorkspacePreferences) => void }) {
  const s = draft.scenario;

  function patch(p: Partial<WorkspacePreferences['scenario']>) {
    onChange({ ...draft, scenario: { ...s, ...p } });
  }

  return (
    <>
      <Sel label="Premium Projection Duration" value={s.projectionYears} options={PROJECTION_OPTIONS} onChange={(v) => patch({ projectionYears: v })} />
      <div className="flex items-center justify-between py-2 border-b border-gray-100">
        <span className="text-xs text-slate-700">Indexation</span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            className="border border-slate-300 rounded px-2 py-1 text-xs bg-white w-[80px] text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={s.indexationRate}
            onChange={(e) => patch({ indexationRate: parseFloat(e.target.value) || 0 })}
          />
          <span className="text-xs text-slate-500">%</span>
        </div>
      </div>
      <Sel label="Approved Product List" value={s.aplSource} options={APL_OPTIONS} onChange={(v) => patch({ aplSource: v as 'adviser' | 'user' })} />
      <Sel label="Minimum Commission Preference" value={s.minimumCommission ? 'yes' : 'no'} options={MIN_COMM_OPTIONS} onChange={(v) => patch({ minimumCommission: v === 'yes' })} />
    </>
  );
}

// ── Commissions tab ─────────────────────────────────────────────────────────

function formatCommLabel(c: CommissionChoice): string {
  const name = c.name || c.code;
  if (c.structure && c.upfrontPercentage !== undefined && c.ongoingPercentage !== undefined) {
    return `${c.structure} (${Math.round(c.upfrontPercentage)}% / ${Math.round(c.ongoingPercentage)}%): ${name}`;
  }
  return name;
}

function CommissionsTab({ draft, onChange }: { draft: WorkspacePreferences; onChange: (d: WorkspacePreferences) => void }) {
  const { suppliers, loading, error } = useSuppliers();
  const [initialised, setInitialised] = useState(false);
  const isMinimum = draft.scenario.minimumCommission;

  useEffect(() => {
    if (initialised || suppliers.length === 0) return;
    const hasExisting = Object.keys(draft.scenario.commissionBySupplier).length > 0;
    if (!hasExisting) {
      const seed: Record<string, string> = {};
      for (const s of suppliers) {
        if (s.defaultCommissionCode) seed[s.code] = s.defaultCommissionCode;
      }
      onChange({ ...draft, scenario: { ...draft.scenario, commissionBySupplier: seed } });
    }
    setInitialised(true);
  }, [suppliers, initialised, draft, onChange]);

  useEffect(() => {
    if (!isMinimum || suppliers.length === 0) return;
    const updated: Record<string, string> = { ...draft.scenario.commissionBySupplier };
    let changed = false;
    for (const s of suppliers) {
      const choices = s.commissionOptions?.length ? s.commissionOptions : s.defaultCommissionCode ? [{ code: s.defaultCommissionCode, name: s.defaultCommissionCode }] : [];
      const minCode = choices.find((c) => c.upfrontPercentage === 0 && c.ongoingPercentage === 0)?.code
        ?? (s.minimumCommissionCode || undefined);
      if (minCode && updated[s.code] !== minCode) {
        updated[s.code] = minCode;
        changed = true;
      }
    }
    if (changed) onChange({ ...draft, scenario: { ...draft.scenario, commissionBySupplier: updated } });
  }, [isMinimum, suppliers]);

  function updateCommission(supplierCode: string, commCode: string) {
    if (isMinimum) return;
    onChange({ ...draft, scenario: { ...draft.scenario, commissionBySupplier: { ...draft.scenario.commissionBySupplier, [supplierCode]: commCode } } });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-xs text-slate-400">
        <Loader2 size={14} className="animate-spin" /> Loading commission options…
      </div>
    );
  }

  if (error) {
    return <div className="px-4 py-3 text-xs text-amber-700 bg-amber-50">Could not load suppliers — {error}</div>;
  }

  return (
    <div>
      {isMinimum && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-700">
          Minimum Commission Preference is enabled — all providers set to minimum (0%) commission.
        </div>
      )}
      <div className="grid grid-cols-[140px_1fr_90px_90px] gap-2 px-4 py-2 border-b border-gray-200 bg-gray-50 text-xs font-bold text-slate-600">
        <div>Provider</div>
        <div>Commission Structure</div>
        <div className="text-center">Initial</div>
        <div className="text-center">Renewal</div>
      </div>
      {suppliers.map((s) => {
        const choices = s.commissionOptions?.length ? s.commissionOptions : s.defaultCommissionCode ? [{ code: s.defaultCommissionCode, name: s.defaultCommissionCode }] : [];
        const selectedCode = draft.scenario.commissionBySupplier[s.code] ?? s.defaultCommissionCode ?? '';
        const selected = choices.find((c) => c.code === selectedCode);
        return (
          <div key={s.code} className={`grid grid-cols-[140px_1fr_90px_90px] gap-2 px-4 py-2 border-b border-gray-100 items-center ${isMinimum ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-2">
              {s.logo ? (
                <img src={s.logo} alt={s.name} className="w-8 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <span className="text-xs font-bold text-slate-700">{s.name.slice(0, 4)}</span>
              )}
              <span className="text-xs font-medium text-slate-700 truncate">{s.name}</span>
            </div>
            <select
              className={`border border-slate-300 rounded px-2 py-1 text-xs w-full max-w-[260px] focus:outline-none focus:ring-1 focus:ring-blue-500 ${isMinimum ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              value={selectedCode}
              onChange={(e) => updateCommission(s.code, e.target.value)}
              disabled={isMinimum}
            >
              {choices.map((c) => <option key={c.code} value={c.code}>{formatCommLabel(c)}</option>)}
              {choices.length === 0 && <option value="">No options</option>}
            </select>
            <div className="text-center text-[10px] text-slate-600">
              {selected?.upfrontPercentage !== undefined ? `${selected.upfrontPercentage.toFixed(2)}%` : '—'}
            </div>
            <div className="text-center text-[10px] text-slate-600">
              {selected?.ongoingPercentage !== undefined ? `${selected.ongoingPercentage.toFixed(2)}%` : '—'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
