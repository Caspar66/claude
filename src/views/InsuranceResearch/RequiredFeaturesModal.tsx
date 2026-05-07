import { X } from 'lucide-react';
import { REQUIRED_FEATURES } from './requiredFeaturesData';

interface Props {
  needCode: string;
  label: string;
  selected: string[];
  onClose: () => void;
  onSave: (selected: string[]) => void;
}

export default function RequiredFeaturesModal({ needCode, label, selected, onClose, onSave }: Props) {
  const features = REQUIRED_FEATURES[needCode] ?? [];
  const current = new Set(selected);

  function toggle(value: string) {
    const next = new Set(current);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onSave(Array.from(next));
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-[440px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 bg-blue-700 text-white rounded-t-lg">
          <h3 className="text-sm font-bold">Required Features — {label}</h3>
          <button onClick={onClose} className="hover:text-white/80"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-auto px-5 py-4">
          {features.length === 0 ? (
            <p className="text-sm text-slate-400">No features available for {label}.</p>
          ) : (
            <div className="space-y-2">
              {features.map((f) => (
                <label key={f.value} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded px-2 py-1.5">
                  <input
                    type="checkbox"
                    checked={current.has(f.value)}
                    onChange={() => toggle(f.value)}
                    className="accent-teal-700 w-4 h-4"
                  />
                  <span className="text-sm text-slate-700">{f.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end px-5 py-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm bg-teal-700 hover:bg-teal-800 text-white rounded"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
