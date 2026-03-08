import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { useAppContext } from '@/context/AppContext';
import { PersonalDetailsSection } from './PersonalDetailsSection';
import { CurrentSituationSection } from './CurrentSituationSection';
import { ProposalsSection } from './ProposalsSection';

export function ScenarioDetailsPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const { state } = useAppContext();
  const navigate = useNavigate();

  const scenarios = state.clientFile.scenarios;
  const idx = scenarios.findIndex((s) => s.id === scenarioId);
  const scenario = scenarios[idx];

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

  const prev = idx > 0 ? scenarios[idx - 1] : null;
  const next = idx < scenarios.length - 1 ? scenarios[idx + 1] : null;

  return (
    <div className="p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!prev}
            onClick={() => prev && navigate(`/scenarios/${prev.id}`)}
          >
            <ChevronLeft size={14} />
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!next}
            onClick={() => next && navigate(`/scenarios/${next.id}`)}
          >
            Next
            <ChevronRight size={14} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 size={11} />
            Research in scenario is up to date
          </Badge>
          <span className="text-xs font-semibold text-muted-foreground border border-border rounded px-2 py-1">
            CURRENT DATA
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                Actions <ChevronDown size={12} className="ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Add related entity</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Super fund</DropdownMenuItem>
                  <DropdownMenuItem>Investment account</DropdownMenuItem>
                  <DropdownMenuItem>Pension account</DropdownMenuItem>
                  <DropdownMenuItem>SMSF</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem>Fact Find</DropdownMenuItem>
              <DropdownMenuItem>Recommendation Reason</DropdownMenuItem>
              <DropdownMenuItem>Insurance Needs</DropdownMenuItem>
              <DropdownMenuItem>Check for updated data</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Quick Merge</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Merge client data</DropdownMenuItem>
                  <DropdownMenuItem>Merge partner data</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem>Compliance</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Scenario name */}
      <h2 className="text-base font-semibold text-foreground mb-4">
        {scenario.name}
        {scenario.isLocked && (
          <span className="ml-2 text-xs text-amber-600 font-medium">[Locked]</span>
        )}
      </h2>

      <PersonalDetailsSection
        client={state.clientFile.client}
        partner={state.clientFile.partner}
      />

      <CurrentSituationSection entities={scenario.entities} scenarioId={scenarioId!} />

      <ProposalsSection proposals={scenario.proposals} />
    </div>
  );
}
