import { useState } from 'react';
import { X, ChevronDown, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { ClientDataCapture } from './ClientDataCapture';
import { QuoteOptionsSidebar } from './QuoteOptionsSidebar';
import { ProviderResultsTable } from './ProviderResultsTable';
import { FeaturesReportModal } from './FeaturesReportModal';
import {
  getDefaultClientData,
  getDefaultQuoteOptions,
  getDefaultLifeCover,
  getDefaultTpd,
  getDefaultIncomeProtection,
  PROVIDER_LIST,
  PROVIDER_LIST_SUPER,
} from './insuranceData';
import type {
  ClientFormData,
  QuoteOptions,
  LifeCoverOptions,
  TpdOptions,
  TraumaOptions,
  IncomeProtectionOptions,
  BusinessExpensesOptions,
  InsuranceProvider,
  DisplayOption,
} from './insuranceData';

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete: (scenarioName: string) => void;
  clientName: string;
  partnerName: string;
}

// Screens: 0=ClientData, 1=InsDetails, 2=InsDetails2, 3=InsDetails3, 4=InsDetails4
type Screen = 0 | 1 | 2 | 3 | 4;

const SCREEN_LABELS: Record<Screen, string> = {
  0: 'Client Data Capture',
  1: 'Insurance Details',
  2: 'Insurance Details 2',
  3: 'Insurance Details 3',
  4: 'Insurance Details 4',
};

// ── Client summary bar (shown on screens 1-4) ────────────────────────────────

function ClientSummaryBar({ client }: { client: ClientFormData }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-xs flex-wrap">
      <span className="font-bold text-base mr-2">{client.firstName} {client.lastName}</span>
      <span className="bg-slate-600 rounded px-2 py-0.5">Age {client.age}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="bg-slate-600 rounded px-2 py-0.5 flex items-center gap-1 hover:bg-slate-500">
            {client.gender} <ChevronDown size={10} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent><DropdownMenuItem>Male</DropdownMenuItem><DropdownMenuItem>Female</DropdownMenuItem></DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="bg-slate-600 rounded px-2 py-0.5 flex items-center gap-1 hover:bg-slate-500">
            {client.smoker === 'No' ? 'Non Smoker' : 'Smoker'} <ChevronDown size={10} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent><DropdownMenuItem>Non Smoker</DropdownMenuItem><DropdownMenuItem>Smoker</DropdownMenuItem></DropdownMenuContent>
      </DropdownMenu>
      <span className="bg-slate-600 rounded px-2 py-0.5">Income {client.annualIncome}</span>
      <span className="bg-slate-600 rounded px-2 py-0.5">{client.occupation}</span>
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
}: Props) {
  const [firstName] = clientName.split(' ');
  const [lastName] = clientName.split(' ').slice(1);

  const [screen, setScreen] = useState<Screen>(0);
  const [clientData, setClientData] = useState<ClientFormData>(
    getDefaultClientData(firstName || 'Sample', lastName || 'Client', 46)
  );
  const [quoteOptions, setQuoteOptions] = useState<QuoteOptions>(getDefaultQuoteOptions());
  const [lifeCover, setLifeCover] = useState<LifeCoverOptions>(getDefaultLifeCover());
  const [tpd, setTpd] = useState<TpdOptions>(getDefaultTpd());
  const [trauma, setTrauma] = useState<TraumaOptions>({ enabled: false });
  const [incomeProtection, setIncomeProtection] = useState<IncomeProtectionOptions>(getDefaultIncomeProtection());
  const [businessExpenses, setBusinessExpenses] = useState<BusinessExpensesOptions>({ enabled: false });

  // Screen 1 & 4: basic non-super list
  const [providers, setProviders] = useState<InsuranceProvider[]>(PROVIDER_LIST.map((p) => ({ ...p })));
  // Screen 2 & 3: show super + non-super
  const [providersMixed, setProvidersMixed] = useState<InsuranceProvider[]>(PROVIDER_LIST_SUPER.map((p) => ({ ...p })));

  const [premiumFreq, setPremiumFreq] = useState<'Monthly Premium' | 'Annual Premium'>('Monthly Premium');
  const [displayOpts, setDisplayOpts] = useState<Set<DisplayOption>>(new Set());
  const [featuresReportOpen, setFeaturesReportOpen] = useState(false);

  function resetState() {
    setScreen(0);
    setClientData(getDefaultClientData(firstName || 'Sample', lastName || 'Client', 46));
    setQuoteOptions(getDefaultQuoteOptions());
    setLifeCover(getDefaultLifeCover());
    setTpd(getDefaultTpd());
    setTrauma({ enabled: false });
    setIncomeProtection(getDefaultIncomeProtection());
    setBusinessExpenses({ enabled: false });
    setProviders(PROVIDER_LIST.map((p) => ({ ...p })));
    setProvidersMixed(PROVIDER_LIST_SUPER.map((p) => ({ ...p })));
    setDisplayOpts(new Set());
    setFeaturesReportOpen(false);
  }

  function handleClose() {
    resetState();
    onClose();
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

  function handleSave() {
    const name = `Insurance Comparison ${new Date().toLocaleDateString('en-AU')}`;
    onComplete(name);
    resetState();
  }

  // Current active providers list based on screen
  const activeProviders = screen === 2 || screen === 3 ? providersMixed : providers;
  const activeToggle = screen === 2 || screen === 3 ? toggleProviderMixed : toggleProvider;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-[95vw] w-[1400px] p-0 overflow-hidden" style={{ height: '90vh', maxHeight: '90vh' }}>
        <div className="flex flex-col h-full">
          {/* Screen 0: Client Data Capture */}
          {screen === 0 && (
            <>
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-white">
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-bold text-sm text-orange-400">OmniLife</span>
                  <button className="hover:underline">DOCUMENTS</button>
                  <button className="hover:underline">RESEARCH</button>
                  <button className="hover:underline">LIVE DATA</button>
                  <button className="hover:underline">HELP</button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-light tracking-wide">Premiums</span>
                  <button
                    className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 ml-4"
                    onClick={handleClose}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                <ClientDataCapture
                  data={clientData}
                  onChange={setClientData}
                  onLaunchNeedsAnalysis={() => {}}
                  onGetQuotes={handleGetQuotes}
                />
              </div>
            </>
          )}

          {/* Screens 1-4: Quote results layout */}
          {screen >= 1 && (
            <>
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
                  <span className="text-lg font-light tracking-wide">Premiums</span>
                  <button
                    className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 ml-4"
                    onClick={handleClose}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Client summary */}
              <ClientSummaryBar client={clientData} />

              {/* Screen nav tabs */}
              <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 border-b border-gray-200 text-xs">
                <button
                  onClick={() => setScreen(0)}
                  className="flex items-center gap-1 text-teal-700 hover:underline mr-2"
                >
                  <ArrowLeft size={12} />
                  Client Data
                </button>
                {([1, 2, 3, 4] as Screen[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setScreen(s)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      screen === s
                        ? 'bg-teal-700 text-white'
                        : 'bg-white border border-gray-300 text-slate-600 hover:bg-gray-50'
                    }`}
                  >
                    {SCREEN_LABELS[s]}
                  </button>
                ))}
                <div className="flex-1" />
                <Button
                  size="sm"
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-7"
                  onClick={handleSave}
                >
                  Save to Scenario
                </Button>
              </div>

              {/* Main content: sidebar + table */}
              <div className="flex flex-1 overflow-hidden">
                <QuoteOptionsSidebar
                  quoteOptions={quoteOptions}
                  lifeCover={lifeCover}
                  tpd={tpd}
                  trauma={trauma}
                  incomeProtection={incomeProtection}
                  businessExpenses={businessExpenses}
                  onQuoteOptionsChange={setQuoteOptions}
                  onLifeCoverChange={setLifeCover}
                  onTpdChange={setTpd}
                  onTraumaChange={setTrauma}
                  onIncomeProtectionChange={setIncomeProtection}
                  onBusinessExpensesChange={setBusinessExpenses}
                />
                <ProviderResultsTable
                  providers={activeProviders}
                  onToggleProvider={activeToggle}
                  premiumFrequency={premiumFreq}
                  onPremiumFrequencyChange={setPremiumFreq}
                  displayOptions={displayOpts}
                  onToggleDisplayOption={toggleDisplayOption}
                  onViewFeatures={() => {}}
                  onCompareFeatures={screen === 3 ? () => {} : undefined}
                  onReport={() => setFeaturesReportOpen(true)}
                />
              </div>

              {/* Features Report Modal (Screen 3 feature) */}
              <FeaturesReportModal
                open={featuresReportOpen}
                onClose={() => setFeaturesReportOpen(false)}
                providers={activeProviders}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
