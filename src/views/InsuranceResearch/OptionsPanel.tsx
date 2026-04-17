import { useState } from 'react';
import { Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

type DefaultsMode = 'adviser' | 'my';

function DefaultsPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<RiskTab>('POLICY DEFAULTS');
  const [form, setForm] = useState<PolicyDefaults>({ ...DEFAULT_POLICY });
  const [defaultsMode, setDefaultsMode] = useState<DefaultsMode>('adviser');

  const up = (patch: Partial<PolicyDefaults>) => setForm((f) => ({ ...f, ...patch }));
  const isMyDefaults = defaultsMode === 'my';

  return (
    <div className="flex flex-col h-full">
      {/* Defaults mode selector */}
      <div className="px-4 py-3 border-b border-gray-200 bg-slate-50">
        <div className="flex items-center justify-between gap-3">
          <label className="text-xs font-semibold text-slate-700">Defaults</label>
          <div className="flex rounded border border-gray-300 overflow-hidden">
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
        <p className="text-[10px] text-slate-400 mt-1.5">
          {defaultsMode === 'adviser'
            ? 'Adviser defaults from your adviser profile will be applied to quotes.'
            : 'Your custom defaults below (including selected Insurers & Products) will be applied to quotes.'}
        </p>
      </div>

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
// 2. INCLUDED INSURERS AND PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════════

interface InsurerGroup {
  label: string;
  items: string[];
}

const INSURER_GROUPS: InsurerGroup[] = [
  {
    label: 'Retail',
    items: [
      'AIA Priority Protection',
      'AMP Elevate (Members)',
      'BT Protection Plans',
      'ClearView Life Assurance',
      'Encompass Protection',
      'Integrity Life',
      'MLC Insurance',
      'MetLife Protect',
      'NEOS Life',
      'OnePath Life',
      'PPS Mutual',
      'TAL Accelerated Protection',
      'Zurich Protection',
    ],
  },
  {
    label: 'Retail Super',
    items: [
      'Asgard Employee Super',
      'AMG Personal Super',
      'AMP Signature Super',
      'Australian Ethical Super',
      'BT Business Super',
      'BT Super for Life',
      'Commonwealth Essential Super',
      'Commonwealth Group Super',
      'FirstChoice Employer Super',
      'FirstChoice Personal Super',
      'FirstWrap LifeProtect Super',
    ],
  },
];

const DEFAULT_PRODUCTS = [
  'Life Protection',
  'Life and TPD Protection',
  'Salary Continuance Insurance',
  'Trauma Cover',
  'Business Expenses Cover',
  'Child Cover',
];

function IncludedInsurers({ onClose }: { onClose: () => void }) {
  const [checkedInsurers, setCheckedInsurers] = useState<Set<string>>(() => {
    const all = new Set<string>();
    INSURER_GROUPS.forEach((g) => g.items.forEach((i) => all.add(i)));
    return all;
  });
  const [checkedProducts, setCheckedProducts] = useState<Set<string>>(new Set(DEFAULT_PRODUCTS.slice(0, 3)));
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(INSURER_GROUPS.map((g) => g.label)));
  const [applyToFuture, setApplyToFuture] = useState(false);

  function toggleInsurer(name: string) {
    setCheckedInsurers((prev) => { const n = new Set(prev); if (n.has(name)) n.delete(name); else n.add(name); return n; });
  }
  function toggleProduct(name: string) {
    setCheckedProducts((prev) => { const n = new Set(prev); if (n.has(name)) n.delete(name); else n.add(name); return n; });
  }
  function toggleGroup(label: string) {
    setExpandedGroups((prev) => { const n = new Set(prev); if (n.has(label)) n.delete(label); else n.add(label); return n; });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="flex gap-0 h-full">
          {/* Left: Insurers */}
          <div className="flex-1 border-r border-gray-200 p-3 overflow-y-auto">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Suppliers</h4>
            {INSURER_GROUPS.map((g) => (
              <div key={g.label} className="mb-2">
                <button className="flex items-center gap-1 text-xs font-semibold text-slate-600 mb-1" onClick={() => toggleGroup(g.label)}>
                  {expandedGroups.has(g.label) ? '▾' : '▸'} {g.label}
                </button>
                {expandedGroups.has(g.label) && (
                  <div className="pl-3 space-y-0.5">
                    {g.items.map((item) => (
                      <Chk key={item} label={item} checked={checkedInsurers.has(item)} onChange={() => toggleInsurer(item)} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Right: Products */}
          <div className="flex-1 p-3 overflow-y-auto">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Default Products</h4>
            <div className="space-y-0.5">
              {DEFAULT_PRODUCTS.map((p) => (
                <Chk key={p} label={p} checked={checkedProducts.has(p)} onChange={() => toggleProduct(p)} />
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2.5 space-y-2">
        <Chk label="Apply these settings to all future quotes" checked={applyToFuture} onChange={setApplyToFuture} />
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => {
            const all = new Set<string>();
            INSURER_GROUPS.forEach((g) => g.items.forEach((i) => all.add(i)));
            setCheckedInsurers(all);
            setCheckedProducts(new Set(DEFAULT_PRODUCTS.slice(0, 3)));
          }}>Reset</Button>
          <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-7" onClick={onClose}>Update</Button>
        </div>
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
// 4. COMMISSIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface CommissionEntry {
  provider: string;
  commissionType: string;
  options: string[];
}

interface CommissionSection {
  label: string;
  entries: CommissionEntry[];
}

const COMMISSION_SECTIONS: CommissionSection[] = [
  {
    label: 'Retail',
    entries: [
      { provider: 'Encompass', commissionType: 'Upfront (66/22)', options: ['Upfront (66/22)', 'Upfront (60/20)', 'Hybrid (66/22)', 'Level (22/22)', 'Nil'] },
      { provider: 'Integrity', commissionType: 'Higher Initial (0% Discount)', options: ['Higher Initial (0% Discount)', 'Higher Initial (5% Discount)', 'Hybrid (0% Discount)', 'Level', 'Nil'] },
      { provider: 'OnePath', commissionType: 'Hybrid - DD All Years - 0%', options: ['Hybrid - DD All Years - 0%', 'Hybrid - DD All Years - 5%', 'Upfront (66/22)', 'Level', 'Nil'] },
      { provider: 'Zurich Life Active', commissionType: 'Hybrid - 0%', options: ['Hybrid - 0%', 'Hybrid - 5%', 'Upfront (66/22)', 'Level', 'Nil'] },
      { provider: 'MLC', commissionType: 'Hybrid Premium Discount - 0%', options: ['Hybrid Premium Discount - 0%', 'Hybrid Premium Discount - 5%', 'Upfront (66/22)', 'Level', 'Nil'] },
      { provider: 'MetLife', commissionType: 'Hybrid (66/22)', options: ['Hybrid (66/22)', 'Upfront (66/22)', 'Level (22/22)', 'Nil'] },
      { provider: 'NEOS', commissionType: 'Upfront (66/22)', options: ['Upfront (66/22)', 'Hybrid (66/22)', 'Level (22/22)', 'Nil'] },
      { provider: 'PPS Mutual', commissionType: 'Hybrid 0% Sacrifice', options: ['Hybrid 0% Sacrifice', 'Hybrid 5% Sacrifice', 'Upfront', 'Level', 'Nil'] },
      { provider: 'BT', commissionType: 'Upfront Commission (ALL) 0%', options: ['Upfront Commission (ALL) 0%', 'Upfront Commission (ALL) 5%', 'Hybrid', 'Level', 'Nil'] },
      { provider: 'Zurich', commissionType: 'Hybrid - 0%', options: ['Hybrid - 0%', 'Hybrid - 5%', 'Upfront (66/22)', 'Level', 'Nil'] },
    ],
  },
  {
    label: 'Retail Super',
    entries: [
      { provider: 'AMP Signature Super', commissionType: 'Hybrid - 0%', options: ['Hybrid - 0%', 'Level', 'Nil'] },
      { provider: 'BT Super for Life', commissionType: 'Upfront (ALL) 0%', options: ['Upfront (ALL) 0%', 'Level', 'Nil'] },
      { provider: 'Australian Ethical Super', commissionType: 'Nil', options: ['Nil'] },
      { provider: 'Australian Super', commissionType: 'Nil', options: ['Nil'] },
    ],
  },
  {
    label: 'Group',
    entries: [
      { provider: 'AMIST Super', commissionType: 'Nil', options: ['Nil'] },
      { provider: 'ANZ Staff Super', commissionType: 'Nil', options: ['Nil'] },
      { provider: 'Acclaim Super', commissionType: 'Nil', options: ['Nil'] },
    ],
  },
];

function CommissionsPanel({ onClose }: { onClose: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    COMMISSION_SECTIONS.forEach((s) => s.entries.forEach((e) => { init[e.provider] = e.commissionType; }));
    return init;
  });

  function updateCommission(provider: string, value: string) {
    setSelections((prev) => ({ ...prev, [provider]: value }));
  }

  const filtered = COMMISSION_SECTIONS.map((section) => ({
    ...section,
    entries: section.entries.filter((e) =>
      !searchTerm || e.provider.toLowerCase().includes(searchTerm.toLowerCase()) || e.commissionType.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((s) => s.entries.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50">
        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search providers..."
            className="w-full pl-7 pr-3 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Commission list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((section) => (
          <div key={section.label}>
            <div className="px-4 py-1.5 bg-slate-100 border-y border-gray-200">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">{section.label}</span>
            </div>
            {section.entries.map((entry) => (
              <div key={entry.provider} className="flex items-center justify-between gap-3 px-4 py-2 border-b border-gray-100 hover:bg-gray-50/50">
                <span className="text-xs font-medium text-slate-700 shrink-0 w-40">{entry.provider}</span>
                <select
                  className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 flex-1 max-w-[280px]"
                  value={selections[entry.provider] || entry.commissionType}
                  onChange={(e) => updateCommission(entry.provider, e.target.value)}
                >
                  {entry.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            No providers match "{searchTerm}"
          </div>
        )}
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
// OPTIONS MODAL — wraps the 4 panels
// ═══════════════════════════════════════════════════════════════════════════════

export type OptionsTab = 'defaults' | 'includedInsurers' | 'insurerLogins' | 'commissions';

const OPTIONS_LABELS: Record<OptionsTab, string> = {
  defaults: 'Defaults',
  includedInsurers: 'Included Insurers & Products',
  insurerLogins: 'Insurer Logins',
  commissions: 'Commissions',
};

interface OptionsModalProps {
  activeTab: OptionsTab;
  onTabChange: (tab: OptionsTab) => void;
  onClose: () => void;
}

export function OptionsModalContent({ activeTab, onTabChange, onClose }: OptionsModalProps) {
  return (
    <div className="flex flex-col h-full">
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
        {activeTab === 'defaults' && <DefaultsPanel onClose={onClose} />}
        {activeTab === 'includedInsurers' && <IncludedInsurers onClose={onClose} />}
        {activeTab === 'insurerLogins' && <InsurerLogins onClose={onClose} />}
        {activeTab === 'commissions' && <CommissionsPanel onClose={onClose} />}
      </div>
    </div>
  );
}
