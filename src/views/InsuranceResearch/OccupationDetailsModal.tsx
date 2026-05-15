import { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2, RefreshCw } from 'lucide-react';
import { searchSupplierOccupations, type SupplierOccupation } from '@/services/omnilifeApi';
import type { OccupationClasses } from './quoteResultsData';

interface Props {
  supplierName: string;
  supplierCode: string;
  occupationDescription?: string;
  occupationClasses: OccupationClasses;
  onRequoteWithOccupation: (supplierCode: string, occupationId: string) => void;
  requoting: boolean;
  onClose: () => void;
}

const CLASS_HEADERS = ['Life', 'Trauma', 'TPD ADL', 'TPD Any', 'TPD Own', 'I.P.', 'B.E.'] as const;

function classRow(occ: OccupationClasses) {
  return [occ.life, occ.trauma, occ.tpdADL, occ.tpdAny, occ.tpdOwn, occ.ip, occ.be];
}

function supplierOccToClasses(occ: SupplierOccupation): OccupationClasses {
  return {
    life: occ.classTRM || undefined,
    trauma: occ.classTRA || undefined,
    tpdADL: occ.classTPDADL || undefined,
    tpdAny: occ.classTPDAny || undefined,
    tpdOwn: occ.classTPDOwn || undefined,
    ip: occ.classINC || undefined,
    be: occ.classBUS || undefined,
  };
}

export function OccupationDetailsModal({
  supplierName,
  supplierCode,
  occupationDescription,
  occupationClasses,
  onRequoteWithOccupation,
  requoting,
  onClose,
}: Props) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SupplierOccupation[]>([]);
  const [selectedOcc, setSelectedOcc] = useState<SupplierOccupation | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hasClasses = Object.values(occupationClasses).some(Boolean);

  useEffect(() => {
    if (!showSearch || searchText.length < 2) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchSupplierOccupations(supplierCode, searchText);
        setResults(res);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchText, showSearch, supplierCode]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-navy rounded-t-lg">
          <h2 className="text-sm font-semibold text-white">
            Occupation details for {supplierName}
          </h2>
          <button className="text-white/70 hover:text-white" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Change Occupation + current label */}
          <div className="flex items-center gap-3">
            <button
              className="px-3 py-1.5 text-xs font-semibold rounded bg-teal-700 text-white hover:bg-teal-800"
              onClick={() => { setShowSearch(!showSearch); setSelectedOcc(null); }}
            >
              Change Occupation
            </button>
            {!showSearch && occupationDescription && (
              <span className="text-sm text-teal-700 font-medium">{occupationDescription}</span>
            )}
            {showSearch && (
              <div className="flex-1 relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-teal-500"
                  placeholder="Type here to search"
                  value={searchText}
                  onChange={(e) => { setSearchText(e.target.value); setSelectedOcc(null); }}
                  autoFocus
                />
                {searching && <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
              </div>
            )}
          </div>

          {/* Search results dropdown */}
          {showSearch && results.length > 0 && !selectedOcc && (
            <div className="border border-gray-200 rounded max-h-48 overflow-y-auto">
              {results.map((occ) => (
                <button
                  key={`${occ.supplierCode}-${occ.id}`}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-teal-50 border-b border-gray-100 last:border-b-0"
                  onClick={() => setSelectedOcc(occ)}
                >
                  <span className="font-medium text-slate-700">{occ.description}</span>
                  <span className="text-slate-400 ml-2">({occ.id})</span>
                </button>
              ))}
            </div>
          )}

          {/* Occupation Classes table */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Occupation Classes:</h3>
            <table className="w-full text-xs border border-gray-200">
              <thead>
                <tr className="bg-navy text-white">
                  {CLASS_HEADERS.map((h) => (
                    <th key={h} className="px-3 py-1.5 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(hasClasses || selectedOcc) && (
                  <tr className="border-t border-gray-200">
                    {classRow(selectedOcc ? supplierOccToClasses(selectedOcc) : occupationClasses).map((v, i) => (
                      <td key={i} className="px-3 py-1.5 text-slate-700">{v ?? '-'}</td>
                    ))}
                  </tr>
                )}
                {!hasClasses && !selectedOcc && (
                  <tr>
                    <td colSpan={7} className="px-3 py-3 text-center text-slate-400">
                      No occupation class data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-lg flex justify-end gap-2">
          {selectedOcc && (
            <button
              className="px-4 py-1.5 text-xs font-semibold rounded bg-indigo-700 text-white hover:bg-indigo-800 disabled:opacity-50 flex items-center gap-1"
              onClick={() => onRequoteWithOccupation(supplierCode, selectedOcc.id)}
              disabled={requoting}
            >
              {requoting && <RefreshCw size={10} className="animate-spin" />}
              Requote
            </button>
          )}
          <button
            className="px-4 py-1.5 text-xs font-semibold rounded bg-teal-700 text-white hover:bg-teal-800"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
