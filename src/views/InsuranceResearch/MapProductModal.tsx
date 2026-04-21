import { useEffect, useMemo, useState } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useLegacyPortfolios } from '@/hooks/useLegacyPortfolios';
import { fetchLegacyProducts } from '@/services/omnilifeApi';
import type { LegacyProduct } from '@/services/omnilifeApi';
import type { ExistingPolicy, CoverNeedCode, ResearchPortfolio } from './insuranceData';
import {
  COVER_NEED_CODE_LABELS,
  PREMIUM_FREQUENCY_MULTIPLIER,
  coverToNeedCode,
} from './insuranceData';

interface Props {
  open: boolean;
  onClose: () => void;
  policy: ExistingPolicy | null;
  onSave: (portfolio: ResearchPortfolio) => void;
}

function annualise(amount: number, freq: keyof typeof PREMIUM_FREQUENCY_MULTIPLIER): number {
  return amount * PREMIUM_FREQUENCY_MULTIPLIER[freq];
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function MapProductModal({ open, onClose, policy, onSave }: Props) {
  const { portfolios, loading: portfoliosLoading, error: portfoliosError } = useLegacyPortfolios();

  const [supplierFilter, setSupplierFilter] = useState('');
  const [supplierCode, setSupplierCode] = useState('');
  const [revisionDate, setRevisionDate] = useState('');
  const [premiumInside, setPremiumInside] = useState('0');
  const [premiumOutside, setPremiumOutside] = useState('0');
  const [stampDutyInside, setStampDutyInside] = useState('0');
  const [stampDutyOutside, setStampDutyOutside] = useState('0');
  const [productSelections, setProductSelections] = useState<Partial<Record<CoverNeedCode, string>>>({});
  const [productsByNeed, setProductsByNeed] = useState<Partial<Record<CoverNeedCode, LegacyProduct[]>>>({});
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Cover need codes present in this policy
  const neededCodes: CoverNeedCode[] = useMemo(() => {
    if (!policy) return [];
    const set = new Set<CoverNeedCode>();
    for (const cov of policy.covers) {
      const code = coverToNeedCode(cov);
      set.add(code);
    }
    return Array.from(set);
  }, [policy]);

  const selectedPortfolio = useMemo(
    () => portfolios.find((p) => p.supplierCode === supplierCode) ?? null,
    [portfolios, supplierCode],
  );

  const filteredPortfolios = useMemo(() => {
    const q = supplierFilter.trim().toLowerCase();
    if (!q) return portfolios;
    return portfolios.filter((p) =>
      p.supplierName.toLowerCase().includes(q) || p.supplierCode.toLowerCase().includes(q),
    );
  }, [portfolios, supplierFilter]);

  // Reset when opening for a new policy, and prefill premiums
  useEffect(() => {
    if (!open || !policy) return;
    const inside = annualise(policy.premiumSuper, policy.premiumSuperFrequency);
    const outside = annualise(policy.premiumNonSuper, policy.premiumNonSuperFrequency);
    setSupplierFilter('');
    setSupplierCode('');
    setRevisionDate('');
    setPremiumInside(inside.toFixed(2));
    setPremiumOutside(outside.toFixed(2));
    setStampDutyInside('0');
    setStampDutyOutside('0');
    setProductSelections({});
    setProductsByNeed({});
    setProductsError(null);
  }, [open, policy]);

  // Clear revision/products when supplier changes
  useEffect(() => {
    setRevisionDate('');
    setProductsByNeed({});
    setProductSelections({});
    setProductsError(null);
  }, [supplierCode]);

  // Fetch products for each needed cover code when supplier + date are set
  useEffect(() => {
    if (!supplierCode || !revisionDate || neededCodes.length === 0) return;
    let cancelled = false;
    setProductsLoading(true);
    setProductsError(null);

    Promise.all(
      neededCodes.map((code) =>
        fetchLegacyProducts({ supplierCode, date: revisionDate, coverNeedType: code })
          .then((list) => [code, list] as const)
          .catch((err: Error) => {
            throw new Error(`${code}: ${err.message}`);
          }),
      ),
    )
      .then((results) => {
        if (cancelled) return;
        const next: Partial<Record<CoverNeedCode, LegacyProduct[]>> = {};
        for (const [code, list] of results) {
          next[code] = list;
        }
        setProductsByNeed(next);
        setProductsLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setProductsError(err.message);
        setProductsLoading(false);
      });

    return () => { cancelled = true; };
  }, [supplierCode, revisionDate, neededCodes]);

  function handleAdd() {
    if (!policy || !supplierCode || !revisionDate) return;
    const products: Partial<Record<CoverNeedCode, { productCode: string }>> = {};
    for (const code of neededCodes) {
      const productCode = productSelections[code];
      if (productCode) products[code] = { productCode };
    }
    const portfolio: ResearchPortfolio = {
      supplierCode,
      revisionDate,
      existingCover: true,
      premiumInsideSuperAnnualised: parseFloat(premiumInside) || 0,
      premiumOutsideSuperAnnualised: parseFloat(premiumOutside) || 0,
      stampDutyInsideSuperAnnualised: parseFloat(stampDutyInside) || 0,
      stampDutyOutsideSuperAnnualised: parseFloat(stampDutyOutside) || 0,
      products,
    };
    onSave(portfolio);
    onClose();
  }

  const canAdd = supplierCode && revisionDate && neededCodes.every((c) => productSelections[c]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-800 text-white">
          <h3 className="text-sm font-semibold">Select supplier and products</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-auto">
          {/* Filter suppliers */}
          <div className="grid grid-cols-[140px_1fr] gap-3 items-center">
            <label className="text-sm text-blue-700">Filter suppliers:</label>
            <input
              type="text"
              className="border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search Suppliers"
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
            />
          </div>

          <hr className="border-gray-200" />

          {/* Supplier */}
          <div className="grid grid-cols-[140px_1fr] gap-3 items-center">
            <label className="text-sm text-blue-700">Supplier:</label>
            <div className="relative">
              <select
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                value={supplierCode}
                onChange={(e) => setSupplierCode(e.target.value)}
                disabled={portfoliosLoading}
              >
                <option value="">Select a supplier</option>
                {filteredPortfolios.map((p) => (
                  <option key={p.supplierCode} value={p.supplierCode}>
                    {p.supplierName}
                  </option>
                ))}
              </select>
              {portfoliosLoading && (
                <Loader2 size={12} className="absolute right-8 top-1/2 -translate-y-1/2 animate-spin text-blue-500" />
              )}
            </div>
          </div>

          {portfoliosError && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded px-3 py-2 text-amber-800 text-xs">
              <AlertTriangle size={14} /> Could not load suppliers — {portfoliosError}
            </div>
          )}

          {/* PDS date */}
          {selectedPortfolio && (
            <div className="grid grid-cols-[140px_1fr] gap-3 items-center">
              <label className="text-sm text-blue-700">PDS date:</label>
              <select
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={revisionDate}
                onChange={(e) => setRevisionDate(e.target.value)}
              >
                <option value="">Select a date</option>
                {selectedPortfolio.revisionDates.map((d) => (
                  <option key={d} value={d}>{formatDateLabel(d)}</option>
                ))}
              </select>
            </div>
          )}

          {/* Products */}
          {supplierCode && revisionDate && (
            <div className="border border-gray-200 rounded">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-bold text-slate-700">
                Products
              </div>
              <div className="p-3 space-y-2">
                {productsLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 size={12} className="animate-spin" /> Loading products…
                  </div>
                )}
                {productsError && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded px-3 py-2 text-amber-800 text-xs">
                    <AlertTriangle size={14} /> {productsError}
                  </div>
                )}
                {!productsLoading && !productsError && neededCodes.map((code) => {
                  const opts = productsByNeed[code] ?? [];
                  return (
                    <div key={code} className="grid grid-cols-[160px_1fr] gap-3 items-center">
                      <label className="text-xs text-slate-700">{COVER_NEED_CODE_LABELS[code]}:</label>
                      <select
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={productSelections[code] ?? ''}
                        onChange={(e) => setProductSelections((prev) => ({ ...prev, [code]: e.target.value }))}
                      >
                        <option value="">Select a product</option>
                        {opts.map((p) => (
                          <option key={p.productCode} value={p.productCode}>
                            {p.productName || p.productCode}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Total Annual Premium details */}
          {supplierCode && revisionDate && (
            <div className="border border-gray-200 rounded">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-bold text-slate-700">
                Total Annual Premium
              </div>
              <div className="p-3 grid grid-cols-2 gap-3">
                <label className="text-xs text-slate-700 flex flex-col gap-1">
                  Premium (Inside Super) pa
                  <input
                    type="text"
                    className="border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={premiumInside}
                    onChange={(e) => setPremiumInside(e.target.value)}
                  />
                </label>
                <label className="text-xs text-slate-700 flex flex-col gap-1">
                  Premium (Outside Super) pa
                  <input
                    type="text"
                    className="border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={premiumOutside}
                    onChange={(e) => setPremiumOutside(e.target.value)}
                  />
                </label>
                <label className="text-xs text-slate-700 flex flex-col gap-1">
                  Stamp Duty (Inside Super) pa
                  <input
                    type="text"
                    className="border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={stampDutyInside}
                    onChange={(e) => setStampDutyInside(e.target.value)}
                  />
                </label>
                <label className="text-xs text-slate-700 flex flex-col gap-1">
                  Stamp Duty (Outside Super) pa
                  <input
                    type="text"
                    className="border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={stampDutyOutside}
                    onChange={(e) => setStampDutyOutside(e.target.value)}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50">
          <Button
            size="sm"
            className="bg-indigo-900 hover:bg-indigo-950 text-white text-xs h-8 px-4 disabled:opacity-50"
            onClick={handleAdd}
            disabled={!canAdd}
          >
            Add
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-8 px-4" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
