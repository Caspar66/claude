import { useState, useRef, useEffect } from 'react';
import { X, Search, Check, ChevronRight, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// ── Types ────────────────────────────────────────────────────────────────────

export interface MappedPolicy {
  id: string;
  provider: string;
  policyVersion: string;
  products: MappedProduct[];
}

export interface MappedProduct {
  name: string;
  covers: CoverType[];
}

type CoverType = 'Life' | 'TPD' | 'Trauma' | 'IP' | 'BE' | 'NeedleStick' | 'ChildTrauma';

const COVER_TYPES: { key: CoverType; label: string }[] = [
  { key: 'Life', label: 'Life' },
  { key: 'TPD', label: 'TPD' },
  { key: 'Trauma', label: 'Trauma' },
  { key: 'IP', label: 'IP' },
  { key: 'BE', label: 'BE' },
  { key: 'NeedleStick', label: 'Needle Stick' },
  { key: 'ChildTrauma', label: 'Child Trauma' },
];

// ── Provider search data ─────────────────────────────────────────────────────

interface ProviderVersion {
  provider: string;
  versions: string[];
}

const PROVIDER_DATA: ProviderVersion[] = [
  {
    provider: 'AIA Priority Protection',
    versions: [
      'AIA Priority Protection 20/02/2022 - 31/12/2022',
      'AIA Priority Protection 01/01/2023 - 30/06/2023',
      'AIA Priority Protection 01/07/2023 - 31/12/2023',
      'AIA Priority Protection 01/01/2024 - 30/06/2024',
    ],
  },
  {
    provider: 'TAL Accelerated Protection',
    versions: [
      'TAL Accelerated Protection 01/04/2022 - 30/09/2022',
      'TAL Accelerated Protection 01/10/2022 - 31/03/2023',
      'TAL Accelerated Protection 01/04/2023 - 30/09/2023',
      'TAL Accelerated Protection 01/10/2023 - 31/03/2024',
    ],
  },
  {
    provider: 'AAMI Life Insurance',
    versions: [
      'AAMI Life Insurance 01/01/2022 - 31/12/2022',
      'AAMI Life Insurance 01/01/2023 - 31/12/2023',
    ],
  },
  {
    provider: 'AMP Elevate Insurance',
    versions: [
      'AMP Elevate Insurance 01/07/2022 - 30/06/2023',
      'AMP Elevate Insurance 01/07/2023 - 30/06/2024',
    ],
  },
  {
    provider: 'MLC Insurance',
    versions: [
      'MLC Insurance 01/01/2023 - 31/12/2023',
      'MLC Insurance 01/01/2024 - 30/06/2024',
    ],
  },
  {
    provider: 'Zurich Protection',
    versions: [
      'Zurich Protection 01/03/2022 - 28/02/2023',
      'Zurich Protection 01/03/2023 - 29/02/2024',
    ],
  },
  {
    provider: 'OnePath Life',
    versions: [
      'OnePath Life 01/01/2022 - 31/12/2022',
      'OnePath Life 01/01/2023 - 31/12/2023',
    ],
  },
  {
    provider: 'MetLife Protect',
    versions: [
      'MetLife Protect 01/07/2022 - 30/06/2023',
      'MetLife Protect 01/07/2023 - 30/06/2024',
    ],
  },
];

// ── Product grid data (per provider) ─────────────────────────────────────────

const PRODUCT_NAMES: Record<string, string[]> = {
  'AIA Priority Protection': [
    'Life Cover Plan - TPD - Crisis Recovery',
    'Crisis Recovery Stand Alone Plan - TPD',
    'Business Expenses Plan',
    'Total and Permanent Disablement Stand Alone',
    'Superannuation Life Cover Plan (SMSF) - TPD - Crisis R...',
    'Income Protection CORE',
    'Family Protection',
  ],
  'TAL Accelerated Protection': [
    'Health Sense Life & TPD & Critical Illness Premier',
    'Critical Illness Stand Alone',
    'IP Enhance',
    'Total and Permanent Disablement Stand Alone',
    'Business Expenses',
    'Family Protection',
  ],
  'AAMI Life Insurance': [
    'Life Protection - TPD Extension',
    'Income Shield Standard',
    'Critical Illness Cover',
    'Business Expenses Protection',
  ],
  'AMP Elevate Insurance': [
    'Life Insurance',
    'TPD Insurance',
    'Crisis Protection',
    'Income Protection',
    'Business Expenses Insurance',
  ],
  'MLC Insurance': [
    'Life Cover',
    'Life Cover - TPD',
    'Income Protection',
    'Critical Illness',
    'Business Expenses',
  ],
  'Zurich Protection': [
    'Protection Plus - Life & TPD',
    'Trauma Recovery',
    'Income Replace',
    'Business Expenses Guard',
    'Child Cover',
  ],
  'OnePath Life': [
    'Life Cover',
    'TPD Cover',
    'Income Secure',
    'Trauma Cover',
    'Business Expenses',
  ],
  'MetLife Protect': [
    'Life Cover',
    'Total and Permanent Disability',
    'Income Protection',
    'Trauma Cover',
    'Business Expenses',
    'Needle Stick Benefit',
  ],
};

function getProductsForProvider(provider: string): string[] {
  return PRODUCT_NAMES[provider] || [
    'Life Cover',
    'TPD Cover',
    'Income Protection',
    'Trauma Cover',
    'Business Expenses',
  ];
}

// ── Step 1: Provider Search ──────────────────────────────────────────────────

function StepProviderSearch({
  onNext,
}: {
  onNext: (provider: string, version: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ProviderVersion | null>(null);
  const [selectedVersion, setSelectedVersion] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = searchTerm.length > 0
    ? PROVIDER_DATA.filter((p) => p.provider.toLowerCase().includes(searchTerm.toLowerCase()))
    : PROVIDER_DATA;

  function handleSelectProvider(pv: ProviderVersion) {
    setSelectedProvider(pv);
    setSelectedVersion(pv.versions[0] || '');
    setSearchTerm(pv.provider);
  }

  const canNext = selectedProvider !== null && selectedVersion !== '';

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
        {/* Search input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Search Provider
          </label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type provider name (e.g. AIA, TAL, AAMI...)"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (selectedProvider && !e.target.value.toLowerCase().includes(selectedProvider.provider.toLowerCase())) {
                  setSelectedProvider(null);
                  setSelectedVersion('');
                }
              }}
            />
          </div>
        </div>

        {/* Search results list */}
        {!selectedProvider && (
          <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((pv) => (
                <button
                  key={pv.provider}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between group"
                  onClick={() => handleSelectProvider(pv)}
                >
                  <span className="text-slate-700 group-hover:text-teal-700 font-medium">{pv.provider}</span>
                  <ChevronRight size={14} className="text-gray-400 group-hover:text-teal-600" />
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No providers found matching "{searchTerm}"
              </div>
            )}
          </div>
        )}

        {/* Version selector (shown after provider is picked) */}
        {selectedProvider && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Policy Version
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
            >
              {selectedProvider.versions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              Select the policy version date range that matches the existing policy.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-gray-200 bg-gray-50">
        <Button
          size="sm"
          className="bg-teal-700 hover:bg-teal-800 text-white px-6"
          disabled={!canNext}
          onClick={() => onNext(selectedProvider!.provider, selectedVersion)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// ── Step 2: Cover Selection Grid ─────────────────────────────────────────────

function StepCoverSelection({
  provider,
  version,
  onBack,
  onSave,
}: {
  provider: string;
  version: string;
  onBack: () => void;
  onSave: (products: MappedProduct[]) => void;
}) {
  const productNames = getProductsForProvider(provider);
  const [selections, setSelections] = useState<Record<string, Set<CoverType>>>(() => {
    const init: Record<string, Set<CoverType>> = {};
    productNames.forEach((name) => { init[name] = new Set(); });
    return init;
  });

  function toggleCover(product: string, cover: CoverType) {
    setSelections((prev) => {
      const next = { ...prev };
      const set = new Set(prev[product]);
      if (set.has(cover)) set.delete(cover);
      else set.add(cover);
      next[product] = set;
      return next;
    });
  }

  const hasSelections = Object.values(selections).some((s) => s.size > 0);

  function handleSave() {
    const products: MappedProduct[] = [];
    for (const [name, covers] of Object.entries(selections)) {
      if (covers.size > 0) {
        products.push({ name, covers: Array.from(covers) });
      }
    }
    onSave(products);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Provider badge */}
      <div className="px-6 py-3 bg-slate-50 border-b border-gray-200">
        <div className="text-xs text-slate-500">Provider</div>
        <div className="text-sm font-semibold text-slate-800">{provider}</div>
        <div className="text-xs text-slate-500 mt-0.5">{version}</div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-3 text-xs font-semibold text-slate-600">
                Product
              </th>
              {COVER_TYPES.map((ct) => (
                <th key={ct.key} className="px-2 py-2 text-xs font-semibold text-slate-600 text-center whitespace-nowrap">
                  {ct.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {productNames.map((name) => (
              <tr key={name} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="py-2.5 pr-3 text-sm text-slate-700 max-w-[280px]">
                  <span className="line-clamp-1">{name}</span>
                </td>
                {COVER_TYPES.map((ct) => {
                  const checked = selections[name]?.has(ct.key) ?? false;
                  return (
                    <td key={ct.key} className="px-2 py-2.5 text-center">
                      <button
                        onClick={() => toggleCover(name, ct.key)}
                        className={`w-5 h-5 rounded border-2 inline-flex items-center justify-center transition-colors ${
                          checked
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'border-gray-300 hover:border-teal-400'
                        }`}
                      >
                        {checked && <Check size={12} strokeWidth={3} />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
        <button
          className="flex items-center gap-1 text-sm text-teal-700 hover:underline"
          onClick={onBack}
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <Button
          size="sm"
          className="bg-teal-700 hover:bg-teal-800 text-white px-6"
          disabled={!hasSelections}
          onClick={handleSave}
        >
          SAVE
        </Button>
      </div>
    </div>
  );
}

// ── Step 3: Confirmation ─────────────────────────────────────────────────────

function StepConfirmation({
  policy,
  totalPolicies,
  onAddAnother,
  onDone,
}: {
  policy: MappedPolicy;
  totalPolicies: number;
  onAddAnother: () => void;
  onDone: () => void;
}) {
  const coverCount = policy.products.reduce((sum, p) => sum + p.covers.length, 0);
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center text-center">
        {/* Success icon */}
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <Check size={28} className="text-emerald-600" strokeWidth={2.5} />
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-1">Policy Mapped Successfully</h3>
        <p className="text-sm text-slate-600 mb-4">
          <strong>{policy.provider}</strong> has been mapped with {policy.products.length} product{policy.products.length !== 1 ? 's' : ''} and {coverCount} cover{coverCount !== 1 ? 's' : ''}.
        </p>

        {/* Mapped summary */}
        <div className="w-full max-w-md border border-gray-200 rounded-md text-left bg-white">
          <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50">
            <span className="text-xs font-bold text-slate-600">MAPPED COVERS</span>
          </div>
          {policy.products.map((prod) => (
            <div key={prod.name} className="px-4 py-2 border-b border-gray-100 last:border-b-0">
              <div className="text-sm text-slate-700 font-medium">{prod.name}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {prod.covers.map((c) => (
                  <span key={c} className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-medium">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 mt-4">
          Total existing policies mapped: <strong>{totalPolicies}</strong>
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-gray-200 bg-gray-50">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onAddAnother}
        >
          <Plus size={14} />
          Add Another Policy
        </Button>
        <Button
          size="sm"
          className="bg-teal-700 hover:bg-teal-800 text-white px-6"
          onClick={onDone}
        >
          Done
        </Button>
      </div>
    </div>
  );
}

// ── Main modal ───────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: (mappedPolicies: MappedPolicy[]) => void;
  existingPolicies: MappedPolicy[];
}

type Step = 'search' | 'covers' | 'confirm';

const STEP_TITLES: Record<Step, string> = {
  search: 'Step 1 — Search Provider',
  covers: 'Step 2 — Select Covers',
  confirm: 'Policy Mapped',
};

export function MapExistingPolicyModal({ open, onClose, existingPolicies }: Props) {
  const [step, setStep] = useState<Step>('search');
  const [policies, setPolicies] = useState<MappedPolicy[]>(existingPolicies);
  const [currentProvider, setCurrentProvider] = useState('');
  const [currentVersion, setCurrentVersion] = useState('');
  const [lastMapped, setLastMapped] = useState<MappedPolicy | null>(null);

  // Sync when prop changes
  useEffect(() => {
    if (open) {
      setPolicies(existingPolicies);
      setStep('search');
      setCurrentProvider('');
      setCurrentVersion('');
      setLastMapped(null);
    }
  }, [open, existingPolicies]);

  function handleProviderNext(provider: string, version: string) {
    setCurrentProvider(provider);
    setCurrentVersion(version);
    setStep('covers');
  }

  function handleCoverSave(products: MappedProduct[]) {
    const mapped: MappedPolicy = {
      id: `ep-${Date.now()}`,
      provider: currentProvider,
      policyVersion: currentVersion,
      products,
    };
    setPolicies((prev) => [...prev, mapped]);
    setLastMapped(mapped);
    setStep('confirm');
  }

  function handleAddAnother() {
    setStep('search');
    setCurrentProvider('');
    setCurrentVersion('');
    setLastMapped(null);
  }

  function handleDone() {
    onClose(policies);
  }

  function handleCancel() {
    onClose(policies);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleCancel()}>
      <DialogContent className="max-w-2xl w-[680px] p-0 overflow-hidden" style={{ height: '520px', maxHeight: '85vh' }}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 bg-slate-700 text-white">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold">Map Existing Policy</h2>
              <span className="text-xs text-slate-300">— {STEP_TITLES[step]}</span>
            </div>
            <button
              className="text-white/70 hover:text-white p-0.5 rounded hover:bg-white/10"
              onClick={handleCancel}
            >
              <X size={16} />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-0 px-6 py-2 bg-gray-50 border-b border-gray-200">
            {(['search', 'covers', 'confirm'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    s === step
                      ? 'bg-teal-600 text-white'
                      : policies.length > 0 && s === 'confirm' && step !== 'search' && step !== 'covers'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`ml-1.5 text-xs font-medium ${s === step ? 'text-teal-700' : 'text-slate-400'}`}>
                  {s === 'search' ? 'Provider' : s === 'covers' ? 'Covers' : 'Done'}
                </span>
                {i < 2 && <div className="w-8 h-px bg-gray-300 mx-2" />}
              </div>
            ))}
            <div className="flex-1" />
            {policies.length > 0 && (
              <span className="text-xs text-slate-500">
                {policies.length} polic{policies.length === 1 ? 'y' : 'ies'} mapped
              </span>
            )}
          </div>

          {/* Step content */}
          {step === 'search' && (
            <StepProviderSearch onNext={handleProviderNext} />
          )}
          {step === 'covers' && (
            <StepCoverSelection
              provider={currentProvider}
              version={currentVersion}
              onBack={() => setStep('search')}
              onSave={handleCoverSave}
            />
          )}
          {step === 'confirm' && lastMapped && (
            <StepConfirmation
              policy={lastMapped}
              totalPolicies={policies.length}
              onAddAnother={handleAddAnother}
              onDone={handleDone}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
