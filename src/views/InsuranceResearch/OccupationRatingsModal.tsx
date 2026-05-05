import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { fetchOccupationMappings } from '@/services/omnilifeApi';
import type { OccupationMapping } from '@/services/omnilifeApi';
import { useSuppliers } from '@/hooks/useSuppliers';

interface Props {
  open: boolean;
  onClose: () => void;
  occupationLabel: string;
  occupationId: string;
}

const COLUMNS: { key: keyof OccupationMapping; label: string }[] = [
  { key: 'classTRM', label: 'Life' },
  { key: 'classTRA', label: 'Trauma' },
  { key: 'classTPDADL', label: 'TPD ADL' },
  { key: 'classTPDAny', label: 'TPD Any' },
  { key: 'classTPDOwn', label: 'TPD Own' },
  { key: 'classINC', label: 'I.P.' },
  { key: 'classBUS', label: 'B.E.' },
];

export function OccupationRatingsModal({ open, onClose, occupationLabel, occupationId }: Props) {
  const [mappings, setMappings] = useState<OccupationMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { suppliers } = useSuppliers();

  const supplierNames = new Map(suppliers.map((s) => [s.code, s.name]));

  useEffect(() => {
    if (!open || !occupationId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchOccupationMappings(occupationId)
      .then((data) => {
        if (cancelled) return;
        setMappings(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [open, occupationId]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[900px] w-[900px] p-0 overflow-hidden" style={{ maxHeight: '80vh' }}>
        <div className="flex flex-col" style={{ maxHeight: '80vh' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 bg-slate-700 text-white">
            <h3 className="text-sm font-bold">Occupation ratings for all insurers:</h3>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X size={16} />
            </button>
          </div>

          {/* Occupation info */}
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
            <span className="text-sm text-slate-700">{occupationLabel}</span>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
                <Loader2 size={16} className="animate-spin" /> Loading occupation ratings…
              </div>
            )}
            {error && (
              <div className="px-5 py-4 text-sm text-amber-700">Could not load ratings — {error}</div>
            )}
            {!loading && !error && mappings.length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-slate-400">No rating data available for this occupation.</div>
            )}
            {!loading && !error && mappings.length > 0 && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="text-left px-3 py-2 font-bold text-slate-700 sticky left-0 bg-slate-100">Insurer</th>
                    <th className="text-left px-3 py-2 font-bold text-slate-700">Description</th>
                    {COLUMNS.map((col) => (
                      <th key={col.key} className="text-left px-3 py-2 font-bold text-slate-700">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((m, i) => (
                    <tr key={m.supplierCode + i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-3 py-1.5 font-medium text-slate-800 sticky left-0 bg-inherit">
                        {supplierNames.get(m.supplierCode) ?? m.supplierCode}
                      </td>
                      <td className="px-3 py-1.5 text-slate-600">{m.description || '—'}</td>
                      {COLUMNS.map((col) => (
                        <td key={col.key} className="px-3 py-1.5 text-slate-600">
                          {m[col.key] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
