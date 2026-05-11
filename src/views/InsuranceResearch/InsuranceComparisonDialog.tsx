import { useState } from 'react';
import { X, ChevronDown, ArrowLeft, Settings, Loader2 } from 'lucide-react';
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
import { ClientQuoteTabsPanel } from './ClientQuoteTabsPanel';
import { QuoteResultsPanel } from './QuoteResultsPanel';
import { FeaturesReportModal } from './FeaturesReportModal';
import { MapExistingPolicyModal } from './MapExistingPolicyModal';
import type { MappedPolicy } from './MapExistingPolicyModal';
import { ProductComparisonPage } from './ProductComparisonPage';
import { FeaturesComparisonPage } from './FeaturesComparisonPage';
import { OptionsModalContent } from './OptionsPanel';
import type { OptionsTab } from './OptionsPanel';
import {
  getDefaultClientData,
  getDefaultQuoteOptions,
  getDefaultLifeCover,
  getDefaultTpd,
  getDefaultTraumaExtension,
  getDefaultIncomeProtection,
  getDefaultBusinessExpenses,
  buildPoliciesFromSelection,
  PROVIDER_LIST,
  PROVIDER_LIST_SUPER,
} from './insuranceData';
import { getDefaultQuoteForm } from './quoteFormTypes';
import type { QuoteFormState } from './quoteFormTypes';
import { getEmptyQuoteResults, parsePortfolioResponse } from './quoteResultsData';
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
  ExistingPolicy,
} from './insuranceData';
import type { NeedsQuote } from './needsTypes';
import { NeedsEditor } from './NeedsEditor';
import { buildPortfolioRequest, PORTFOLIO_QUERY_PARAMS } from './portfolioRequest';
import { postQuotePortfolio } from '@/services/omnilifeApi';
import { useOccupations } from '@/hooks/useOccupations';

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete: (scenarioName: string, policies: InsurancePolicy[]) => void;
  clientName: string;
  partnerName: string;
  existingScenarioNames: string[];
}

type Screen = 'create' | 'personal' | 'editQuote' | 1 | 2 | 3 | 4 | 'compare' | 'features' | 'options';

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
      occupationCode: 'Accountant',
    })
  );
  const [partnerData, setPartnerData] = useState<ClientFormData>(
    getDefaultClientData(partnerParts[0] || 'Example', partnerParts.slice(1).join(' ') || 'Partner', 59, {
      gender: 'Female',
      dateOfBirth: '2/07/1966',
      state: 'VIC',
      occupationCode: 'Accountant',
    })
  );

  const [quoteOptions, setQuoteOptions] = useState<QuoteOptions>(getDefaultQuoteOptions());
  const [lifeCover, setLifeCover] = useState<LifeCoverOptions>(getDefaultLifeCover());
  const [tpd, setTpd] = useState<TpdOptions>(getDefaultTpd());
  const [trauma, setTrauma] = useState<TraumaOptions>(getDefaultTraumaExtension());
  const [incomeProtection, setIncomeProtection] = useState<IncomeProtectionOptions>(getDefaultIncomeProtection());
  const [businessExpenses, setBusinessExpenses] = useState<BusinessExpensesOptions>(getDefaultBusinessExpenses());

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

  // Lifted state: existing policies + needs-based quotes from Cover Selection
  const [policies, setPolicies] = useState<ExistingPolicy[]>([]);
  const [coverQuotes, setCoverQuotes] = useState<NeedsQuote[]>([]);

  // Portfolio API state
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [lastQuoteRequestBody, setLastQuoteRequestBody] = useState<Record<string, unknown>>({});

  // Active quote filter (null = show all quotes)
  const [activeQuoteIndex, setActiveQuoteIndex] = useState<number | null>(null);

  // Per-quote generated dates (keyed by quote id)
  const [quoteGeneratedDates, setQuoteGeneratedDates] = useState<Record<string, string>>({});
  const [requotingQuoteId, setRequotingQuoteId] = useState<string | null>(null);

  // Editing a quote from the results page
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);

  const { options: occupations } = useOccupations();

  const showPartner = caseType === 'Client & Partner';

  function resetState() {
    setScreen('create');
    setScenarioName('');
    setCaseType('Client & Partner');
    setClientData(getDefaultClientData(clientParts[0] || 'Example', clientParts.slice(1).join(' ') || 'Client', 61, {
      gender: 'Male', dateOfBirth: '15/06/1964', state: 'QLD', occupationCode: 'Accountant',
    }));
    setPartnerData(getDefaultClientData(partnerParts[0] || 'Example', partnerParts.slice(1).join(' ') || 'Partner', 59, {
      gender: 'Female', dateOfBirth: '2/07/1966', state: 'VIC', occupationCode: 'Accountant',
    }));
    setQuoteOptions(getDefaultQuoteOptions());
    setLifeCover(getDefaultLifeCover());
    setTpd(getDefaultTpd());
    setTrauma(getDefaultTraumaExtension());
    setIncomeProtection(getDefaultIncomeProtection());
    setBusinessExpenses(getDefaultBusinessExpenses());
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
    setPolicies([]);
    setCoverQuotes([]);
    setPortfolioLoading(false);
    setPortfolioError(null);
    setActiveQuoteIndex(null);
    setEditingQuoteId(null);
    setQuoteGeneratedDates({});
    setRequotingQuoteId(null);
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

  async function handleGetQuotes(quotesToUse?: NeedsQuote[]) {
    const quotes = quotesToUse ?? coverQuotes;
    if (quotes.length === 0) return;
    setPortfolioLoading(true);
    setPortfolioError(null);
    try {
      const body = buildPortfolioRequest({
        clientData,
        partnerData: showPartner ? partnerData : null,
        quotes,
        policies,
        occupations,
      });
      setLastQuoteRequestBody(body);
      const res = await postQuotePortfolio(body, PORTFOLIO_QUERY_PARAMS);
      console.info('[OmniLife] /quote/portfolio response:', res.raw);
      const parsed = parsePortfolioResponse(res.raw);
      setQuoteResults(parsed);
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
      const dates: Record<string, string> = {};
      for (const q of quotes) dates[q.id] = dateStr;
      setQuoteGeneratedDates((prev) => ({ ...prev, ...dates }));
      setScreen(1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setPortfolioError(msg);
      setScreen(1);
    } finally {
      setPortfolioLoading(false);
    }
  }

  async function handleSaveQuoteFromResults(updated: NeedsQuote) {
    const updatedQuotes = coverQuotes.map((q) => q.id === updated.id ? updated : q);
    setCoverQuotes(updatedQuotes);
    setEditingQuoteId(null);
    setScreen(1);
    await handleGetQuotes(updatedQuotes);
  }

  function handleSetRecommendation(id: string, value: 'rec' | 'alt' | null) {
    setQuoteResults((prev) => ({
      ...prev,
      rows: prev.rows.map((r) => (r.id === id ? { ...r, recommendation: value } : r)),
    }));
  }

  async function handleRequote(quoteId: string) {
    const quoteIdx = coverQuotes.findIndex((q) => q.id === quoteId);
    if (quoteIdx === -1) return;
    const quote = coverQuotes[quoteIdx];

    setRequotingQuoteId(quoteId);
    try {
      const data = quote.lifeInsured === 'partner' && showPartner ? partnerData : clientData;
      const body = buildPortfolioRequest({
        clientData: data,
        partnerData: null,
        quotes: [quote],
        policies,
        occupations,
      });
      setLastQuoteRequestBody((prev) => {
        const next = { ...prev };
        if (Array.isArray(next.clients)) {
          const clients = [...(next.clients as unknown[])];
          clients[quoteIdx] = (body.clients as unknown[])[0];
          next.clients = clients;
        }
        return next;
      });
      const res = await postQuotePortfolio(body, PORTFOLIO_QUERY_PARAMS);
      console.info('[OmniLife] /quote/portfolio requote response:', res.raw);
      const parsed = parsePortfolioResponse(res.raw);
      setQuoteResults((prev) => {
        const kept = prev.rows.filter((r) => r.quoteIndex !== quoteIdx);
        const keptExcl = prev.excluded.filter((e) => e.quoteIndex !== quoteIdx);
        const newRows = parsed.rows.map((r) => ({ ...r, quoteIndex: quoteIdx }));
        const newExcl = parsed.excluded.map((e) => ({ ...e, quoteIndex: quoteIdx }));
        return { rows: [...kept, ...newRows], excluded: [...keptExcl, ...newExcl], populated: true };
      });
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
      setQuoteGeneratedDates((prev) => ({ ...prev, [quoteId]: dateStr }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setPortfolioError(msg);
    } finally {
      setRequotingQuoteId(null);
    }
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
    handleGetQuotes();
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

  function handleViewCompareFeatures() {
    setPreCompareScreen(screen);
    setScreen('features');
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
              {portfolioError && (
                <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-xs text-red-700">
                  Quote request failed: {portfolioError}
                </div>
              )}
              <ClientDataCapture
                clientData={clientData}
                partnerData={showPartner ? partnerData : null}
                onClientChange={setClientData}
                onPartnerChange={setPartnerData}
                onLaunchNeedsAnalysis={() => {}}
                onGetQuotes={() => handleGetQuotes()}
                policies={policies}
                onChangePolicies={setPolicies}
                quotes={coverQuotes}
                onChangeQuotes={setCoverQuotes}
                getQuotesDisabled={portfolioLoading}
                getQuotesLabel={portfolioLoading ? 'Fetching quotes…' : undefined}
              />
            </>
          )}

          {/* Edit Quote from results (NeedsEditor) */}
          {screen === 'editQuote' && editingQuoteId && (() => {
            const editQuote = coverQuotes.find((q) => q.id === editingQuoteId);
            if (!editQuote) return null;
            const clientDisplayName = `${clientData.lastName || 'Client'}, ${clientData.firstName || ''}`.trim().replace(/,$/, '');
            const partnerDisplayName = showPartner && partnerData
              ? `${partnerData.lastName || 'Partner'}, ${partnerData.firstName || ''}`.trim().replace(/,$/, '')
              : null;
            return (
              <NeedsEditor
                quote={editQuote}
                clientName={clientDisplayName}
                partnerName={partnerDisplayName}
                onSave={handleSaveQuoteFromResults}
                onCancel={() => { setEditingQuoteId(null); setScreen(1); }}
              />
            );
          })()}

          {/* Insurance Details screens 1-4 */}
          {typeof screen === 'number' && screen >= 1 && (
            <>
              {/* Client summary */}
              <ClientSummaryBar
                client={clientData}
                partner={showPartner ? partnerData : null}
                activeClient={activeClient}
                onToggleClient={(who) => { setActiveClient(who); setActiveQuoteIndex(null); }}
              />

              {/* Screen nav: Back + Save */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border-b border-gray-200 text-xs">
                <button
                  onClick={() => setScreen('personal')}
                  className="flex items-center gap-1 text-navy hover:underline"
                >
                  <ArrowLeft size={12} />
                  Personal Details
                </button>
                {portfolioLoading && (
                  <span className="flex items-center gap-1 text-slate-500 ml-2">
                    <Loader2 size={12} className="animate-spin" />
                    Fetching quotes…
                  </span>
                )}
                {portfolioError && !portfolioLoading && (
                  <span className="text-red-600 ml-2">Quote error: {portfolioError}</span>
                )}
                <div className="flex-1" />
                <Button
                  size="sm"
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-7"
                  onClick={handleSaveToScenario}
                >
                  Save to Scenario
                </Button>
              </div>

              {/* Main content: tabbed client/quote panel + results table */}
              <div className="flex flex-1 overflow-hidden">
                <ClientQuoteTabsPanel
                  clientData={clientData}
                  partnerData={showPartner ? partnerData : null}
                  activeClient={activeClient}
                  quotes={coverQuotes}
                  activeQuoteIndex={activeQuoteIndex}
                  onSelectQuote={setActiveQuoteIndex}
                  onEditQuote={(id) => {
                    setEditingQuoteId(id);
                    setScreen('editQuote');
                  }}
                  quoteGeneratedDates={quoteGeneratedDates}
                  onRequote={handleRequote}
                  requotingQuoteId={requotingQuoteId}
                />
                <QuoteResultsPanel
                  results={quoteResults}
                  activeQuoteIndex={activeQuoteIndex}
                  activeClient={activeClient}
                  quotes={coverQuotes}
                  quoteRequestBody={lastQuoteRequestBody}
                  onToggleSelect={handleToggleQuoteSelect}
                  onSetRecommendation={handleSetRecommendation}
                  onCompareProducts={handleCompareProducts}
                  onViewCompareFeatures={handleViewCompareFeatures}
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

          {/* Features Comparison screen */}
          {screen === 'features' && activeQuoteIndex !== null && (() => {
            const quoteRows = quoteResults.rows.filter((r) => r.quoteIndex === activeQuoteIndex);
            const selected = quoteRows.filter((r) => r.selected);
            return (
              <FeaturesComparisonPage
                selectedRows={selected.length > 0 ? selected : quoteRows.slice(0, 4)}
                quoteRequestBody={lastQuoteRequestBody}
                activeQuoteIndex={activeQuoteIndex}
                onBack={() => setScreen(preCompareScreen)}
              />
            );
          })()}

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
