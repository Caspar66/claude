import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const REFERENCE_DATA_ITEMS = [
  { label: 'Strategy Library', to: '/management/reference-data/strategy-library' },
  { label: 'Product Library', to: '/management/reference-data/product-library' },
  { label: 'Fields', to: '/management/reference-data/fields' },
  { label: 'Fact Sheets', to: '/management/reference-data/fact-sheets' },
  { label: 'Video Library', to: '/management/reference-data/video-library' },
  { label: 'Investment Research', to: '/management/reference-data/investment-research' },
];

function ReferenceDataDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors',
          open ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'
        )}
      >
        Reference Data
        <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded shadow-lg border border-border z-50 py-1">
          {REFERENCE_DATA_ITEMS.map((item) => (
            <button
              key={item.to}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => {
                navigate(item.to);
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const TOP_NAV_ITEMS = [
  { label: 'Dashboard', to: '/management/dashboard' },
  { label: 'Organisations', to: '/management/organisations' },
  { label: 'Licensees', to: '/management/licensees' },
  { label: 'Workspaces', to: '/management/workspaces' },
  { label: 'Users', to: '/management/users' },
  { label: 'Apps', to: '/management/apps' },
];

export function ManagementPortalShell() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top nav */}
      <header className="h-12 bg-slate-800 text-white flex items-center px-4 gap-1 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center justify-center w-7 h-7 bg-teal-500 rounded-full mr-3 flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {TOP_NAV_ITEMS.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              )
            }
          >
            {item.label}
          </NavLink>
        ))}

        <ReferenceDataDropdown />

        <NavLink
          to="/management/apps"
          className={({ isActive }) =>
            cn(
              'px-3 py-1.5 rounded text-sm font-medium transition-colors',
              isActive
                ? 'bg-white/20 text-white'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            )
          }
        >
          Apps
        </NavLink>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto bg-white">
        <Outlet />
      </main>
    </div>
  );
}
