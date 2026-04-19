import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSuppliers } from '@/hooks/useSuppliers';
import type { CommissionChoice, Supplier } from '@/services/omnilifeApi';

// Format a commission option as "{structure} ({upfront%}/ {ongoing%}): {name}",
// falling back to the plain name when structure/percentage fields aren't returned.
function formatCommissionLabel(c: CommissionChoice): string {
  const name = c.name || c.code;
  if (c.structure && c.upfrontPercentage !== undefined && c.ongoingPercentage !== undefined) {
    return `${c.structure} (${Math.round(c.upfrontPercentage)}% / ${Math.round(c.ongoingPercentage)}%): ${name}`;
  }
  return name;
}

// ── Shared helpers ───────────────────────────────────────────────────────────

function Sel({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <label className="text-xs text-slate-600 shrink-0">{label}</label>
      <select className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 w-[180px]" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const opts = ['Yes', 'No'];
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <label className="text-xs text-slate-600 shrink-0">{label}</label>
      <div className="flex rounded border border-gray-300 overflow-hidden">
        {opts.map((o) => (
          <button
            key={o}
            className={`px-3 py-0.5 text-xs font-medium transition-colors ${value === o ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 hover:bg-gray-50'}`}
            onClick={() => onChange(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function Chk({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className="flex items-center gap-2 py-1 w-full text-left" onClick={() => onChange(!checked)}>
      <div className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${checked ? 'bg-teal-600 border-teal-600 text-white' : 'border-gray-300 bg-white'}`}>
        {checked && <Check size={10} strokeWidth={3} />}
      </div>
      <span className="text-xs text-slate-700">{label}</span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. RISKLOGIC DEFAULTS
// ═══════════════════════════════════════════════════════════════════════════════

type RiskTab = 'POLICY DEFAULTS' | 'LIFE' | 'TPD' | 'TRAUMA' | 'INCOME PROTECTION' | 'BUSINESS EXPENSES';
const RISK_TABS: RiskTab[] = ['POLICY DEFAULTS', 'LIFE', 'TPD', 'TRAUMA', 'INCOME PROTECTION', 'BUSINESS EXPENSES'];

interface PolicyDefaults {
  premiumProjection: string;
  steppedVsLevel: string;
  lifeInsuredCollapse: string;
  extensionCoverPref: string;
  premiumFrequency: string;
  applyPremiumLoading: string;
  campaignProducts: string;
  showRetailOnly: string;
  minCommissionPref: string;
}

const DEFAULT_POLICY: PolicyDefaults = {
  premiumProjection: '30',
  steppedVsLevel: '15',
  lifeInsuredCollapse: 'Expanded',
  extensionCoverPref: 'Yes',
  premiumFrequency: 'Yearly',
  applyPremiumLoading: 'No',
  campaignProducts: 'Include',
  showRetailOnly: 'No',
  minCommissionPref: 'No',
};

export type DefaultsMode = 'adviser' | 'my';

function DefaultsPanel({ onClose, defaultsMode }: { onClose: () => void; defaultsMode: DefaultsMode }) {
  const [tab, setTab] = useState<RiskTab>('POLICY DEFAULTS');
  const [form, setForm] = useState<PolicyDefaults>({ ...DEFAULT_POLICY });

  const up = (patch: Partial<PolicyDefaults>) => setForm((f) => ({ ...f, ...patch }));
  const isMyDefaults = defaultsMode === 'my';

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex flex-wrap gap-0 border-b border-gray-200 bg-gray-50 px-1 pt-1">
        {RISK_TABS.map((t) => (
          <button
            key={t}
            className={`px-2.5 py-1.5 text-[11px] font-medium rounded-t transition-colors ${tab === t ? 'bg-white text-teal-700 border border-gray-200 border-b-white -mb-px z-10' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className={`flex-1 overflow-y-auto p-4 ${!isMyDefaults ? 'opacity-40 pointer-events-none' : ''}`}>
        {tab === 'POLICY DEFAULTS' && (
          <div className="space-y-0.5">
            <Sel label="Premium Projection Duration" value={form.premiumProjection} options={['10', '15', '20', '25', '30', '35', '40']} onChange={(v) => up({ premiumProjection: v })} />
            <Sel label="Stepped Vs Level Projection" value={form.steppedVsLevel} options={['5', '10', '15', '20', '25', '30']} onChange={(v) => up({ steppedVsLevel: v })} />
            <Sel label="Life Insured Details Collapse" value={form.lifeInsuredCollapse} options={['Expanded', 'Collapsed']} onChange={(v) => up({ lifeInsuredCollapse: v })} />
            <Toggle label="Extension Cover Preference" value={form.extensionCoverPref} onChange={(v) => up({ extensionCoverPref: v })} />
            <Sel label="Premium Frequency" value={form.premiumFrequency} options={['Yearly', 'Monthly']} onChange={(v) => up({ premiumFrequency: v })} />
            <Toggle label="Apply Premium Loading" value={form.applyPremiumLoading} onChange={(v) => up({ applyPremiumLoading: v })} />
            <Sel label="Campaign Products" value={form.campaignProducts} options={['Include', 'Exclude']} onChange={(v) => up({ campaignProducts: v })} />
            <Toggle label="Show Retail Products Only" value={form.showRetailOnly} onChange={(v) => up({ showRetailOnly: v })} />
            <Toggle label="Minimum Commission Preference" value={form.minCommissionPref} onChange={(v) => up({ minCommissionPref: v })} />
            {form.minCommissionPref === 'Yes' && (
              <p className="text-[10px] text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1">
                When active, default commission settings are disabled. Minimum commission rates will be applied.
              </p>
            )}
          </div>
        )}
        {tab === 'LIFE' && (
          <div className="space-y-0.5">
            <Sel label="Default Sum Insured" value="$650,000" options={['$250,000', '$500,000', '$650,000', '$750,000', '$1,000,000']} onChange={() => {}} />
            <Sel label="Premium Structure" value="Stepped" options={['Stepped', 'Level']} onChange={() => {}} />
            <Toggle label="Premium Waiver" value="No" onChange={() => {}} />
            <Sel label="Default Ownership" value="Non-Super" options={['Non-Super', 'Super']} onChange={() => {}} />
          </div>
        )}
        {tab === 'TPD' && (
          <div className="space-y-0.5">
            <Sel label="Default Sum Insured" value="$650,000" options={['$250,000', '$500,000', '$650,000', '$750,000', '$1,000,000']} onChange={() => {}} />
            <Sel label="Occupation Type" value="Best Available" options={['Best Available', 'Own Occupation', 'Any Occupation']} onChange={() => {}} />
            <Sel label="Premium Structure" value="Stepped" options={['Stepped', 'Level']} onChange={() => {}} />
            <Toggle label="Life Buy Back" value="No" onChange={() => {}} />
            <Toggle label="Double TPD" value="No" onChange={() => {}} />
          </div>
        )}
        {tab === 'TRAUMA' && (
          <div className="space-y-0.5">
            <Sel label="Default Sum Insured" value="$200,000" options={['$100,000', '$200,000', '$350,000', '$500,000']} onChange={() => {}} />
            <Sel label="Trauma Features" value="Comprehensive" options={['Basic', 'Intermediate', 'Comprehensive']} onChange={() => {}} />
            <Toggle label="Premium Waiver" value="No" onChange={() => {}} />
          </div>
        )}
        {tab === 'INCOME PROTECTION' && (
          <div className="space-y-0.5">
            <Sel label="Default Monthly Benefit" value="$10,000" options={['$5,000', '$7,500', '$10,000', '$15,000', '$20,000']} onChange={() => {}} />
            <Sel label="Waiting Period" value="90 days" options={['30 days', '60 days', '90 days']} onChange={() => {}} />
            <Sel label="Benefit Period" value="To Age 65" options={['2 years', '5 years', 'To Age 65']} onChange={() => {}} />
            <Sel label="Benefit Type" value="Agreed" options={['Indemnity', 'Agreed', 'Indemnity if possible']} onChange={() => {}} />
            <Sel label="Premium Structure" value="Stepped" options={['Stepped', 'Level']} onChange={() => {}} />
            <Toggle label="Increase Claim Benefit" value="No" onChange={() => {}} />
            <Toggle label="Accident Benefit" value="No" onChange={() => {}} />
          </div>
        )}
        {tab === 'BUSINESS EXPENSES' && (
          <div className="space-y-0.5">
            <Sel label="Default Sum Insured" value="" options={['', '$5,000', '$10,000', '$15,000', '$20,000']} onChange={() => {}} />
            <Sel label="Waiting Period" value="30 days" options={['14 days', '30 days', '60 days', '90 days']} onChange={() => {}} />
            <Sel label="Benefit Period" value="12 months" options={['6 months', '12 months', '24 months']} onChange={() => {}} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-200 bg-gray-50">
        <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setForm({ ...DEFAULT_POLICY })}>Reset</Button>
        <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-7" onClick={onClose}>Save</Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. INSURER OPTIONS — suppliers & products from /suppliers API
// ═══════════════════════════════════════════════════════════════════════════════

function InsurerOptions({ onClose, defaultsMode }: { onClose: () => void; defaultsMode: DefaultsMode }) {
  const { suppliers, loading, error } = useSuppliers();
  const [selectedSupplierCode, setSelectedSupplierCode] = useState<string | null>(null);
  const [checkedSuppliers, setCheckedSuppliers] = useState<Set<string>>(new Set());
  const [checkedProducts, setCheckedProducts] = useState<Set<string>>(new Set());
  const [commissionBySupplier, setCommissionBySupplier] = useState<Record<string, string>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [initialised, setInitialised] = useState(false);

  // On first load, tick every supplier and all their products by default, and
  // seed the commission selection from each supplier's defaultCommissionCode.
  useEffect(() => {
    if (initialised || suppliers.length === 0) return;
    const sup = new Set<string>();
    const prod = new Set<string>();
    const commission: Record<string, string> = {};
    const fundTypes = new Set<string>();
    for (const s of suppliers) {
      sup.add(s.code);
      s.products.forEach((p) => prod.add(`${s.code}::${p.code}`));
      if (s.defaultCommissionCode) commission[s.code] = s.defaultCommissionCode;
      fundTypes.add(s.fundType);
    }
    setCheckedSuppliers(sup);
    setCheckedProducts(prod);
    setCommissionBySupplier(commission);
    setExpandedGroups(fundTypes);
    setSelectedSupplierCode((prev) => prev ?? suppliers[0]?.code ?? null);
    setInitialised(true);
  }, [suppliers, initialised]);

  // Group suppliers by fundType, preserving API order within each group.
  const grouped = suppliers.reduce<Record<string, Supplier[]>>((acc, s) => {
    (acc[s.fundType] ??= []).push(s);
    return acc;
  }, {});
  const fundTypeOrder = Object.keys(grouped);

  const selectedSupplier = suppliers.find((s) => s.code === selectedSupplierCode) ?? null;

  function toggleGroup(fundType: string) {
    setExpandedGroups((prev) => {
      const n = new Set(prev);
      if (n.has(fundType)) n.delete(fundType); else n.add(fundType);
      return n;
    });
  }

  function selectAllInFundType(fundType: string) {
    const groupSuppliers = grouped[fundType] ?? [];
    const allChecked = groupSuppliers.every((s) => checkedSuppliers.has(s.code));
    setCheckedSuppliers((prev) => {
      const n = new Set(prev);
      groupSuppliers.forEach((s) => {
        if (allChecked) n.delete(s.code);
        else n.add(s.code);
      });
      return n;
    });
    setCheckedProducts((prev) => {
      const n = new Set(prev);
      groupSuppliers.forEach((s) => {
        s.products.forEach((p) => {
          const key = `${s.code}::${p.code}`;
          if (allChecked) n.delete(key);
          else n.add(key);
        });
      });
      return n;
    });
  }

  function toggleSupplier(supplier: Supplier) {
    const isChecked = checkedSuppliers.has(supplier.code);
    setCheckedSuppliers((prev) => {
      const n = new Set(prev);
      if (isChecked) n.delete(supplier.code); else n.add(supplier.code);
      return n;
    });
    // When toggling a supplier, add/remove all its products in bulk.
    setCheckedProducts((prev) => {
      const n = new Set(prev);
      supplier.products.forEach((p) => {
        const key = `${supplier.code}::${p.code}`;
        if (isChecked) n.delete(key);
        else n.add(key);
      });
      return n;
    });
  }

  function toggleProduct(supplierCode: string, productCode: string) {
    const key = `${supplierCode}::${productCode}`;
    setCheckedProducts((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key); else n.add(key);
      return n;
    });
  }

  function updateCommission(supplierCode: string, code: string) {
    setCommissionBySupplier((prev) => ({ ...prev, [supplierCode]: code }));
  }

  // Prefer the supplier's commissionOptions; if absent, synthesise from default/minimum codes.
  function commissionChoicesFor(s: Supplier): { code: string; name: string }[] {
    if (s.commissionOptions && s.commissionOptions.length > 0) return s.commissionOptions;
    const choices: { code: string; name: string }[] = [];
    if (s.defaultCommissionCode) choices.push({ code: s.defaultCommissionCode, name: s.defaultCommissionCode });
    if (s.minimumCommissionCode && s.minimumCommissionCode !== s.defaultCommissionCode) {
      choices.push({ code: s.minimumCommissionCode, name: s.minimumCommissionCode });
    }
    return choices;
  }

  const isAdviser = defaultsMode === 'adviser';

  return (
    <div className="flex flex-col h-full">
      {error && (
        <div className="px-4 py-2 text-xs text-amber-700 bg-amber-50 border-b border-amber-200">
          Could not load suppliers — {error}
        </div>
      )}
      <div className={`flex-1 flex overflow-hidden ${isAdviser ? 'opacity-40 pointer-events-none' : ''}`}>
        {/* Left: suppliers grouped by fundType */}
        <div className="w-72 border-r border-gray-200 overflow-y-auto bg-gray-50">
          {loading && (
            <div className="px-3 py-4 text-xs text-slate-400 flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" /> Loading suppliers…
            </div>
          )}
          {fundTypeOrder.map((fundType) => {
            const group = grouped[fundType];
            const expanded = expandedGroups.has(fundType);
            const allChecked = group.every((s) => checkedSuppliers.has(s.code));
            const someChecked = group.some((s) => checkedSuppliers.has(s.code));
            return (
              <div key={fundType} className="border-b border-gray-200">
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100">
                  <button className="flex items-center gap-1 text-xs font-bold text-slate-700" onClick={() => toggleGroup(fundType)}>
                    {expanded ? '▾' : '▸'} {fundType}
                    <span className="text-[10px] font-normal text-slate-400 ml-1">
                      ({group.filter((s) => checkedSuppliers.has(s.code)).length}/{group.length})
                    </span>
                  </button>
                  <button
                    className="text-[10px] font-medium text-teal-700 hover:text-teal-900 hover:underline"
                    onClick={() => selectAllInFundType(fundType)}
                  >
                    {allChecked ? 'Select None' : 'Select All'}
                  </button>
                </div>
                {expanded && (
                  <div>
                    {group.map((s) => {
                      const isSelected = selectedSupplierCode === s.code;
                      return (
                        <div
                          key={s.code}
                          className={`flex items-center gap-2 px-3 py-1.5 border-t border-gray-100 cursor-pointer ${
                            isSelected ? 'bg-teal-50 border-l-2 border-l-teal-600' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => setSelectedSupplierCode(s.code)}
                        >
                          <button
                            className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${
                              checkedSuppliers.has(s.code)
                                ? 'bg-teal-600 border-teal-600 text-white'
                                : 'border-gray-300 bg-white'
                            }`}
                            onClick={(e) => { e.stopPropagation(); toggleSupplier(s); }}
                          >
                            {checkedSuppliers.has(s.code) && <Check size={10} strokeWidth={3} />}
                          </button>
                          <span className={`text-xs ${isSelected ? 'font-semibold text-teal-800' : 'text-slate-700'}`}>
                            {s.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {!expanded && someChecked && !allChecked && (
                  <span className="hidden" />
                )}
              </div>
            );
          })}
          {!loading && suppliers.length === 0 && (
            <div className="px-3 py-4 text-xs text-slate-400">No suppliers returned.</div>
          )}
        </div>

        {/* Right: products + commission for selected supplier */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedSupplier ? (
            <>
              <div className="px-4 py-3 border-b border-gray-200 bg-slate-50">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h4 className="text-sm font-bold text-slate-800">{selectedSupplier.name}</h4>
                  <span className="text-[10px] text-slate-400">{selectedSupplier.fundType}</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-slate-600 shrink-0">Default Commission</label>
                  <select
                    className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 flex-1 max-w-[280px]"
                    value={commissionBySupplier[selectedSupplier.code] ?? selectedSupplier.defaultCommissionCode ?? ''}
                    onChange={(e) => updateCommission(selectedSupplier.code, e.target.value)}
                  >
                    {commissionChoicesFor(selectedSupplier).map((c) => (
                      <option key={c.code} value={c.code}>{formatCommissionLabel(c)}</option>
                    ))}
                    {commissionChoicesFor(selectedSupplier).length === 0 && (
                      <option value="">No commission options</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <h5 className="text-xs font-bold text-slate-700 mb-2">Products</h5>
                {selectedSupplier.products.length === 0 && (
                  <div className="text-xs text-slate-400">No products for this supplier.</div>
                )}
                <div className="space-y-0.5">
                  {selectedSupplier.products.map((p) => {
                    const key = `${selectedSupplier.code}::${p.code}`;
                    return (
                      <Chk
                        key={key}
                        label={p.name || p.code}
                        checked={checkedProducts.has(key)}
                        onChange={() => toggleProduct(selectedSupplier.code, p.code)}
                      />
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              {loading ? 'Loading…' : 'Select a supplier on the left to view its products.'}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-200 bg-gray-50">
        <Button variant="outline" size="sm" className="text-xs h-7" onClick={onClose}>Cancel</Button>
        <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-7" onClick={onClose}>Save</Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. INSURER LOGINS
// ═══════════════════════════════════════════════════════════════════════════════

const LOGIN_INSURERS = ['AIA', 'TAL', 'ZURICH ACTIVE', 'ZURICH SUMO', 'ZURICH', 'BT', 'MLC', 'MetLife', 'OnePath', 'NEOS'];

function InsurerLogins({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState(LOGIN_INSURERS[0]);
  const [creds, setCreds] = useState<Record<string, { username: string; password: string }>>(() => {
    const init: Record<string, { username: string; password: string }> = {};
    LOGIN_INSURERS.forEach((i) => { init[i] = { username: '', password: '' }; });
    return init;
  });

  const cur = creds[selected] || { username: '', password: '' };

  function updateCred(field: 'username' | 'password', value: string) {
    setCreds((prev) => ({ ...prev, [selected]: { ...prev[selected], [field]: value } }));
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex overflow-hidden">
        {/* Left: insurer list */}
        <div className="w-48 border-r border-gray-200 overflow-y-auto bg-gray-50">
          {LOGIN_INSURERS.map((ins) => (
            <button
              key={ins}
              className={`w-full text-left px-3 py-2.5 text-xs font-medium border-b border-gray-100 transition-colors ${
                selected === ins ? 'bg-teal-50 text-teal-700 border-l-2 border-l-teal-600' : 'text-slate-600 hover:bg-gray-100'
              }`}
              onClick={() => setSelected(ins)}
            >
              {ins}
            </button>
          ))}
        </div>
        {/* Right: credentials */}
        <div className="flex-1 p-5">
          <h4 className="text-sm font-bold text-slate-800 mb-4">{selected} Login</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Username</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                value={cur.username}
                onChange={(e) => updateCred('username', e.target.value)}
                placeholder={`Enter ${selected} username`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                value={cur.password}
                onChange={(e) => updateCred('password', e.target.value)}
                placeholder="Enter password"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-4">
            Credentials are stored locally and used for live quoting integrations.
          </p>
        </div>
      </div>
      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-200 bg-gray-50">
        <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-7" onClick={onClose}>Save</Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTIONS MODAL — wraps the 3 panels
// ═══════════════════════════════════════════════════════════════════════════════

export type OptionsTab = 'defaults' | 'insurerOptions' | 'insurerLogins';

const OPTIONS_LABELS: Record<OptionsTab, string> = {
  defaults: 'Defaults',
  insurerOptions: 'Insurer Options',
  insurerLogins: 'Insurer Logins',
};

interface OptionsModalProps {
  activeTab: OptionsTab;
  onTabChange: (tab: OptionsTab) => void;
  onClose: () => void;
}

export function OptionsModalContent({ activeTab, onTabChange, onClose }: OptionsModalProps) {
  const [defaultsMode, setDefaultsMode] = useState<DefaultsMode>('adviser');

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Defaults mode selector — applies to the Defaults tab (and, when set
          to "my", Insurer Options below also become the active defaults). */}
      <div className="px-4 py-3 border-b border-gray-200 bg-slate-50">
        <div className="flex items-center justify-between gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700">Defaults</label>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {defaultsMode === 'adviser'
                ? 'Adviser defaults from your adviser profile will be applied to quotes.'
                : 'Your custom defaults (including selected Insurers & Products) will be applied to quotes.'}
            </p>
          </div>
          <div className="flex rounded border border-gray-300 overflow-hidden shrink-0">
            <button
              className={`px-3 py-1 text-xs font-medium transition-colors ${defaultsMode === 'adviser' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 hover:bg-gray-50'}`}
              onClick={() => setDefaultsMode('adviser')}
            >
              Use Adviser defaults
            </button>
            <button
              className={`px-3 py-1 text-xs font-medium transition-colors ${defaultsMode === 'my' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 hover:bg-gray-50'}`}
              onClick={() => setDefaultsMode('my')}
            >
              Use my defaults
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-slate-50 px-2 pt-2">
        {(Object.entries(OPTIONS_LABELS) as [OptionsTab, string][]).map(([key, label]) => (
          <button
            key={key}
            className={`px-3 py-2 text-xs font-medium rounded-t transition-colors ${
              activeTab === key
                ? 'bg-white text-teal-700 border border-gray-200 border-b-white -mb-px z-10'
                : 'text-slate-500 hover:text-slate-700 hover:bg-gray-100'
            }`}
            onClick={() => onTabChange(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'defaults' && <DefaultsPanel onClose={onClose} defaultsMode={defaultsMode} />}
        {activeTab === 'insurerOptions' && <InsurerOptions onClose={onClose} defaultsMode={defaultsMode} />}
        {activeTab === 'insurerLogins' && <InsurerLogins onClose={onClose} />}
      </div>
    </div>
  );
}
