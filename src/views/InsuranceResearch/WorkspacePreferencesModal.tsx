import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

type TabKey = 'general' | 'trm' | 'tpe' | 'tre' | 'tps' | 'trs' | 'tpr' | 'inc' | 'bus' | 'nes';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'general', label: 'General' },
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
