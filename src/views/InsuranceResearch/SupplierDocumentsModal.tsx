import { useState, useEffect, useMemo } from 'react';
import { X, ExternalLink, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchSupplierDocuments } from '@/services/omnilifeApi';
import type { SupplierDocument } from '@/services/omnilifeApi';

export type DocumentCategory = 'documents' | 'archived' | 'guides' | 'tmds';

const CATEGORY_CONFIG: Record<DocumentCategory, { label: string; docType: string; useDate: boolean }> = {
  documents: { label: 'Documents', docType: 'PPDS', useDate: true },
  archived: { label: 'Archived Documents', docType: 'PPDS', useDate: false },
  guides: { label: 'Adviser Guides', docType: 'GUIDE', useDate: false },
  tmds: { label: 'Target Market Determinations', docType: 'TMD', useDate: false },
};

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

type SortField = 'supplier' | 'dateIssued' | 'description';
type SortDir = 'asc' | 'desc';

interface Props {
  category: DocumentCategory;
  onCategoryChange: (cat: DocumentCategory) => void;
  onClose: () => void;
}

function formatDate(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-AU', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (field !== sortField) return <ChevronUp size={12} className="text-slate-300 ml-1 inline" />;
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-sky-600 ml-1 inline" />
    : <ChevronDown size={12} className="text-sky-600 ml-1 inline" />;
}

export function SupplierDocumentsModal({ category, onCategoryChange, onClose }: Props) {
  const [docs, setDocs] = useState<SupplierDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState<number>(25);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('supplier');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const config = CATEGORY_CONFIG[category];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPage(1);

    const today = new Date().toISOString().split('T')[0];
    const date = config.useDate ? today : undefined;

    fetchSupplierDocuments(config.docType, date)
      .then((result) => { if (!cancelled) setDocs(result); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load documents'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [category, config.docType, config.useDate]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  const filtered = useMemo(() => {
    let list = docs;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        d.supplier.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      const cmp = av.localeCompare(bv, 'en-AU', { sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [docs, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const categories: DocumentCategory[] = ['documents', 'archived', 'guides', 'tmds'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-[780px] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-slate-800">Current Supplier Documents</h2>
          <div className="flex items-center gap-3">
            <input
              className="border border-gray-300 rounded px-2 py-1 text-sm w-44 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="px-6 pt-3 flex gap-1 border-b border-gray-200">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 pb-2 text-xs font-medium border-b-2 transition-colors ${
                category === cat
                  ? 'text-sky-600 border-sky-600'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              {CATEGORY_CONFIG[cat].label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-3">
          {loading && (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 size={24} className="animate-spin mr-2" />
              Loading documents...
            </div>
          )}

          {error && (
            <div className="py-16 text-center text-red-500 text-sm">{error}</div>
          )}

          {!loading && !error && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th
                    className="py-2 px-2 text-left font-semibold text-slate-600 cursor-pointer select-none"
                    onClick={() => handleSort('supplier')}
                  >
                    Supplier
                    <SortIcon field="supplier" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th
                    className="py-2 px-2 text-left font-semibold text-slate-600 cursor-pointer select-none"
                    onClick={() => handleSort('dateIssued')}
                  >
                    Date Issued
                    <SortIcon field="dateIssued" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th
                    className="py-2 px-2 text-left font-semibold text-slate-600 cursor-pointer select-none"
                    onClick={() => handleSort('description')}
                  >
                    Description
                    <SortIcon field="description" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th className="py-2 px-2 text-center font-semibold text-slate-600">Open Pdf</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      {search ? 'No documents match your search.' : 'No documents found.'}
                    </td>
                  </tr>
                )}
                {paged.map((doc, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-slate-50/50">
                    <td className="py-2 px-2 text-sky-600">{doc.supplier}</td>
                    <td className="py-2 px-2 text-slate-600">{formatDate(doc.dateIssued)}</td>
                    <td className="py-2 px-2 text-sky-600">{doc.description}</td>
                    <td className="py-2 px-2 text-center">
                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded border border-gray-300 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          Open
                        </a>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination footer */}
        {!loading && !error && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  onClick={() => { setPageSize(size); setPage(1); }}
                  className={`px-2 py-1 rounded border text-xs ${
                    pageSize === size
                      ? 'border-sky-500 bg-sky-50 text-sky-700 font-medium'
                      : 'border-gray-300 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="px-1 hover:text-slate-700 disabled:text-slate-300"
              >
                &lsaquo;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const gap = prev != null && p - prev > 1;
                  return (
                    <span key={p}>
                      {gap && <span className="px-1">...</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={`px-2 py-0.5 rounded ${
                          p === safePage ? 'bg-sky-500 text-white font-medium' : 'hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="px-1 hover:text-slate-700 disabled:text-slate-300"
              >
                &rsaquo;
              </button>
            </div>
            <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>
              Close
            </Button>
          </div>
        )}

        {/* Close button when no pagination needed */}
        {(loading || error || filtered.length === 0) && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
            <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
