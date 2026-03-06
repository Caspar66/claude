import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAppContext } from '@/context/AppContext';
import { InvestmentFundsTab } from './InvestmentFundsTab';
import { BalancesAggregationTab } from './BalancesAggregationTab';

const STUB_TABS = ['Contribution Amounts', 'Pension Details', 'Insurance Premiums'];

export function EditExistingPlanPage() {
  const { scenarioId, platformId } = useParams<{ scenarioId: string; platformId: string }>();
  const { state } = useAppContext();
  const navigate = useNavigate();

  const scenario = state.clientFile.scenarios.find((s) => s.id === scenarioId);
  const platform = scenario?.entities
    .flatMap((e) => e.platforms)
    .find((p) => p.id === platformId);

  if (!scenario || !platform) {
    return (
      <div className="p-6 text-muted-foreground">
        Platform not found.{' '}
        <button className="text-blue-600 underline" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Current Situation ({state.clientFile.client.name})
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold border border-border rounded px-2 py-1">
            CURRENT DATA
          </span>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-teal-700 hover:bg-teal-800 text-white"
            onClick={() => navigate(-1)}
          >
            Save
          </Button>
        </div>
      </div>

      {/* Panel heading */}
      <div className="border border-border rounded">
        <div className="px-4 py-3 bg-teal-700 text-white text-sm font-semibold rounded-t">
          Edit Existing Plan: {platform.name} ({platform.accountNumber})
        </div>

        <Tabs defaultValue="investments">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-gray-50 h-auto p-1 gap-1">
            <TabsTrigger
              value="investments"
              className="text-xs data-[state=active]:bg-teal-700 data-[state=active]:text-white"
            >
              Investment Funds Selection
            </TabsTrigger>
            {STUB_TABS.map((label) => (
              <TabsTrigger
                key={label}
                value={label}
                className="text-xs data-[state=active]:bg-teal-700 data-[state=active]:text-white"
              >
                {label}
              </TabsTrigger>
            ))}
            <TabsTrigger
              value="balances"
              className="text-xs data-[state=active]:bg-teal-700 data-[state=active]:text-white"
            >
              Balances/Aggregation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="investments" className="mt-0">
            <InvestmentFundsTab scenarioId={scenarioId!} platform={platform} />
          </TabsContent>

          {STUB_TABS.map((label) => (
            <TabsContent key={label} value={label} className="mt-0">
              <div className="p-6 text-sm text-muted-foreground text-center">
                {label} — coming soon.
              </div>
            </TabsContent>
          ))}

          <TabsContent value="balances" className="mt-0">
            <BalancesAggregationTab scenarioId={scenarioId!} platform={platform} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
