import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import type { EntityOwner, Proposal } from '@/types/domain';

const ALL_CARDS = [
  {
    id: 'plan-review',
    title: 'Plan Review',
    category: 'all',
    enabled: true,
    bullets: [
      'Allows for the reviewing of current plan/s.',
      'The best use of this proposal type is when there are multiple existing plans and multiple actions need to be assessed (switches and rollovers).',
    ],
  },
  {
    id: 'switch-investments',
    title: 'Switch Investments',
    category: 'assets',
    enabled: false,
    bullets: ['Allows for the switching between investment options in a plan.'],
  },
  {
    id: 'auto-plan-review',
    title: 'Automatic Plan Review',
    category: 'retirement',
    enabled: false,
    notConfigured: true,
    bullets: [
      'Uses a Hold and Acquire list to automatically replace superannuation plans and selects a Model Portfolio matching the client\'s Risk Profile.',
      'The Acquire list can be tailored to suit needs by grouping mutually exclusive age and balance ranges.',
    ],
  },
  {
    id: 'auto-switch',
    title: 'Automatic Switch',
    category: 'retirement',
    enabled: false,
    notConfigured: true,
    bullets: ['Matches clients Risk Profile with the most appropriate model portfolio.'],
  },
  {
    id: 'rollover',
    title: 'Rollover/Consolidate Plans',
    category: 'all',
    enabled: false,
    bullets: [
      'Allows for the consolidation of multiple plans that a client may hold.',
      'Allows for partial and full rollover/consolidation into a single plan or multiple plans.',
    ],
  },
  {
    id: 'super-to-pension',
    title: 'Super to Pension',
    category: 'retirement',
    enabled: false,
    bullets: [
      'Allows for the transfer from Super to Pension.',
      'When using this proposal you should ensure that the client meets preservation and condition of release requirements.',
      'If any buy/sell or transaction costs are to be waived in this proposal they will need to be edited manually.',
    ],
  },
  {
    id: 'transition-to-retirement',
    title: 'Transition to Retirement',
    category: 'retirement',
    enabled: false,
    bullets: [
      'Transition to Retirement strategy proposal.',
      'Available if preservation age has been reached.',
    ],
  },
  {
    id: 'insurance-review',
    title: 'Insurance Review',
    category: 'all',
    enabled: false,
    bullets: [
      'Review the insurance situation of a client.',
      'An insurance needs analysis can be completed if required.',
      'An insurance premium estimate can be completed if required.',
    ],
  },
  {
    id: 'new-plan',
    title: 'New Plan',
    category: 'assets',
    enabled: false,
    bullets: [
      'Allows for the allocation of any Other Asset amounts to a researched, derived or custom plan.',
      'Only amounts from assets and investment platforms can be applied to a new plan in this proposal.',
    ],
  },
  {
    id: 'like-for-like',
    title: 'Like-for-Like',
    category: 'assets',
    enabled: true,
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
    if (filter === 'retirement') return c.category === 'retirement';
    if (filter === 'assets') return c.category === 'assets';
    return true;
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

    // Group platforms by type
    const byType = new Map<string, typeof entityData.platforms>();
    for (const p of entityData.platforms) {
      const list = byType.get(p.type) ?? [];
      list.push(p);
      byType.set(p.type, list);
    }

    const rows: Proposal['rows'] = [];
    for (const [, platforms] of byType) {
      if (platforms.length < 2) continue;
      // Primary = highest balance
      const [primary, ...rest] = [...platforms].sort((a, b) => b.balance - a.balance);
      for (const src of rest) {
        rows.push({
          id: `like-for-like-${src.id}-${Date.now()}`,
          owner: entity,
          proposalType: 'Rollover',
          fromPlatform: src,
          toPlatform: primary,
          balance: src.balance,
        });
      }
    }

    if (rows.length === 0) {
      alert('Like-for-Like requires at least two plans of the same type.');
      return;
    }

    const proposal: Proposal = {
      id: `proposal-lfl-${Date.now()}`,
      label: nextProposalLabel(),
      rows,
    };

    dispatch({ type: 'ADD_PROPOSAL_ANY', scenarioId: scenarioId!, proposal });
    navigate(`/scenarios/${scenarioId}`);
  }

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
          <div
            key={card.id}
            className={`border rounded p-4 flex flex-col ${
              card.enabled ? 'border-border bg-white' : 'border-border bg-gray-50 opacity-70'
            }`}
          >
            <h3 className="text-sm font-semibold mb-2">{card.title}</h3>
            <ul className="text-xs text-muted-foreground space-y-1 flex-1 mb-4">
              {card.bullets.map((b, i) => (
                <li key={i} className="text-blue-700">
                  {b}
                </li>
              ))}
            </ul>
            {'notConfigured' in card && card.notConfigured && (
              <p className="text-xs font-semibold text-red-600 mb-2">Not configured</p>
            )}
            <div className="flex items-center gap-3 mt-auto">
              {card.enabled && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={card.id === 'plan-review' ? handlePlanReview : handleLikeForLike}
                >
                  Select
                </Button>
              )}
              {!card.enabled && (
                <Button size="sm" variant="outline" disabled>
                  Select
                </Button>
              )}
              <button className="text-xs text-blue-600 hover:underline">More Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
