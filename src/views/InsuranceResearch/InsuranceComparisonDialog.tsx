import { useState } from 'react';
import { X, ChevronDown, ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { CreateScenarioModal } from './CreateScenarioModal';
import { ClientDataCapture } from './ClientDataCapture';
import { QuoteLeftPanel } from './QuoteLeftPanel';
import { QuoteResultsPanel } from './QuoteResultsPanel';
import { FeaturesReportModal } from './FeaturesReportModal';
import { MapExistingPolicyModal } from './MapExistingPolicyModal';
import type { MappedPolicy } from './MapExistingPolicyModal';
import { ProductComparisonPage } from './ProductComparisonPage';
import { OptionsModalContent } from './OptionsPanel';
import type { OptionsTab } from './OptionsPanel';
import {
  getDefaultClientData,
  getDefaultQuoteOptions,
  getDefaultLifeCover,
  getDefaultTpd,
  getDefaultIncomeProtection,
  buildPoliciesFromSelection,
  PROVIDER_LIST,
  PROVIDER_LIST_SUPER,
} from './insuranceData';
import { getDefaultQuoteForm } from './quoteFormTypes';
import type { QuoteFormState } from './quoteFormTypes';
import { generateMockQuoteResults, getEmptyQuoteResults } from './quoteResultsData';
import type { QuoteResults } from './quoteResultsData';
import type {
  ClientFormData,
  QuoteOptions,
  LifeCoverOptions,
  TpdOptions,
  TraumaOptions,
  IncomeProtectionOptions,
  BusinessExpensesOptions,
  InsuranceProvider,
  InsurancePolicy,
  DisplayOption,
} from './insuranceData';

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete: (scenarioName: string, policies: InsurancePolicy[]) => void;
  clientName: string;
  partnerName: string;
  existingScenarioNames: string[];
}

// Screens: 'create' | 'personal' | 1 | 2 | 3 | 4 | 'compare' | 'options'
type Screen = 'create' | 'personal' | 1 | 2 | 3 | 4 | 'compare' | 'options';

const DETAIL_LABELS: Record<number, string> = {
  1: 'Insurance Details',
  2: 'Insurance Details 2',
  3: 'Insurance Details 3',
  4: 'Insurance Details 4',
};

// ── Client summary bar ──────────────────────────────────────────────────────

function ClientSummaryBar({
  client,
  partner,
  activeClient,
  onToggleClient,
}: {
  client: ClientFormData;
  partner: ClientFormData | null;
  activeClient: 'client' | 'partner';
  onToggleClient: (who: 'client' | 'partner') => void;
}) {
  const displayed = activeClient === 'partner' && partner ? partner : client;
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-xs flex-wrap">
      <button
        onClick={() => onToggleClient('client')}
        className={`font-bold text-sm mr-0.5 px-2 py-0.5 rounded transition-colors ${
          activeClient === 'client'
            ? 'bg-blue-600 text-white'
            : 'text-slate-300 hover:text-white'
        }`}
      >
        {client.firstName} {client.lastName}
      </button>
      {partner && (
        <>
          <button
            onClick={() => onToggleClient('partner')}
            className={`font-bold text-sm mr-1 px-2 py-0.5 rounded transition-colors ${
              activeClient === 'partner'
                ? 'bg-purple-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {partner.firstName} {partner.lastName}
          </button>
        </>
      )}
      <span className="bg-slate-600 rounded px-2 py-0.5">Age {displayed.age}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="bg-slate-600 rounded px-2 py-0.5 flex items-center gap-1 hover:bg-slate-500">
            {displayed.gender} <ChevronDown size={10} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent><DropdownMenuItem>Male</DropdownMenuItem><DropdownMenuItem>Female</DropdownMenuItem></DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="bg-slate-600 rounded px-2 py-0.5 flex items-center gap-1 hover:bg-slate-500">
            {displayed.smoker === 'No' ? 'Non Smoker' : 'Smoker'} <ChevronDown size={10} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent><DropdownMenuItem>Non Smoker</DropdownMenuItem><DropdownMenuItem>Smoker</DropdownMenuItem></DropdownMenuContent>
      </DropdownMenu>
      <span className="bg-slate-600 rounded px-2 py-0.5">Income {displayed.annualIncome}</span>
      <span className="bg-slate-600 rounded px-2 py-0.5">{displayed.occupation}</span>
      <div className="flex-1" />
      <button className="text-xs hover:underline">Occupation Ratings</button>
      <button className="text-xs hover:underline">Loadings</button>
      <button className="text-xs hover:underline">Quote APL</button>
      <button className="text-xs hover:underline">Scoring</button>
      <button className="text-xs hover:underline">Required Features</button>
      <button className="text-xs text-slate-300 hover:underline">(Back)</button>
    </div>
  );
}

// ── Main dialog ──────────────────────────────────────────────────────────────

export function InsuranceComparisonDialog({
  open,
  onClose,
  onComplete,
  clientName,
  partnerName,
  existingScenarioNames,
}: Props) {
  const clientParts = clientName.split(' ');
  const partnerParts = partnerName.split(' ');

  const [screen, setScreen] = useState<Screen>('create');
  const [scenarioName, setScenarioName] = useState('');
  const [caseType, setCaseType] = useState('Client & Partner');

  const [clientData, setClientData] = useState<ClientFormData>(
    getDefaultClientData(clientParts[0] || 'Example', clientParts.slice(1).join(' ') || 'Client', 61, {
      gender: 'Male',
      dateOfBirth: '15/06/1964',
      state: 'QLD',
      occupationCode: '1P - Accounting Professionals',
    })
  );
  const [partnerData, setPartnerData] = useState<ClientFormData>(
    getDefaultClientData(partnerParts[0] || 'Example', partnerParts.slice(1).join(' ') || 'Partner', 59, {
      gender: 'Female',
      dateOfBirth: '2/07/1966',
      state: 'VIC',
      occupationCode: '2B - Clerical & Administration',
    })
  );

  const [quoteOptions, setQuoteOptions] = useState<QuoteOptions>(getDefaultQuoteOptions());
  const [lifeCover, setLifeCover] = useState<LifeCoverOptions>(getDefaultLifeCover());
  const [tpd, setTpd] = useState<TpdOptions>(getDefaultTpd());
  const [trauma, setTrauma] = useState<TraumaOptions>({ enabled: false });
  const [incomeProtection, setIncomeProtection] = useState<IncomeProtectionOptions>(getDefaultIncomeProtection());
  const [businessExpenses, setBusinessExpenses] = useState<BusinessExpensesOptions>({ enabled: false });

  const [clientQuoteForm, setClientQuoteForm] = useState<QuoteFormState>(
    getDefaultQuoteForm(61, 'Male', '$120,000', 'Generic 4: Clerical', 'QLD')
  );
  const [partnerQuoteForm, setPartnerQuoteForm] = useState<QuoteFormState>(
    getDefaultQuoteForm(59, 'Female', '$100,000', 'Generic 4: Clerical', 'VIC')
  );
  const [clientQuoteResults, setClientQuoteResults] = useState<QuoteResults>(getEmptyQuoteResults());
  const [partnerQuoteResults, setPartnerQuoteResults] = useState<QuoteResults>(getEmptyQuoteResults());

  const [providers, setProviders] = useState<InsuranceProvider[]>(PROVIDER_LIST.map((p) => ({ ...p })));
  const [providersMixed, setProvidersMixed] = useState<InsuranceProvider[]>(PROVIDER_LIST_SUPER.map((p) => ({ ...p })));

  const [premiumFreq, setPremiumFreq] = useState<'Monthly Premium' | 'Annual Premium'>('Monthly Premium');
  const [displayOpts, setDisplayOpts] = useState<Set<DisplayOption>>(new Set());
  const [featuresReportOpen, setFeaturesReportOpen] = useState(false);
  const [mapPolicyOpen, setMapPolicyOpen] = useState(false);
  const [mappedPolicies, setMappedPolicies] = useState<MappedPolicy[]>([]);

  const showPartner = caseType === 'Client & Partner';

  function resetState() {
    setScreen('create');
    setScenarioName('');
    setCaseType('Client & Partner');
    setClientData(getDefaultClientData(clientParts[0] || 'Example', clientParts.slice(1).join(' ') || 'Client', 61, {
      gender: 'Male', dateOfBirth: '15/06/1964', state: 'QLD', occupationCode: '1P - Accounting Professionals',
    }));
    setPartnerData(getDefaultClientData(partnerParts[0] || 'Example', partnerParts.slice(1).join(' ') || 'Partner', 59, {
      gender: 'Female', dateOfBirth: '2/07/1966', state: 'VIC', occupationCode: '2B - Clerical & Administration',
    }));
    setQuoteOptions(getDefaultQuoteOptions());
    setLifeCover(getDefaultLifeCover());
    setTpd(getDefaultTpd());
    setTrauma({ enabled: false });
    setIncomeProtection(getDefaultIncomeProtection());
    setBusinessExpenses({ enabled: false });
    setClientQuoteForm(getDefaultQuoteForm(61, 'Male', '$120,000', 'Generic 4: Clerical', 'QLD'));
    setPartnerQuoteForm(getDefaultQuoteForm(59, 'Female', '$100,000', 'Generic 4: Clerical', 'VIC'));
    setClientQuoteResults(getEmptyQuoteResults());
    setPartnerQuoteResults(getEmptyQuoteResults());
    setActiveClient('client');
    setProviders(PROVIDER_LIST.map((p) => ({ ...p })));
    setProvidersMixed(PROVIDER_LIST_SUPER.map((p) => ({ ...p })));
    setDisplayOpts(new Set());
    setFeaturesReportOpen(false);
    setMapPolicyOpen(false);
    setMappedPolicies([]);
  }

  function handleClose() {
    resetState();
    onClose();
  }

  function handleCreateSave(name: string, selectedCase: string) {
    setScenarioName(name);
    setCaseType(selectedCase);
    setScreen('personal');
  }

  function handleGetQuotes() {
    setScreen(1);
  }

  function toggleDisplayOption(opt: DisplayOption) {
    setDisplayOpts((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  }

  function toggleProvider(id: string) {
    setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p)));
  }
  function toggleProviderMixed(id: string) {
    setProvidersMixed((prev) => prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p)));
  }

  function handleUpdateQuotes() {
    setQuoteResults(generateMockQuoteResults());
  }

  function handleMapPolicyClose(policies: MappedPolicy[]) {
    setMappedPolicies(policies);
    setQuoteForm((prev) => ({
      ...prev,
      existingPolicies: { count: policies.length },
    }));
    setMapPolicyOpen(false);
  }

  const [activeClient, setActiveClient] = useState<'client' | 'partner'>('client');

  // Derived: active quote form & results based on selected entity
  const quoteForm = activeClient === 'partner' ? partnerQuoteForm : clientQuoteForm;
  const setQuoteForm = activeClient === 'partner' ? setPartnerQuoteForm : setClientQuoteForm;
  const quoteResults = activeClient === 'partner' ? partnerQuoteResults : clientQuoteResults;
  const setQuoteResults = activeClient === 'partner' ? setPartnerQuoteResults : setClientQuoteResults;

  const [preCompareScreen, setPreCompareScreen] = useState<Screen>(1);
  const [preOptionsScreen, setPreOptionsScreen] = useState<Screen>(1);
  const [optionsTab, setOptionsTab] = useState<OptionsTab>('defaults');

  function handleToggleQuoteSelect(id: string) {
    setQuoteResults((prev) => ({
      ...prev,
      rows: prev.rows.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)),
    }));
  }

  function handleCompareProducts() {
    setPreCompareScreen(screen);
    setScreen('compare');
  }

  function handleSaveToScenario() {
    const allProviders = [...providers, ...providersMixed];
    const selected = allProviders.filter((p) => p.selected);
    const policies = buildPoliciesFromSelection(
      selected.length > 0 ? selected : providers.slice(0, 3),
      lifeCover,
      tpd,
      incomeProtection,
      clientName,
    );
    onComplete(scenarioName, policies);
    resetState();
  }

  const activeProviders = screen === 2 || screen === 3 ? providersMixed : providers;
  const activeToggle = screen === 2 || screen === 3 ? toggleProviderMixed : toggleProvider;

  // ── Screen: Create Scenario modal ────────────────────────────────────────
  if (screen === 'create') {
    return (
      <CreateScenarioModal
        open={open}
        onSave={handleCreateSave}
        onCancel={handleClose}
        existingNames={existingScenarioNames}
      />
    );
  }

  // ── Screens: Personal Details + Insurance Details 1-4 ────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-[95vw] w-[1400px] p-0 overflow-hidden" style={{ height: '90vh', maxHeight: '90vh' }}>
        <div className="flex flex-col h-full">
          {/* Top header bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-white">
            <div className="flex items-center gap-4 text-xs">
              <span className="font-bold text-sm text-orange-400">OmniLife</span>
              <button className="hover:underline">DOCUMENTS</button>
              <button className="hover:underline">RESEARCH</button>
              <button className="hover:underline">LIVE DATA</button>
              <button className="hover:underline">HELP</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-light tracking-wide">
                {scenarioName}
              </span>
              {/* Options dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 ml-2" title="Options">
                    <Settings size={15} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => { setPreOptionsScreen(screen); setOptionsTab('defaults'); setScreen('options'); }}>
                    Defaults
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setPreOptionsScreen(screen); setOptionsTab('insurerOptions'); setScreen('options'); }}>
                    Insurer Options
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setPreOptionsScreen(screen); setOptionsTab('insurerLogins'); setScreen('options'); }}>
                    Insurer Logins
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setPreOptionsScreen(screen); setOptionsTab('commissions'); setScreen('options'); }}>
                    Commissions
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 ml-2"
                onClick={handleClose}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Personal Details screen */}
          {screen === 'personal' && (
            <>
              <ClientDataCapture
                clientData={clientData}
                partnerData={showPartner ? partnerData : null}
                onClientChange={setClientData}
                onPartnerChange={setPartnerData}
                onLaunchNeedsAnalysis={() => {}}
                onGetQuotes={handleGetQuotes}
              />
            </>
          )}

          {/* Insurance Details screens 1-4 */}
          {typeof screen === 'number' && screen >= 1 && (
            <>
              {/* Client summary */}
              <ClientSummaryBar
                client={clientData}
                partner={showPartner ? partnerData : null}
                activeClient={activeClient}
                onToggleClient={setActiveClient}
              />

              {/* Screen nav tabs */}
              <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 border-b border-gray-200 text-xs">
                <button
                  onClick={() => setScreen('personal')}
                  className="flex items-center gap-1 text-teal-700 hover:underline mr-2"
                >
                  <ArrowLeft size={12} />
                  Personal Details
                </button>
                {([1, 2, 3, 4] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setScreen(s)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      screen === s
                        ? 'bg-teal-700 text-white'
                        : 'bg-white border border-gray-300 text-slate-600 hover:bg-gray-50'
                    }`}
                  >
                    {DETAIL_LABELS[s]}
                  </button>
                ))}
                <div className="flex-1" />
                <Button
                  size="sm"
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-7"
                  onClick={handleSaveToScenario}
                >
                  Save to Scenario
                </Button>
              </div>

              {/* Main content: sidebar + table */}
              <div className="flex flex-1 overflow-hidden">
                <QuoteLeftPanel
                  form={quoteForm}
                  onChange={setQuoteForm}
                  onReset={() => {
                    if (activeClient === 'partner') {
                      setPartnerQuoteForm(getDefaultQuoteForm(59, 'Female', '$100,000', 'Generic 4: Clerical', 'VIC'));
                      setPartnerQuoteResults(getEmptyQuoteResults());
                    } else {
                      setClientQuoteForm(getDefaultQuoteForm(61, 'Male', '$120,000', 'Generic 4: Clerical', 'QLD'));
                      setClientQuoteResults(getEmptyQuoteResults());
                    }
                  }}
                  onSaveQuotes={handleSaveToScenario}
                  onUpdateQuotes={handleUpdateQuotes}
                  onMapExistingPolicies={() => setMapPolicyOpen(true)}
                />
                <QuoteResultsPanel
                  results={quoteResults}
                  onToggleSelect={handleToggleQuoteSelect}
                  onCompareProducts={handleCompareProducts}
                />
              </div>

              {/* Features Report Modal */}
              <FeaturesReportModal
                open={featuresReportOpen}
                onClose={() => setFeaturesReportOpen(false)}
                providers={activeProviders}
              />

              {/* Map Existing Policy Modal */}
              <MapExistingPolicyModal
                open={mapPolicyOpen}
                onClose={handleMapPolicyClose}
                existingPolicies={mappedPolicies}
              />
            </>
          )}

          {/* Compare Products screen */}
          {screen === 'compare' && (
            <ProductComparisonPage
              selectedRows={
                quoteResults.rows.filter((r) => r.selected).length > 0
                  ? quoteResults.rows.filter((r) => r.selected)
                  : quoteResults.rows.slice(0, 4)
              }
              existingRowId={mappedPolicies.length > 0 ? (quoteResults.rows.find((r) => r.selected)?.id ?? null) : null}
              onBack={() => setScreen(preCompareScreen)}
            />
          )}

          {/* Options screen */}
          {screen === 'options' && (
            <OptionsModalContent
              activeTab={optionsTab}
              onTabChange={setOptionsTab}
              onClose={() => setScreen(preOptionsScreen)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
