import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';

export function EditFeesPage() {
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Current Situation ({state.clientFile.client.name})
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold border border-border rounded px-2 py-1">
            CURRENT DATA
          </span>
          <Button variant="outline" size="sm" onClick={() => navigate(`/scenarios/${scenarioId}`)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-teal-700 hover:bg-teal-800 text-white"
            onClick={() => navigate(`/scenarios/${scenarioId}`)}
          >
            Save
          </Button>
        </div>
      </div>

      <div className="border border-border rounded">
        <div className="px-4 py-3 bg-teal-700 text-white text-sm font-semibold rounded-t">
          Edit Existing Fees: {platform.name} ({platform.accountNumber})
        </div>
        <div className="p-8 text-center text-sm text-muted-foreground">
          Fee calculator — coming in a future sprint.
        </div>
      </div>
    </div>
  );
}
