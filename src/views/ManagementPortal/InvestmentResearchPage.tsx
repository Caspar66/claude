import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PlanListPage } from '@/views/WealthSolver/PlanListPage';
import { InvestmentDataPage } from '@/views/WealthSolver/InvestmentDataPage';

type Tab = 'plans' | 'investment-data';

const TABS: { id: Tab; label: string }[] = [
  { id: 'plans', label: 'View plans' },
  { id: 'investment-data', label: 'Investment data' },
];

export function InvestmentResearchPage() {
  const [activeTab, setActiveTab] = useState<Tab>('plans');

  return (
    <div className="flex flex-col h-full">
      {/* Sub-nav tabs */}
      <div className="border-b border-border bg-gray-50 px-4 flex items-end gap-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.id
                ? 'border-teal-700 text-teal-700'
                : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-slate-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'plans' ? <PlanListPage /> : <InvestmentDataPage />}
      </div>
    </div>
  );
}
