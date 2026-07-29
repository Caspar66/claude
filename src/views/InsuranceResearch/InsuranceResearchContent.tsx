import { useState, useEffect } from 'react';
import { MoreVertical, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { InsuranceComparisonDialog } from './InsuranceComparisonDialog';
import { InsuranceScenarioDetail } from './InsuranceScenarioDetail';
import { SEED_POLICIES } from './insuranceData';
import type { InsurancePolicy } from './insuranceData';
import { persistResearchState, restoreResearchState } from './integrationHooks';

export interface InsuranceScenario {
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

interface Props {
  clientName: string;
  partnerName: string;
}

export function InsuranceResearchContent({ clientName, partnerName }: Props) {
  const [insuranceScenarios, setInsuranceScenarios] = useState<InsuranceScenario[]>(SEED_SCENARIOS);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  function handleToggleInclude(id: string) {
    setInsuranceScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, includedInPlan: !s.includedInPlan } : s))
    );
  }

  function handleViewScenario(id: string) {
    setActiveScenarioId(id);
    setViewMode('detail');
  }

  function handleEditScenario(_id: string) {
    setComparisonOpen(true);
  }

  function handleDeleteScenario(id: string) {
    setInsuranceScenarios((prev) => prev.filter((s) => s.id !== id));
    if (activeScenarioId === id) {
      setActiveScenarioId(null);
      setViewMode('list');
    }
  }

  function handleCopyScenario(id: string) {
    const original = insuranceScenarios.find((s) => s.id === id);
    if (!original) return;
    const now = new Date().toLocaleString('en-AU', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
    const copy: InsuranceScenario = {
      ...original,
      id: `ins-${Date.now()}`,
      name: `${original.name} (Copy)`,
      createdDate: now,
      createdBy: 'Caspar Jacobs',
      lastModifiedDate: now,
      lastModifiedBy: 'Caspar Jacobs',
      includedInPlan: false,
    };
    setInsuranceScenarios((prev) => [...prev, copy]);
  }

  function handleRenameScenario(id: string) {
    const original = insuranceScenarios.find((s) => s.id === id);
    if (!original) return;
    const newName = window.prompt('Rename scenario:', original.name);
    if (newName && newName.trim()) {
      setInsuranceScenarios((prev) =>
        prev.map((s) => s.id === id ? { ...s, name: newName.trim() } : s)
      );
    }
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
    setActiveScenarioId(newScenario.id);
    setViewMode('detail');
  }

  const activeInsuranceScenario = insuranceScenarios.find((s) => s.id === activeScenarioId);

  // State persistence
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

  return (
    <>
      {viewMode === 'detail' && activeInsuranceScenario && (
        <div className="bg-white rounded-lg border border-border shadow-sm">
          <InsuranceScenarioDetail
            scenarioName={activeInsuranceScenario.name}
            policies={activeInsuranceScenario.policies}
            onBack={handleBackToList}
          />
        </div>
      )}

      {viewMode === 'list' && (
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
            </div>
          </div>

          {/* Scenarios table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="text-left px-6 py-3 font-semibold text-muted-foreground">Scenario Name</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Source</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Created</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Last Modified</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Include in Plan</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {insuranceScenarios.map((s) => (
                <tr key={s.id} className="border-b border-border hover:bg-slate-50/50">
                  <td className="px-6 py-3">
                    <button
                      onClick={() => handleViewScenario(s.id)}
                      className="text-teal-700 hover:text-teal-800 hover:underline font-medium text-left"
                    >
                      {s.name}
                    </button>
                  </td>
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
                          ? 'bg-teal-700 border-teal-700 text-white'
                          : 'border-slate-300 hover:border-teal-500'
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
                        {s.source === 'Insurance Comparison' ? (
                          <DropdownMenuItem onClick={() => handleEditScenario(s.id)}>
                            Edit Scenario
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem>Refresh Scenario</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleRenameScenario(s.id)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyScenario(s.id)}>
                          Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDeleteScenario(s.id)}
                        >
                          Delete
                        </DropdownMenuItem>
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

      {/* Insurance Comparison Dialog */}
      <InsuranceComparisonDialog
        open={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        onComplete={handleComparisonComplete}
        clientName={clientName}
        partnerName={partnerName}
        existingScenarioNames={insuranceScenarios.map((s) => s.name)}
      />
    </>
  );
}
