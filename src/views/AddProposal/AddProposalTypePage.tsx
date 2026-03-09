import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import type { EntityOwner, PlanReviewProposal, PlanReviewEntry, Recommendation } from '@/types/domain';

const ALL_CARDS = [
  {
    id: 'plan-review',
    title: 'Plan Review',
    category: 'all',
    bullets: [
      'Allows for the reviewing of current plan/s.',
      'The best use of this proposal type is when there are multiple existing plans and multiple actions need to be assessed (switches and rollovers).',
    ],
  },
  {
    id: 'like-for-like',
    title: 'Like-for-Like',
    category: 'assets',
    bullets: [
      'Create a Rollover/Consolidate Plans proposal for Super, Pension or Investment Plans where there is more than one existing plan.',
      'Super will roll over to Super, Pension to Pension, and Investment will consolidate with Investment.',
      'Roll in/consolidate all available funds in proportion of existing underlying investment holdings.',
    ],
  },
] as const;

type FilterTab = 'all' | 'retirement' | 'assets';

export function AddProposalTypePage() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();

  const entity = (searchParams.get('entity') ?? 'Client') as EntityOwner;
  const [filter, setFilter] = React.useState<FilterTab>('all');

  const scenario = state.clientFile.scenarios.find((s) => s.id === scenarioId);

  const visibleCards = ALL_CARDS.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'assets') return c.category === 'assets';
    return false;
  });

  function nextProposalLabel() {
    const count = (scenario?.proposals.length ?? 0) + 1;
    return `Proposal ${count} (${entity})`;
  }

  function handlePlanReview() {
    navigate(
      `/scenarios/${scenarioId}/proposals/plan-review/new?entity=${entity}&label=${encodeURIComponent(nextProposalLabel())}`
    );
  }

  function handleLikeForLike() {
    if (!scenario) return;
    const entityData = scenario.entities.find((e) => e.owner === entity);
    if (!entityData || entityData.platforms.length === 0) {
      alert('No platforms found for this entity.');
      return;
    }

    // Group platforms by product type (Super, Pension, Investment, SMSF)
    const byType = new Map<string, typeof entityData.platforms>();
    for (const p of entityData.platforms) {
      const existing = byType.get(p.type) ?? [];
      existing.push(p);
      byType.set(p.type, existing);
    }

    const newProposals: PlanReviewProposal[] = [];
    const ts = Date.now();
    let idx = 0;

    for (const [, platforms] of byType) {
      if (platforms.length < 2) continue;

      const totalBalance = platforms.reduce((sum, p) => sum + p.balance, 0);

      // For each platform as the consolidation target, create one proposal
      for (const target of platforms) {
        idx++;
        const scaleFactor = target.balance > 0 ? totalBalance / target.balance : 1;

        // Scale the target's investment mix to the combined total balance
        const scaledInvestments = target.investments.map((inv, invIdx) => ({
          ...inv,
          id: `${inv.id}-lfl-${ts}-${idx}-${invIdx}`,
          amount: inv.amount * scaleFactor,
        }));

        const entries: PlanReviewEntry[] = platforms.map((p, pIdx) => {
          if (p.id === target.id) {
            // Target: receives all funds, investment mix maintained but scaled
            return {
              id: `lfl-entry-${ts}-${idx}-target-${pIdx}`,
              platform: p,
              recommendation: 'Roll available balance in' as Recommendation,
              proposedInvestments: scaledInvestments,
              proposedBalance: totalBalance,
            };
          }
          // Others: closed, rolling their balance into the target
          return {
            id: `lfl-entry-${ts}-${idx}-close-${pIdx}`,
            platform: p,
            recommendation: 'Close' as Recommendation,
            proposedInvestments: [],
            proposedBalance: 0,
          };
        });

        newProposals.push({
          id: `proposal-lfl-${ts}-${idx}`,
          label: `Move all invests to ${target.name}`,
          kind: 'plan-review',
          owner: entity,
          entries,
        });
      }
    }

    if (newProposals.length === 0) {
      alert('Like-for-Like requires at least two plans of the same type (Super, Pension or Investment).');
      return;
    }

    for (const proposal of newProposals) {
      dispatch({ type: 'ADD_PROPOSAL_ANY', scenarioId: scenarioId!, proposal });
    }
    navigate(`/scenarios/${scenarioId}`);
  }

  const handlers: Record<string, () => void> = {
    'plan-review': handlePlanReview,
    'like-for-like': handleLikeForLike,
  };

  return (
    <div className="p-6">
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          Add Proposal ({entity})
        </h2>
        <Button variant="outline" size="sm" onClick={() => navigate(`/scenarios/${scenarioId}`)}>
          Cancel
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-6 mb-6 border-b border-border pb-2">
        {([
          ['all', 'All plans'],
          ['retirement', 'Retirement'],
          ['assets', 'Assets and Investments'],
        ] as [FilterTab, string][]).map(([value, label]) => (
          <label key={value} className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input
              type="radio"
              name="filter"
              value={value}
              checked={filter === value}
              onChange={() => setFilter(value)}
              className="accent-teal-700"
            />
            {label}
          </label>
        ))}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCards.map((card) => (
          <div key={card.id} className="border border-border rounded p-4 flex flex-col bg-white">
            <h3 className="text-sm font-semibold mb-2">{card.title}</h3>
            <ul className="text-xs text-muted-foreground space-y-1 flex-1 mb-4">
              {card.bullets.map((b, i) => (
                <li key={i} className="text-blue-700">
                  {b}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-3 mt-auto">
              <Button size="sm" variant="outline" onClick={handlers[card.id]}>
                Select
              </Button>
              <button className="text-xs text-blue-600 hover:underline">More Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
