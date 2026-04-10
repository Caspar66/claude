import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, TrendingUp, FileText } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { InsuranceResearchContent } from './InsuranceResearchContent';

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

export function InsuranceResearchPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const { state } = useAppContext();
  const navigate = useNavigate();

  const scenarios = state.clientFile.scenarios;
  const idx = scenarios.findIndex((s) => s.id === scenarioId);
  const scenario = scenarios[idx];

  const [activeStep] = useState<number>(2); // Research step
  const [activeTab, setActiveTab] = useState<ResearchTab>('insurance');

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

  const { client, partner } = state.clientFile;

  return (
    <div className="min-h-full bg-gray-50 flex flex-col">
      {/* ── Client context bar ───────────────────────────────────────────── */}
      <div className="bg-white border-b border-border px-6 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center">
              <Shield size={14} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-foreground">{client.name}</span>
                <span className="text-sm text-muted-foreground">&amp;</span>
                <span className="text-sm font-semibold text-foreground">{partner.name}</span>
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
        {activeTab === 'insurance' && (
          <InsuranceResearchContent
            clientName={client.name}
            partnerName={partner.name}
          />
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
    </div>
  );
}
