import { ChevronDown } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export function Header() {
  const { state } = useAppContext();
  const { client, partner } = state.clientFile;

  return (
    <header className="h-12 bg-navy text-white flex items-center px-4 gap-2 flex-shrink-0">
      <span className="font-semibold text-sm">WealthSolver:</span>
      <span className="text-sm">
        {client.name} &amp; {partner.name}
      </span>
      <button className="ml-1 hover:bg-white/10 rounded p-0.5">
        <ChevronDown size={14} />
      </button>
    </header>
  );
}
