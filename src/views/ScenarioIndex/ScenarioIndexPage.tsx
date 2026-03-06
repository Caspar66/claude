import { ScenarioSelectionPanel } from './ScenarioSelectionPanel';
import { ScenarioTable } from './ScenarioTable';

export function ScenarioIndexPage() {
  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Scenario Index</h2>
        <p className="text-sm text-muted-foreground">Manage and navigate between advice scenarios.</p>
      </div>

      <ScenarioSelectionPanel />
      <ScenarioTable />
    </div>
  );
}
