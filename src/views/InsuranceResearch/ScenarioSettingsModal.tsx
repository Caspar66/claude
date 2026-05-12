import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Check } from 'lucide-react';
import { useSuppliers } from '@/hooks/useSuppliers';
import type { CommissionChoice, CampaignOption } from '@/services/omnilifeApi';

function formatCommissionLabel(c: CommissionChoice): string {
  const name = c.name || c.code;
  if (c.structure && c.upfrontPercentage !== undefined && c.ongoingPercentage !== undefined) {
    return `${c.structure} (${Math.round(c.upfrontPercentage)}% / ${Math.round(c.ongoingPercentage)}%): ${name}`;
  }
  return name;
}

export interface ScenarioSettings {
  projectionYears: string;
  indexationRate: number;
  aplSource: 'adviser' | 'user';
  commissionBySupplier: Record<string, string>;
  campaignBySupplier: Record<string, string[]>;
}

export function getDefaultScenarioSettings(): ScenarioSettings {
  return {
    projectionYears: '15',
    indexationRate: 0,
    aplSource: 'adviser',
    commissionBySupplier: {},
    campaignBySupplier: {},
  };
}

type SettingsTab = 'global' | 'commissions' | 'campaigns';

interface Props {
  open: boolean;
  settings: ScenarioSettings;
  onSave: (settings: ScenarioSettings) => void;
  onClose: () => void;
}

export function ScenarioSettingsModal({ open, settings, onSave, onClose }: Props) {
  const [tab, setTab] = useState<SettingsTab>('global');
  const [draft, setDraft] = useState<ScenarioSettings>({ ...settings });

  useEffect(() => {
    if (open) {
      const campaignCopy: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(settings.campaignBySupplier)) campaignCopy[k] = [...v];
      setDraft({ ...settings, commissionBySupplier: { ...settings.commissionBySupplier }, campaignBySupplier: campaignCopy });
    }
  }, [open, settings]);

  function handleSave() {
    onSave(draft);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[700px] w-full p-0 overflow-hidden" style={{ height: '70vh', maxHeight: '70vh' }}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-900 text-white">
            <h3 className="text-sm font-bold">Scenario Settings</h3>
            <button className="text-white/70 hover:text-white" onClick={onClose}><X size={16} /></button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-slate-50 px-2 pt-2">
            <button
              className={`px-3 py-2 text-xs font-medium rounded-t transition-colors ${
                tab === 'global'
                  ? 'bg-white text-teal-700 border border-gray-200 border-b-white -mb-px z-10'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-gray-100'
              }`}
              onClick={() => setTab('global')}
            >
              Global Options
            </button>
            <button
              className={`px-3 py-2 text-xs font-medium rounded-t transition-colors ${
                tab === 'commissions'
                  ? 'bg-white text-teal-700 border border-gray-200 border-b-white -mb-px z-10'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-gray-100'
              }`}
              onClick={() => setTab('commissions')}
            >
              Commissions
            </button>
            <button
              className={`px-3 py-2 text-xs font-medium rounded-t transition-colors ${
                tab === 'campaigns'
                  ? 'bg-white text-teal-700 border border-gray-200 border-b-white -mb-px z-10'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-gray-100'
              }`}
              onClick={() => setTab('campaigns')}
            >
              Campaigns
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {tab === 'global' && (
              <GlobalOptionsPanel draft={draft} onChange={setDraft} />
            )}
            {tab === 'commissions' && (
              <CommissionsPanel draft={draft} onChange={setDraft} />
            )}
            {tab === 'campaigns' && (
              <CampaignsPanel draft={draft} onChange={setDraft} />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-200 bg-gray-50">
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={onClose}>Cancel</Button>
            <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-7" onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Global Options tab ─────────────────────────────────────────────────────

const PROJECTION_OPTIONS = ['3', '5', '10', '15', '20'];

function GlobalOptionsPanel({ draft, onChange }: { draft: ScenarioSettings; onChange: (d: ScenarioSettings) => void }) {
  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 block">Premium Projection Duration</label>
          <span className="text-[10px] text-slate-400">Number of years for premium projections</span>
        </div>
        <select
          className="border border-slate-300 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 w-[120px]"
          value={draft.projectionYears}
          onChange={(e) => onChange({ ...draft, projectionYears: e.target.value })}
        >
          {PROJECTION_OPTIONS.map((y) => (
            <option key={y} value={y}>{y} Years</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 block">Indexation</label>
          <span className="text-[10px] text-slate-400">Annual indexation rate applied to premiums</span>
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            className="border border-slate-300 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 w-[80px] text-right"
            value={draft.indexationRate}
            onChange={(e) => onChange({ ...draft, indexationRate: parseFloat(e.target.value) || 0 })}
          />
          <span className="text-xs text-slate-500">%</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 block">Approved Product List</label>
          <span className="text-[10px] text-slate-400">Which APL to use for quoting</span>
        </div>
        <select
          className="border border-slate-300 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 w-[120px]"
          value={draft.aplSource}
          onChange={(e) => onChange({ ...draft, aplSource: e.target.value as 'adviser' | 'user' })}
        >
          <option value="adviser">Adviser</option>
          <option value="user">User</option>
        </select>
      </div>
    </div>
  );
}

// ── Commissions tab ────────────────────────────────────────────────────────

interface CommRow {
  code: string;
  name: string;
  logo?: string;
  choices: CommissionChoice[];
  defaultCode: string;
}

function CommissionsPanel({ draft, onChange }: { draft: ScenarioSettings; onChange: (d: ScenarioSettings) => void }) {
  const { suppliers, loading, error } = useSuppliers();
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    if (initialised || suppliers.length === 0) return;
    const hasExisting = Object.keys(draft.commissionBySupplier).length > 0;
    if (!hasExisting) {
      const seed: Record<string, string> = {};
      for (const s of suppliers) {
        if (s.defaultCommissionCode) seed[s.code] = s.defaultCommissionCode;
      }
      onChange({ ...draft, commissionBySupplier: seed });
    }
    setInitialised(true);
  }, [suppliers, initialised, draft, onChange]);

  const rows: CommRow[] = suppliers.map((s) => {
    const choices = s.commissionOptions && s.commissionOptions.length > 0
      ? s.commissionOptions
      : s.defaultCommissionCode
        ? [{ code: s.defaultCommissionCode, name: s.defaultCommissionCode }]
        : [];
    return { code: s.code, name: s.name, logo: s.logo, choices, defaultCode: s.defaultCommissionCode ?? '' };
  });

  function updateCommission(supplierCode: string, commCode: string) {
    onChange({ ...draft, commissionBySupplier: { ...draft.commissionBySupplier, [supplierCode]: commCode } });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-xs text-slate-400">
        <Loader2 size={14} className="animate-spin" /> Loading commission options…
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 text-xs text-amber-700 bg-amber-50">
        Could not load suppliers — {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header row */}
      <div className="grid grid-cols-[140px_1fr_100px_100px] gap-2 px-4 py-2 border-b border-gray-200 bg-gray-50 text-xs font-bold text-slate-600">
        <div>Provider</div>
        <div>Commission Structure</div>
        <div className="text-center">Initial</div>
        <div className="text-center">Renewal</div>
      </div>

      {/* Supplier rows */}
      {rows.map((row) => {
        const selectedCode = draft.commissionBySupplier[row.code] ?? row.defaultCode;
        const selected = row.choices.find((c) => c.code === selectedCode);
        const initial = selected?.upfrontPercentage;
        const renewal = selected?.ongoingPercentage;

        return (
          <div key={row.code} className="grid grid-cols-[140px_1fr_100px_100px] gap-2 px-4 py-2.5 border-b border-gray-100 items-center">
            <div className="flex items-center gap-2">
              {row.logo ? (
                <img src={row.logo} alt={row.name} className="w-8 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <span className="text-xs font-bold text-slate-700">{row.name.slice(0, 4)}</span>
              )}
              <span className="text-xs font-medium text-slate-700 truncate">{row.name}</span>
            </div>
            <div>
              <select
                className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 w-full max-w-[280px]"
                value={selectedCode}
                onChange={(e) => updateCommission(row.code, e.target.value)}
              >
                {row.choices.map((c) => (
                  <option key={c.code} value={c.code}>{formatCommissionLabel(c)}</option>
                ))}
                {row.choices.length === 0 && <option value="">No options</option>}
              </select>
            </div>
            <div className="text-center">
              {row.choices.length > 0 && (
                <CommissionRates choices={row.choices} selectedCode={selectedCode} field="upfrontPercentage" />
              )}
            </div>
            <div className="text-center">
              {row.choices.length > 0 && (
                <CommissionRates choices={row.choices} selectedCode={selectedCode} field="ongoingPercentage" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CommissionRates({ choices, selectedCode, field }: {
  choices: CommissionChoice[];
  selectedCode: string;
  field: 'upfrontPercentage' | 'ongoingPercentage';
}) {
  const selected = choices.find((c) => c.code === selectedCode);
  const value = selected?.[field];
  if (value === undefined) return <span className="text-xs text-slate-400">—</span>;

  const types = ['LUMP', 'SUM', 'INCOME'] as const;
  return (
    <div className="text-[10px] text-slate-600 leading-relaxed">
      {types.map((t) => (
        <div key={t} className="flex justify-between gap-1">
          <span className="text-slate-400">{t}:</span>
          <span className="font-medium">{value.toFixed(2)}%</span>
        </div>
      ))}
    </div>
  );
}

// ── Campaigns tab ─────────────────────────────────────────────────────────

const MAX_CAMPAIGNS = 4;

interface CampaignRow {
  code: string;
  name: string;
  logo?: string;
  options: CampaignOption[];
  defaultCode: string;
}

function CampaignsPanel({ draft, onChange }: { draft: ScenarioSettings; onChange: (d: ScenarioSettings) => void }) {
  const { suppliers, loading, error } = useSuppliers();
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    if (initialised || suppliers.length === 0) return;
    const hasExisting = Object.keys(draft.campaignBySupplier).length > 0;
    if (!hasExisting) {
      const seed: Record<string, string[]> = {};
      for (const s of suppliers) {
        if (s.defaultCampaignCode) seed[s.code] = [s.defaultCampaignCode];
        else seed[s.code] = [''];
      }
      onChange({ ...draft, campaignBySupplier: seed });
    }
    setInitialised(true);
  }, [suppliers, initialised, draft, onChange]);

  const rows: CampaignRow[] = suppliers.map((s) => {
    const options = s.campaignOptions && s.campaignOptions.length > 0
      ? s.campaignOptions
      : [{ code: '', name: 'None' }];
    return { code: s.code, name: s.name, logo: s.logo, options, defaultCode: s.defaultCampaignCode ?? '' };
  });

  function toggleCampaign(supplierCode: string, campaignCode: string) {
    const current = draft.campaignBySupplier[supplierCode] ?? [];
    const has = current.includes(campaignCode);
    let updated: string[];
    if (has) {
      updated = current.filter((c) => c !== campaignCode);
    } else {
      if (current.length >= MAX_CAMPAIGNS) return;
      updated = [...current, campaignCode];
    }
    onChange({ ...draft, campaignBySupplier: { ...draft.campaignBySupplier, [supplierCode]: updated } });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-xs text-slate-400">
        <Loader2 size={14} className="animate-spin" /> Loading campaign options…
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 text-xs text-amber-700 bg-amber-50">
        Could not load suppliers — {error}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-[160px_1fr] gap-2 px-4 py-2 border-b border-gray-200 bg-gray-50 text-xs font-bold text-slate-600">
        <div>Provider</div>
        <div>Campaigns (max {MAX_CAMPAIGNS})</div>
      </div>

      {rows.map((row) => {
        const selected = draft.campaignBySupplier[row.code] ?? [];
        return (
          <div key={row.code} className="grid grid-cols-[160px_1fr] gap-2 px-4 py-2.5 border-b border-gray-100 items-start">
            <div className="flex items-center gap-2 pt-0.5">
              {row.logo ? (
                <img src={row.logo} alt={row.name} className="w-8 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <span className="text-xs font-bold text-slate-700">{row.name.slice(0, 4)}</span>
              )}
              <span className="text-xs font-medium text-slate-700 truncate">{row.name}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {row.options.map((opt) => {
                const isSelected = selected.includes(opt.code);
                const atLimit = selected.length >= MAX_CAMPAIGNS && !isSelected;
                return (
                  <button
                    key={opt.code}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors ${
                      isSelected
                        ? 'bg-teal-50 border-teal-400 text-teal-800'
                        : atLimit
                          ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
                          : 'bg-white border-slate-300 text-slate-600 hover:border-teal-300 hover:bg-teal-50/50'
                    }`}
                    onClick={() => !atLimit && toggleCampaign(row.code, opt.code)}
                    disabled={atLimit}
                    title={atLimit ? `Maximum ${MAX_CAMPAIGNS} campaigns per provider` : undefined}
                  >
                    {isSelected && <Check size={10} className="text-teal-600" />}
                    {opt.name || opt.code || 'None'}
                  </button>
                );
              })}
              {selected.length > 0 && (
                <span className="text-[10px] text-slate-400 self-center ml-1">{selected.length}/{MAX_CAMPAIGNS}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
