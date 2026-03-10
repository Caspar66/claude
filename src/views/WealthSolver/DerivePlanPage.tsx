import { useParams, useNavigate } from 'react-router-dom';
import { useWealthSolver } from '@/context/WealthSolverContext';
import { PlanFormPage } from './PlanFormPage';

export function DerivePlanPage() {
  const { planId } = useParams<{ planId: string }>();
  const { state } = useWealthSolver();
  const navigate = useNavigate();

  const sourcePlan = state.plans.find((p) => p.id === planId);
  if (!sourcePlan) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Plan not found.{' '}
        <button className="text-teal-700 underline" onClick={() => navigate('/research/plans')}>
          Back to plans
        </button>
      </div>
    );
  }

  return <PlanFormPage mode="derive" sourcePlan={sourcePlan} />;
}
