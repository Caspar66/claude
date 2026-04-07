import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { InsuranceProvider } from './insuranceData';

interface Props {
  open: boolean;
  onClose: () => void;
  providers: InsuranceProvider[];
}

export function FeaturesReportModal({ open, onClose, providers }: Props) {
  const selected = providers.filter((p) => p.selected);
  const existingOptions = providers.filter((p) => p.featureScore > 0).map((p) => `${p.name} ${p.product}`);
  const compareOptions = selected.length > 0
    ? selected.map((p) => `${p.name} ${p.product}`)
    : existingOptions.slice(0, 3);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-gray-200">
          <h2 className="text-lg font-semibold text-slate-800">Features Gained and Lost Report</h2>
          <button
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-gray-100"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-5 space-y-4">
          {/* Existing portfolio */}
          <div>
            <label className="block text-sm text-slate-500 mb-1">Existing portfolio:</label>
            <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600">
              {existingOptions.map((o, i) => (
                <option key={i} value={o}>{o}</option>
              ))}
              {existingOptions.length === 0 && <option>No portfolios available</option>}
            </select>
          </div>

          {/* Portfolio to compare */}
          <div>
            <label className="block text-sm text-slate-500 mb-1">Portfolio to compare:</label>
            <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600">
              {compareOptions.map((o, i) => (
                <option key={i} value={o}>{o}</option>
              ))}
              {compareOptions.length === 0 && <option>No portfolios available</option>}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-t border-gray-200 bg-gray-50">
          <Button
            className="bg-teal-700 hover:bg-teal-800 text-white px-5"
            onClick={onClose}
          >
            Create Report
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
