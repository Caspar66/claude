import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  to: string;
}

const navSections: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Scenario Modelling',
    items: [
      { label: 'Scenario Index', to: '/scenarios' },
    ],
  },
  {
    heading: 'WealthSolver > Research',
    items: [
      { label: 'View plans', to: '/research/plans' },
      { label: 'Investment data', to: '/research/investment-data' },
      { label: 'Insurance Research', to: '/scenarios/scenario-1/research/insurance' },
    ],
  },
  {
    heading: 'Management Portal',
    items: [
      { label: 'Investment Research', to: '/management/reference-data/investment-research' },
    ],
  },
];

export function LeftNav() {
  return (
    <nav className="w-52 bg-gray-50 border-r border-border flex-shrink-0 overflow-y-auto">
      {navSections.map((section) => (
        <div key={section.heading}>
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border bg-gray-100">
            {section.heading}
          </div>
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'block px-4 py-2 text-sm hover:bg-teal-700/10 hover:text-teal-800 transition-colors',
                  isActive && 'bg-teal-700 text-white font-medium hover:bg-teal-800 hover:text-white'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}
