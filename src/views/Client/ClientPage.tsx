import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { HelpCircle, Link2, Bell, MoreVertical, Shield, TrendingUp, Users, Filter } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { InsuranceResearchContent } from '@/views/InsuranceResearch/InsuranceResearchContent';
import { ScenarioSelectionPanel } from '@/views/ScenarioIndex/ScenarioSelectionPanel';
import { ScenarioTable } from '@/views/ScenarioIndex/ScenarioTable';

// ── Types ────────────────────────────────────────────────────────────────────

type ClientTab = 'factFind' | 'plans' | 'reviews' | 'relatedEntities' | 'research';
type ResearchSubTab = 'insurance' | 'investment';

const CLIENT_TABS: { key: ClientTab; label: string }[] = [
  { key: 'factFind', label: 'Fact Find' },
  { key: 'plans', label: 'Plans' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'relatedEntities', label: 'Related Entities' },
  { key: 'research', label: 'Research' },
];

// ── Top navigation bar ──────────────────────────────────────────────────────

function TopNav() {
  return (
    <header className="h-11 bg-slate-800 text-white flex items-center px-4 gap-0 flex-shrink-0">
      {/* Logo */}
      <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center mr-4">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 12L8 3L13 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 3V12" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        {['Dashboard', 'Plans', 'Reviews', 'Clients'].map((item) => (
          <NavLink
            key={item}
            to={item === 'Clients' ? '/clients' : '#'}
            className={({ isActive }) =>
              `px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                item === 'Clients' && isActive
                  ? 'text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`
            }
          >
            {item}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Version stamp + Right side icons */}
      <div className="flex items-center gap-3 text-slate-300">
        <span className="text-[10px] text-slate-400 font-mono">v 17 Apr 2026 17:45</span>
        <button className="hover:text-white"><HelpCircle size={18} /></button>
        <button className="hover:text-white"><Link2 size={18} /></button>
        <button className="hover:text-white"><Bell size={18} /></button>
      </div>

      {/* User */}
      <div className="ml-4 flex items-center gap-2">
        <div className="text-right">
          <div className="text-xs font-medium text-white leading-tight">Caspar Jacobs</div>
          <div className="text-[10px] text-slate-400 leading-tight">Fin WS2 L1 O1</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
          <Users size={14} className="text-slate-300" />
        </div>
      </div>
    </header>
  );
}

// ── Related Entities placeholder ────────────────────────────────────────────

function RelatedEntitiesTable() {
  return (
    <div className="bg-white rounded-lg border border-border shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-gray-50">
            <th className="text-left px-6 py-3 font-semibold text-muted-foreground">
              <div className="flex items-center gap-2">Client Name <Filter size={12} className="text-gray-400" /></div>
            </th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
              <div className="flex items-center gap-2">Adviser <Filter size={12} className="text-gray-400" /></div>
            </th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
              <div className="flex items-center gap-2">Fact Find Source <Filter size={12} className="text-gray-400" /></div>
            </th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
              <div className="flex items-center gap-2">Entity Type <Filter size={12} className="text-gray-400" /></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
              No data
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── Main Client Page ────────────────────────────────────────────────────────

export function ClientPage() {
  const { state } = useAppContext();
  const { client, partner } = state.clientFile;

  const [activeTab, setActiveTab] = useState<ClientTab>('research');
  const [researchSubTab, setResearchSubTab] = useState<ResearchSubTab>('insurance');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <TopNav />

      {/* Client info card */}
      <div className="bg-white border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-md bg-slate-200 flex items-center justify-center shrink-0">
              <Shield size={24} className="text-slate-500" />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-800">
                  {client.name} and {partner.name}
                </h1>
                <span className="text-xs font-semibold text-emerald-600 border border-emerald-300 bg-emerald-50 rounded-full px-2.5 py-0.5">
                  Active
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>XPLAN ID: 30328</span>
                <span>Last Import Date: 04/12/2024</span>
              </div>
            </div>

            {/* Actions */}
            <button className="p-1.5 hover:bg-gray-100 rounded text-muted-foreground hover:text-foreground">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center gap-0">
            {CLIENT_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1">
        <div className="max-w-[1400px] mx-auto">
          {/* Fact Find placeholder */}
          {activeTab === 'factFind' && (
            <div className="p-6">
              <div className="bg-white rounded-lg border border-border shadow-sm p-8 text-center text-muted-foreground">
                Fact Find content will appear here.
              </div>
            </div>
          )}

          {/* Plans placeholder */}
          {activeTab === 'plans' && (
            <div className="p-6">
              <div className="bg-white rounded-lg border border-border shadow-sm p-8 text-center text-muted-foreground">
                Plans content will appear here.
              </div>
            </div>
          )}

          {/* Reviews placeholder */}
          {activeTab === 'reviews' && (
            <div className="p-6">
              <div className="bg-white rounded-lg border border-border shadow-sm p-8 text-center text-muted-foreground">
                Reviews content will appear here.
              </div>
            </div>
          )}

          {/* Related Entities */}
          {activeTab === 'relatedEntities' && (
            <div className="p-6">
              <RelatedEntitiesTable />
            </div>
          )}

          {/* Research tab */}
          {activeTab === 'research' && (
            <>
              {/* Research sub-tabs */}
              <div className="bg-white border-b border-border px-6">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setResearchSubTab('insurance')}
                    className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                      researchSubTab === 'insurance'
                        ? 'border-teal-600 text-teal-600'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Shield size={16} />
                    Insurance
                  </button>
                  <button
                    onClick={() => setResearchSubTab('investment')}
                    className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                      researchSubTab === 'investment'
                        ? 'border-teal-600 text-teal-600'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <TrendingUp size={16} />
                    Investment
                  </button>
                </div>
              </div>

              {/* Research sub-tab content */}
              <div className="p-6">
                {researchSubTab === 'insurance' && (
                  <InsuranceResearchContent
                    clientName={client.name}
                    partnerName={partner.name}
                  />
                )}

                {researchSubTab === 'investment' && (
                  <>
                    <ScenarioSelectionPanel />
                    <ScenarioTable />
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
