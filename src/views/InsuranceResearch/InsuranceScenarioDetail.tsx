import { useState } from 'react';
import { Minus, Plus, ArrowLeft, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { InsurancePolicy, PolicyStatus } from './insuranceData';

interface Props {
  scenarioName: string;
  policies: InsurancePolicy[];
  onBack: () => void;
}

const STATUS_STYLES: Record<PolicyStatus, string> = {
  Alternative: 'text-slate-600',
  Replace: 'text-slate-600',
  'Like For Like': 'text-slate-600',
  Recommend: 'text-slate-600',
};

function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function InsuranceScenarioDetail({ scenarioName, policies: initialPolicies, onBack }: Props) {
  const [policies, setPolicies] = useState(initialPolicies);

  function toggleExpand(id: string) {
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, expanded: !p.expanded } : p))
    );
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">Insurance Research</h2>
          <span className="text-sm text-muted-foreground">
            <button onClick={onBack} className="text-muted-foreground hover:text-teal-700 hover:underline">
              Scenarios
            </button>
            {' > '}
            <span className="text-foreground">{scenarioName}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-gray-100 rounded text-slate-500 hover:text-slate-700"
            title="Back to scenarios"
          >
            <ArrowLeft size={18} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 hover:bg-gray-100 rounded text-slate-500 hover:text-slate-700">
                <MoreVertical size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>Export to PDF</DropdownMenuItem>
              <DropdownMenuItem>Print Summary</DropdownMenuItem>
              <DropdownMenuItem>Delete Scenario</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Policy table */}
      <div className="px-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="w-10" />
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Policy Details</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 w-40">Insurer</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500 w-28">Premium p.a.</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 w-24">Frequency</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 w-28">Status</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {policies.map((policy) => (
              <PolicyRow
                key={policy.id}
                policy={policy}
                onToggleExpand={() => toggleExpand(policy.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Policy row with expandable covers ─────────────────────────────────────────

function PolicyRow({
  policy,
  onToggleExpand,
}: {
  policy: InsurancePolicy;
  onToggleExpand: () => void;
}) {
  return (
    <>
      {/* Main policy row */}
      <tr className="border-b border-gray-200 hover:bg-slate-50/50">
        <td className="px-2 py-2.5">
          <button
            onClick={onToggleExpand}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${
              policy.expanded ? 'bg-slate-400' : 'bg-teal-700'
            }`}
          >
            {policy.expanded ? <Minus size={14} /> : <Plus size={14} />}
          </button>
        </td>
        <td className="px-3 py-2.5 text-sm text-slate-500">{policy.policyName}</td>
        <td className="px-3 py-2.5 text-sm text-slate-700">{policy.insurer}</td>
        <td className="px-3 py-2.5 text-sm text-slate-800 text-right font-medium">
          {formatCurrency(policy.premiumPA)}
        </td>
        <td className="px-3 py-2.5 text-sm text-slate-600">{policy.frequency}</td>
        <td className={`px-3 py-2.5 text-sm ${STATUS_STYLES[policy.status]}`}>
          {policy.status}
        </td>
        <td className="px-1 py-2.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-gray-100 rounded text-slate-400 hover:text-slate-600">
                <MoreVertical size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem>Edit Policy</DropdownMenuItem>
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Change Status</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Remove Policy</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>

      {/* Expanded cover details */}
      {policy.expanded && policy.covers.length > 0 && (
        <tr>
          <td />
          <td colSpan={6} className="pb-3">
            <table className="w-full text-sm ml-2">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 w-16">Type</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 w-28">Definition</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 w-32">Owner</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 w-32">Life Insured</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 w-32">Benefit Amount</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 w-28">Waiting Period</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 w-28">Benefit Period</th>
                </tr>
              </thead>
              <tbody>
                {policy.covers.map((cover, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-2 text-teal-700">{cover.type}</td>
                    <td className="px-3 py-2 text-slate-600">{cover.definition ?? ''}</td>
                    <td className="px-3 py-2 text-teal-700">{cover.owner}</td>
                    <td className="px-3 py-2 text-teal-700">{cover.lifeInsured}</td>
                    <td className="px-3 py-2 text-right text-slate-800">
                      {formatCurrency(cover.benefitAmount)}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{cover.waitingPeriod ?? ''}</td>
                    <td className="px-3 py-2 text-slate-600">{cover.benefitPeriod ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}
