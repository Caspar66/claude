import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MoreVertical, Shield, TrendingUp, FileText, Plus, Check, ArrowLeft, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useAppContext } from '@/context/AppContext';
import { InsuranceComparisonDialog } from './InsuranceComparisonDialog';
import { InsuranceScenarioDetail } from './InsuranceScenarioDetail';
import { SEED_POLICIES } from './insuranceData';
import type { InsurancePolicy } from './insuranceData';
import { persistResearchState, restoreResearchState } from './integrationHooks';

const STEPS = [
  'About You',
  'Scope',
  'Research',
  'Strategy',
  'Product',
  'Remuneration',
  'Next Steps',
  'Better Position',
  'Presentation',
] as const;

type ResearchTab = 'insurance' | 'investment' | 'investment-commentary';

interface InsuranceScenario {
  id: string;
  name: string;
  source: string;
  createdDate: string;
  createdBy: string;
  lastModifiedDate: string;
  lastModifiedBy: string;
  includedInPlan: boolean;
  policies: InsurancePolicy[];
}

const SEED_SCENARIOS: InsuranceScenario[] = [
  {
    id: 'ins-1',
    name: 'Example Scenario',
    source: 'RiskResearcher - Finura Xplan',
    createdDate: '23 July 2024, 05:00 AM',
    createdBy: 'Aron Satchell',
    lastModifiedDate: '24 November 2025, 01:03 AM',
    lastModifiedBy: 'Aron Satchell',
    includedInPlan: true,
    policies: SEED_POLICIES,
  },
];

export function InsuranceResearchPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const { state } = useAppContext();
  const navigate = useNavigate();

  const scenarios = state.clientFile.scenarios;
  const idx = scenarios.findIndex((s) => s.id === scenarioId);
  const scenario = scenarios[idx];

  const [activeStep] = useState<number>(2); // Research step
  const [activeTab, setActiveTab] = useState<ResearchTab>('insurance');
  const [insuranceScenarios, setInsuranceScenarios] = useState<InsuranceScenario[]>(SEED_SCENARIOS);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  // View state: 'list' shows scenario table, 'detail' shows policy detail
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  if (!scenario) {
    return (
      <div className="p-6 text-muted-foreground">
        Scenario not found.{' '}
        <button className="text-blue-600 underline" onClick={() => navigate('/scenarios')}>
          Back to index
        </button>
      </div>
    );
  }

  function handleToggleInclude(id: string) {
    setInsuranceScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, includedInPlan: !s.includedInPlan } : s))
    );
  }

  function handleViewScenario(id: string) {
    setActiveScenarioId(id);
    setViewMode('detail');
  }

  function handleBackToList() {
    setViewMode('list');
    setActiveScenarioId(null);
  }

  function handleComparisonComplete(name: string, policies: InsurancePolicy[]) {
    const newScenario: InsuranceScenario = {
      id: `ins-${Date.now()}`,
      name,
      source: 'Insurance Comparison',
      createdDate: new Date().toLocaleString('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      createdBy: 'Caspar Jacobs',
      lastModifiedDate: new Date().toLocaleString('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      lastModifiedBy: 'Caspar Jacobs',
      includedInPlan: false,
      policies,
    };
    setInsuranceScenarios((prev) => [...prev, newScenario]);
    setComparisonOpen(false);

    // Navigate into the newly created scenario detail view
    setActiveScenarioId(newScenario.id);
    setViewMode('detail');
  }

  const { client, partner } = state.clientFile;
  const activeInsuranceScenario = insuranceScenarios.find((s) => s.id === activeScenarioId);
  const [activeClient, setActiveClient] = useState<'client' | 'partner'>('client');

  // ── State persistence ─────────────────────────────────────────────────
  useEffect(() => {
    const saved = restoreResearchState();
    if (saved) {
      if (saved.viewMode === 'detail' && saved.activeScenarioId) {
        const exists = insuranceScenarios.some((s) => s.id === saved.activeScenarioId);
        if (exists) {
          setActiveScenarioId(saved.activeScenarioId);
          setViewMode('detail');
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    persistResearchState({
      activeScenarioId,
      viewMode,
      comparisonOpen,
      lastUpdated: new Date().toISOString(),
    });
  }, [activeScenarioId, viewMode, comparisonOpen]);

  // ── Top navigation tabs ───────────────────────────────────────────────
  const TOP_NAV_TABS = [
    'Client Home', 'Fact Find 2.0', 'Assets/Liabilities', 'Cash Flow',
    'Portfolio', 'Tasks', 'File Notes', 'Document Vault', 'Reports',
    'Digital Advice', 'myDataLogic', 'Compliance',
  ] as const;

  return (
    <div className="min-h-full bg-gray-50 flex flex-col">
      {/* ── Back link + Top navigation tabs ──────────────────────────────── */}
      <div className="bg-slate-800 text-white">
        <div className="flex items-center px-4 py-1.5 border-b border-slate-700">
          <button
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white mr-4"
            onClick={() => navigate('/scenarios')}
          >
            <ArrowLeft size={12} />
            Back to Advice Tools
          </button>
          <div className="flex items-center gap-0.5 overflow-x-auto">
            {TOP_NAV_TABS.map((tab) => (
              <button
                key={tab}
                className={`px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap rounded transition-colors ${
                  tab === 'Digital Advice'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── Digital Advice sub-nav ──────────────────────────────────────── */}
        <div className="flex items-center px-4 py-1 text-xs gap-0.5 border-b border-slate-700">
          <button className="px-2 py-1 text-slate-400 hover:text-white rounded hover:bg-slate-700">Asset Allocation Comparison</button>
          <span className="text-slate-600 mx-1">|</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mr-1">Super</span>
          <button className="px-2 py-1 text-slate-400 hover:text-white rounded hover:bg-slate-700">Super Research</button>
          <button className="px-2 py-1 text-slate-400 hover:text-white rounded hover:bg-slate-700">Super Fee Comparison</button>
          <span className="text-slate-600 mx-1">|</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mr-1">Insurance</span>
          <button className="px-2 py-1 text-slate-400 hover:text-white rounded hover:bg-slate-700">Needs Analysis</button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-2 py-1 bg-teal-600 text-white rounded flex items-center gap-1 font-medium">
                <Check size={10} />
                Quoting &amp; Research
                <ChevronDown size={10} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem>Asset Allocation Comparison</DropdownMenuItem>
              <DropdownMenuItem className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold" disabled>Super</DropdownMenuItem>
              <DropdownMenuItem>Super Research</DropdownMenuItem>
              <DropdownMenuItem>Super Fee Comparison</DropdownMenuItem>
              <DropdownMenuItem className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold" disabled>Insurance</DropdownMenuItem>
              <DropdownMenuItem>Needs Analysis</DropdownMenuItem>
              <DropdownMenuItem className="font-medium">
                <Check size={12} className="mr-1.5" />
                Quoting &amp; Research
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold" disabled>Non-Super</DropdownMenuItem>
              <DropdownMenuItem>Platform Research</DropdownMenuItem>
              <DropdownMenuItem>Platform Fee Comparison</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-slate-600 mx-1">|</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mr-1">Non-Super</span>
          <button className="px-2 py-1 text-slate-400 hover:text-white rounded hover:bg-slate-700">Platform Research</button>
          <button className="px-2 py-1 text-slate-400 hover:text-white rounded hover:bg-slate-700">Platform Fee Comparison</button>
        </div>
      </div>

      {/* ── Client context bar ───────────────────────────────────────────── */}
      <div className="bg-white border-b border-border px-6 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center">
              <Shield size={14} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {/* Client/Partner toggle pills */}
                <button
                  onClick={() => setActiveClient('client')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    activeClient === 'client'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-slate-500 hover:bg-gray-200'
                  }`}
                >
                  {client.name}
                </button>
                <button
                  onClick={() => setActiveClient('partner')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    activeClient === 'partner'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-slate-500 hover:bg-gray-200'
                  }`}
                >
                  {partner.name}
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>All Tools</span>
                <span>|</span>
                <span>Dated: {new Date().toLocaleDateString('en-AU')}</span>
                <span>|</span>
                <span>Adviser: Caspar Jacobs</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-orange-600 border border-orange-300 bg-orange-50 rounded px-2 py-0.5">
              Draft
            </span>
          </div>
        </div>
      </div>

      {/* Step navigation */}
      <div className="bg-white px-6 py-3 border-b border-border">
        <div className="flex items-center">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center">
              <div
                className={`px-4 py-2 text-sm font-medium rounded-l ${
                  i <= activeStep
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                } ${i === 0 ? 'rounded-l-full' : ''} ${i === STEPS.length - 1 ? 'rounded-r-full' : ''}`}
              >
                {step}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-0 h-0 border-t-[16px] border-t-transparent border-b-[16px] border-b-transparent border-l-[10px] ${
                    i <= activeStep
                      ? 'border-l-teal-600'
                      : 'border-l-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Research sub-tabs */}
      <div className="bg-white px-6 border-b border-border">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('insurance')}
            className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'insurance'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield size={16} />
            Insurance
          </button>
          <button
            onClick={() => setActiveTab('investment')}
            className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'investment'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp size={16} />
            Investment
          </button>
          <button
            onClick={() => setActiveTab('investment-commentary')}
            className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'investment-commentary'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText size={16} />
            Investment Commentary
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'insurance' && viewMode === 'detail' && activeInsuranceScenario && (
          <div className="bg-white rounded-lg border border-border shadow-sm">
            <InsuranceScenarioDetail
              scenarioName={activeInsuranceScenario.name}
              policies={activeInsuranceScenario.policies}
              onBack={handleBackToList}
            />
          </div>
        )}

        {activeTab === 'insurance' && viewMode === 'list' && (
          <div className="bg-white rounded-lg border border-border shadow-sm">
            {/* Insurance Research header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Insurance Research</h2>
                <p className="text-sm text-muted-foreground">
                  Select scenarios to include in the plan
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  className="bg-teal-700 hover:bg-teal-800 text-white gap-1.5"
                  onClick={() => setComparisonOpen(true)}
                >
                  <Plus size={14} />
                  Add
                </Button>
                <div className="flex items-center gap-1">
                  <button className="text-red-500 hover:text-red-600 p-1">
                    <ChevronLeft size={24} strokeWidth={3} />
                  </button>
                  <button className="text-red-500 hover:text-red-600 p-1">
                    <ChevronRight size={24} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>

            {/* Scenarios table */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="text-left px-6 py-3 font-semibold text-muted-foreground">
                    Scenario Name
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    Source
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    Created
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    Last Modified
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
                    Include in Plan
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {insuranceScenarios.map((s) => (
                  <tr key={s.id} className="border-b border-border hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-muted-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.source}</td>
                    <td className="px-4 py-3">
                      <div className="text-foreground">{s.createdDate}</div>
                      <div className="text-muted-foreground text-xs">{s.createdBy}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-foreground">{s.lastModifiedDate}</div>
                      <div className="text-muted-foreground text-xs">{s.lastModifiedBy}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleInclude(s.id)}
                        className={`w-5 h-5 rounded border-2 inline-flex items-center justify-center transition-colors ${
                          s.includedInPlan
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'border-gray-300 hover:border-teal-500'
                        }`}
                      >
                        {s.includedInPlan && <Check size={14} strokeWidth={3} />}
                      </button>
                    </td>
                    <td className="px-2 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 hover:bg-gray-100 rounded text-muted-foreground hover:text-foreground">
                            <MoreVertical size={16} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleViewScenario(s.id)}>
                            View Scenario
                          </DropdownMenuItem>
                          <DropdownMenuItem>View Replacement</DropdownMenuItem>
                          <DropdownMenuItem>View Like for Like</DropdownMenuItem>
                          <DropdownMenuItem>View Alternatives</DropdownMenuItem>
                          <DropdownMenuItem>View Reports</DropdownMenuItem>
                          <DropdownMenuItem>View Needs Analysis</DropdownMenuItem>
                          <DropdownMenuItem>Refresh Scenario</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {insuranceScenarios.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No insurance scenarios. Click Add to create a comparison.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'investment' && (
          <div className="bg-white rounded-lg border border-border shadow-sm p-8 text-center text-muted-foreground">
            Investment research content will appear here.
          </div>
        )}

        {activeTab === 'investment-commentary' && (
          <div className="bg-white rounded-lg border border-border shadow-sm p-8 text-center text-muted-foreground">
            Investment commentary content will appear here.
          </div>
        )}
      </div>

      {/* Insurance Comparison Dialog */}
      <InsuranceComparisonDialog
        open={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        onComplete={handleComparisonComplete}
        clientName={client.name}
        partnerName={partner.name}
        existingScenarioNames={insuranceScenarios.map((s) => s.name)}
      />
    </div>
  );
}
