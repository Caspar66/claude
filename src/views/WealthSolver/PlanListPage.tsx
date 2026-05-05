import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWealthSolver } from '@/context/WealthSolverContext';
import type { WsPlanType } from '@/types/wealthsolver';

const PLAN_TYPES: Array<WsPlanType | 'All'> = ['All', 'Investment Platform', 'Super', 'Pension'];
const SORT_OPTIONS = ['A-Z', 'Z-A', 'Rating High-Low', 'Rating Low-High'] as const;
type SortOption = typeof SORT_OPTIONS[number];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= rating ? '#f59e0b' : 'none'} stroke={i <= rating ? '#f59e0b' : '#d1d5db'} strokeWidth="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

export function PlanListPage() {
  const { state } = useWealthSolver();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [planType, setPlanType] = useState<WsPlanType | 'All'>('All');
  const [planManager, setPlanManager] = useState('All');
  const [openForBusiness, setOpenForBusiness] = useState<'All' | 'Yes' | 'No'>('All');
  const [sort, setSort] = useState<SortOption>('A-Z');

  const managers = useMemo(() => {
    const set = new Set(state.plans.map((p) => p.manager));
    return ['All', ...Array.from(set).sort()];
  }, [state.plans]);

  const filtered = useMemo(() => {
    let result = state.plans.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (planType !== 'All' && p.type !== planType) return false;
      if (planManager !== 'All' && p.manager !== planManager) return false;
      if (openForBusiness === 'Yes' && !p.openForBusiness) return false;
      if (openForBusiness === 'No' && p.openForBusiness) return false;
      return true;
    });
    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'A-Z': return a.name.localeCompare(b.name);
        case 'Z-A': return b.name.localeCompare(a.name);
        case 'Rating High-Low': return b.rating - a.rating;
        case 'Rating Low-High': return a.rating - b.rating;
        default: return 0;
      }
    });
    return result;
  }, [state.plans, search, planType, planManager, openForBusiness, sort]);

  return (
    <div className="flex h-full">
      {/* Filter sidebar */}
      <aside className="w-48 flex-shrink-0 border-r border-border bg-gray-50 p-3 space-y-4 overflow-y-auto">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Search</label>
          <input
            type="text"
            className="w-full border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400"
            placeholder="Plan name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <FilterSelect label="Plan Type" value={planType} onChange={(v) => setPlanType(v as WsPlanType | 'All')} options={PLAN_TYPES} />
        <FilterSelect label="Plan Manager" value={planManager} onChange={setPlanManager} options={managers} />
        <FilterSelect label="Open for New Business" value={openForBusiness} onChange={(v) => setOpenForBusiness(v as 'All' | 'Yes' | 'No')} options={['All', 'Yes', 'No']} />
        <FilterSelect label="Sort" value={sort} onChange={(v) => setSort(v as SortOption)} options={[...SORT_OPTIONS]} />
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex justify-end mb-3">
          <button
            className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-sm rounded"
            onClick={() => navigate('/research/plans/new')}
          >
            + Add Plan
          </button>
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-border bg-gray-50">
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Product Name</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Manager</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Type</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Subtype</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Rating</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Open</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((plan) => (
              <tr
                key={plan.id}
                className="border-b border-border hover:bg-teal-50 cursor-pointer"
                onClick={() => navigate(`/research/plans/${plan.id}`)}
              >
                <td className="px-3 py-2 text-teal-700 font-medium hover:underline">{plan.name}</td>
                <td className="px-3 py-2 text-red-600">{plan.manager}</td>
                <td className="px-3 py-2 text-muted-foreground">{plan.type}</td>
                <td className="px-3 py-2 text-muted-foreground">{plan.subtype}</td>
                <td className="px-3 py-2"><Stars rating={plan.rating} /></td>
                <td className="px-3 py-2">
                  <span className={plan.openForBusiness ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {plan.openForBusiness ? 'Yes' : 'No'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-muted-foreground">{filtered.length} plan{filtered.length !== 1 ? 's' : ''}</p>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1">{label}</label>
      <select
        className="w-full border border-border rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
