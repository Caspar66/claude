import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/context/AppContext';

export function ScenarioSelectionPanel() {
  const { dispatch } = useAppContext();
  const [open, setOpen] = useState(true);
  const [name, setName] = useState('');

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch({ type: 'CREATE_SCENARIO', name: trimmed });
    setName('');
  }

  return (
    <div className="border border-border rounded mb-4">
      <button
        className="w-full flex items-center justify-between px-4 py-2 bg-navy text-white text-sm font-semibold rounded-t hover:bg-navy/90 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        Scenario Selection
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="px-4 py-3 flex items-end gap-3 bg-gray-50">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Scenario Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter scenario name..."
              className="w-64"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <Button
            onClick={handleCreate}
            className="bg-teal-700 hover:bg-teal-800 text-white"
          >
            Create Scenario
          </Button>
        </div>
      )}
    </div>
  );
}
