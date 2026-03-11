import { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Info, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/context/AppContext';
import { useWealthSolver } from '@/context/WealthSolverContext';
import { ADVANCED_FEATURES, type PlanType } from '@/data/planCatalogue';
import type { EntityOwner, Platform } from '@/types/domain';
import type { WsPlan, WsPlanType } from '@/types/wealthsolver';
import { cn } from '@/lib/utils';

// Map WsPlanType → UI PlanType filter value
function toPlanType(t: WsPlanType): PlanType {
  return t === 'Investment Platform' ? 'Investment' : t;
}

// ── Star Rating ───────────────────────────────────────────────────────────────

function StarRating({ stars }: { stars: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = stars >= i;
        const half = !filled && stars >= i - 0.5;
        return (
          <svg key={i} width="13" height="13" viewBox="0 0 24 24">
            <defs>
              <clipPath id={`half-${i}`}>
                <rect x="0" y="0" width="12" height="24" />
              </clipPath>
            </defs>
            {/* empty star */}
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21.02 7 14.14 2 9.27l6.91-1.01L12 2z"
              fill="#d1d5db"
            />
            {/* filled portion */}
            {(filled || half) && (
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21.02 7 14.14 2 9.27l6.91-1.01L12 2z"
                fill="#f59e0b"
                clipPath={half ? `url(#half-${i})` : undefined}
              />
            )}
          </svg>
        );
      })}
    </span>
  );
}

// ── Filter Panel ──────────────────────────────────────────────────────────────

interface FilterState {
  keyword: string;
  planType: PlanType;
  subtype: string;
  manager: string;
  sortBy: string;
  features: Set<string>;
  minInvestmentOptions: number;
}

function FilterPanel({
  filter,
  onChange,
  managers,
  subtypes,
}: {
  filter: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  managers: string[];
  subtypes: string[];
}) {
  const [advancedOpen, setAdvancedOpen] = useState(true);

  function toggleFeature(f: string) {
    const next = new Set(filter.features);
    next.has(f) ? next.delete(f) : next.add(f);
    onChange({ features: next });
  }

  return (
    <div className="w-72 shrink-0 border-r border-border overflow-y-auto">
      <div className="px-4 py-3 bg-teal-700 text-white text-sm font-semibold">Filter</div>
      <div className="p-4 space-y-3 text-sm">
        {/* Keyword */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Keyword Search:</label>
          <div className="relative">
            <Input
              value={filter.keyword}
              onChange={(e) => onChange({ keyword: e.target.value })}
              placeholder="name, spin or abn"
              className="h-8 text-xs pr-8"
            />
            <Search size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-teal-600" />
          </div>
        </div>

        {/* Plan Type */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground w-24 shrink-0">Plan Type:</label>
          <select
            className="flex-1 h-8 rounded border border-input text-xs px-2 bg-background"
            value={filter.planType}
            onChange={(e) => onChange({ planType: e.target.value as PlanType, subtype: 'All' })}
          >
            <option>Super</option>
            <option>Pension</option>
            <option>Investment</option>
          </select>
        </div>

        {/* Plan Subtype */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground w-24 shrink-0">Plan Subtype:</label>
          <select
            className="flex-1 h-8 rounded border border-input text-xs px-2 bg-background"
            value={filter.subtype}
            onChange={(e) => onChange({ subtype: e.target.value })}
          >
            {subtypes.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Plan Manager */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground w-24 shrink-0">Plan Manager:</label>
          <select
            className="flex-1 h-8 rounded border border-input text-xs px-2 bg-background"
            value={filter.manager}
            onChange={(e) => onChange({ manager: e.target.value })}
          >
            {managers.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground w-24 shrink-0">Sort by:</label>
          <select
            className="flex-1 h-8 rounded border border-input text-xs px-2 bg-background"
            value={filter.sortBy}
            onChange={(e) => onChange({ sortBy: e.target.value })}
          >
            <option>A-Z</option>
            <option>Z-A</option>
            <option>Rating: High to Low</option>
            <option>Rating: Low to High</option>
          </select>
        </div>

        {/* Advanced Filters */}
        <div>
          <button
            className="flex items-center gap-1 text-xs font-semibold text-foreground mb-2"
            onClick={() => setAdvancedOpen((o) => !o)}
          >
            <ChevronDown size={12} className={cn('transition-transform', !advancedOpen && '-rotate-90')} />
            Advanced Filters
          </button>
          {advancedOpen && (
            <div className="space-y-1.5">
              {ADVANCED_FEATURES.map((feat) => (
                <label key={feat} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filter.features.has(feat)}
                    onChange={() => toggleFeature(feat)}
                    className="rounded"
                  />
                  {feat}
                </label>
              ))}
              {/* Minimum Investment Options numeric input */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs">Minimum Number of Investment Options</span>
                <Input
                  type="number"
                  value={filter.minInvestmentOptions}
                  onChange={(e) => onChange({ minInvestmentOptions: parseInt(e.target.value) || 0 })}
                  className="h-6 w-14 text-xs text-right"
                  min={0}
                />
              </div>
            </div>
          )}
        </div>

        {/* Feature ratings details */}
        <div className="pt-1">
          <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
            <Info size={11} />
            Feature ratings details
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AddExistingPlanPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { dispatch } = useAppContext();
  const { state: wsState } = useWealthSolver();

  const entityParam = (searchParams.get('entity') ?? 'Client') as EntityOwner;
  const typeParam = (searchParams.get('planType') ?? 'Super') as PlanType;
  const mode = searchParams.get('mode'); // 'proposed' | null
  const proposedProposalId = searchParams.get('proposalId');
  const proposedEntity = (searchParams.get('proposalEntity') ?? entityParam) as EntityOwner;
  const proposedLabel = searchParams.get('label');

  const [filter, setFilter] = useState<FilterState>({
    keyword: '',
    planType: typeParam,
    subtype: 'All',
    manager: 'All',
    sortBy: 'A-Z',
    features: new Set(),
    minInvestmentOptions: 0,
  });

  function patchFilter(patch: Partial<FilterState>) {
    setFilter((prev) => ({ ...prev, ...patch }));
  }

  // Derive manager and subtype lists from the current WsPlan catalogue for this type
  const plansForType = useMemo(
    () => wsState.plans.filter((p) => toPlanType(p.type) === filter.planType),
    [wsState.plans, filter.planType]
  );

  const managers = useMemo(() => {
    const vals = Array.from(new Set(plansForType.map((p) => p.manager))).sort();
    return ['All', ...vals];
  }, [plansForType]);

  const subtypes = useMemo(() => {
    const vals = Array.from(new Set(plansForType.map((p) => p.subtype).filter(Boolean))).sort();
    return ['All', ...vals];
  }, [plansForType]);

  const filtered = useMemo(() => {
    let result = plansForType;

    if (filter.keyword.trim()) {
      const kw = filter.keyword.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(kw));
    }
    if (filter.subtype !== 'All') {
      result = result.filter((p) => p.subtype === filter.subtype);
    }
    if (filter.manager !== 'All') {
      result = result.filter((p) => p.manager === filter.manager);
    }
    if (filter.minInvestmentOptions > 0) {
      result = result.filter((p) => p.investmentOptions.length >= filter.minInvestmentOptions);
    }

    result = [...result].sort((a, b) => {
      if (filter.sortBy === 'A-Z') return a.name.localeCompare(b.name);
      if (filter.sortBy === 'Z-A') return b.name.localeCompare(a.name);
      if (filter.sortBy === 'Rating: High to Low') return b.rating - a.rating;
      if (filter.sortBy === 'Rating: Low to High') return a.rating - b.rating;
      return 0;
    });

    return result;
  }, [plansForType, filter]);

  function handleSelect(wsPlanId: string) {
    const plan = wsState.plans.find((p) => p.id === wsPlanId);
    if (!plan || !scenarioId) return;

    // Proposed plan mode: navigate back to PlanReviewPage with the selected plan id
    if (mode === 'proposed') {
      const pid = proposedProposalId ?? 'new';
      const params = new URLSearchParams({ entity: proposedEntity, addPlan: wsPlanId });
      if (proposedLabel) params.set('label', proposedLabel);
      if (pid === 'new') {
        navigate(`/scenarios/${scenarioId}/proposals/plan-review/new?${params.toString()}`);
      } else {
        navigate(`/scenarios/${scenarioId}/proposals/plan-review/${pid}?${params.toString()}`);
      }
      return;
    }

    // Add existing plan to entity
    const newPlatformId = `platform-${Date.now()}`;
    const newPlatform: Platform = {
      id: newPlatformId,
      wsPlanId: plan.id,
      name: plan.name,
      accountNumber: String(Math.floor(100000 + Math.random() * 900000)),
      type: plan.type === 'Investment Platform' ? 'Investment' : plan.type,
      balance: 0,
      taxFreeBalance: 0,
      otherBalancesClient: 0,
      otherBalancesFamily: 0,
      investments: [
        {
          id: `${newPlatformId}-inv1`,
          name: `Cash Holding - ${plan.name.split(' ')[0]}`,
          apirCode: 'FC51353AU',
          amount: 0,
          allocation: { 'Domestic Cash': 100 },
          fundType: '',
          isCashAccount: true,
          broadObjectives: 'A cash holding account for this platform.',
        },
      ],
    };

    dispatch({
      type: 'ADD_PLATFORM',
      scenarioId,
      entityOwner: entityParam,
      platform: newPlatform,
    });

    navigate(`/scenarios/${scenarioId}/plan/${newPlatformId}/edit`);
  }

  const planTypeLabel = filter.planType === 'Investment' ? 'Platform' : filter.planType + ' Plan';
  const selectLabel = `Select ${filter.planType === 'Investment' ? 'Investment' : filter.planType} Plan`;

  function handleCancel() {
    if (mode === 'proposed') {
      const pid = proposedProposalId ?? 'new';
      const params = new URLSearchParams({ entity: proposedEntity });
      if (proposedLabel) params.set('label', proposedLabel);
      if (pid === 'new') {
        navigate(`/scenarios/${scenarioId}/proposals/plan-review/new?${params.toString()}`);
      } else {
        navigate(`/scenarios/${scenarioId}/proposals/plan-review/${pid}?${params.toString()}`);
      }
    } else {
      navigate(`/scenarios/${scenarioId}`);
    }
  }

  return (
    <div className="flex h-full min-h-screen">
      <FilterPanel
        filter={filter}
        onChange={patchFilter}
        managers={managers}
        subtypes={subtypes}
      />

      {/* Results panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-teal-700 text-white shrink-0">
          <span className="text-sm font-semibold">
            {mode === 'proposed' ? `Add Proposed ${planTypeLabel}` : `Add Existing ${planTypeLabel}`}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs opacity-75">Entity: {mode === 'proposed' ? proposedEntity : entityParam}</span>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* Plan list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-0">
          {filtered.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-12">
              No plans match your search criteria.
            </div>
          )}
          {filtered.map((plan, i) => (
            <div
              key={plan.id}
              className={cn(
                'flex items-center justify-between px-4 py-3 border-b border-gray-100',
                i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground mb-1">{plan.name}</div>
                <div className="flex items-center gap-2">
                  <StarRating stars={plan.rating} />
                  <button className="text-muted-foreground hover:text-foreground">
                    <Info size={13} />
                  </button>
                  {!plan.openForBusiness && (
                    <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" title="Closed for new business" />
                  )}
                </div>
              </div>
              <div className="shrink-0 ml-4">
                <button
                  onClick={() => handleSelect(plan.id)}
                  className="border border-border rounded px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors"
                >
                  {selectLabel}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
