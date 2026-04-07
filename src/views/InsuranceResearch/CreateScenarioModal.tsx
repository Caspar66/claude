import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onSave: (name: string, caseType: string) => void;
  onCancel: () => void;
  existingNames: string[];
}

export function CreateScenarioModal({ open, onSave, onCancel, existingNames }: Props) {
  const [name, setName] = useState('');
  const [caseType, setCaseType] = useState('Client & Partner');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setCaseType('Client & Partner');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Scenario name is required.');
      return;
    }
    if (existingNames.includes(trimmed)) {
      setError('A scenario with this name already exists. Please choose a unique name.');
      return;
    }
    onSave(trimmed, caseType);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-400 text-white">
          <h2 className="text-sm font-bold">Create Scenario</h2>
          <DialogClose asChild>
            <button className="text-white/80 hover:text-white" onClick={onCancel}>
              <X size={16} />
            </button>
          </DialogClose>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Scenario Name
            </label>
            <input
              ref={inputRef}
              type="text"
              className="w-56 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
            />
            {error && (
              <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Case
            </label>
            <select
              className="w-32 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              value={caseType}
              onChange={(e) => setCaseType(e.target.value)}
            >
              <option value="Client & Partner">Client &amp; Partner</option>
              <option value="Client Only">Client Only</option>
              <option value="Partner Only">Partner Only</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200">
          <Button
            className="bg-indigo-700 hover:bg-indigo-800 text-white px-5"
            size="sm"
            onClick={handleSave}
          >
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
