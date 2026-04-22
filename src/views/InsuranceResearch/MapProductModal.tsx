import { useEffect, useMemo, useState } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useLegacyPortfolios } from '@/hooks/useLegacyPortfolios';
import { fetchLegacyProducts } from '@/services/omnilifeApi';
import type { LegacyProduct } from '@/services/omnilifeApi';
import type { ExistingPolicy, ExistingCover, CoverNeedCode, ResearchPortfolio } from './insuranceData';
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

// ── Auto-mode cover grouping ────────────────────────────────────────────────

interface CoverGroupEntry {
  code: CoverNeedCode;
  ownership?: string;
}

interface CoverGroup {
  entries: CoverGroupEntry[];
  isLinkedGroup: boolean;
}

function buildCoverGroups(covers: ExistingCover[]): CoverGroup[] {
  const groups: CoverGroup[] = [];
  const handled = new Set<string>();

  const lifeCover = covers.find((c) => c.coverType === 'Life');
  const linkedTpd = covers.find((c) => c.coverType === 'TPD' && c.standAlone !== 'Yes');
  const linkedTrauma = covers.find((c) => c.coverType === 'Trauma' && c.standAlone !== 'Yes');

  if (lifeCover) {
    const entries: CoverGroupEntry[] = [{ code: 'TRM', ownership: lifeCover.ownership }];
    handled.add(lifeCover.id);
    if (linkedTpd) { entries.push({ code: 'TPE', ownership: linkedTpd.ownership }); handled.add(linkedTpd.id); }
    if (linkedTrauma) { entries.push({ code: 'TRE', ownership: linkedTrauma.ownership }); handled.add(linkedTrauma.id); }
    groups.push({ entries, isLinkedGroup: entries.length > 1 });
  }

  for (const cov of covers) {
    if (handled.has(cov.id)) continue;
    const code = coverToNeedCode(cov);
    groups.push({ entries: [{ code, ownership: cov.ownership }], isLinkedGroup: false });
  }

  return groups;
}

function filterProductsForGroup(products: LegacyProduct[], group: CoverGroup): LegacyProduct[] {
  return products.filter((product) => {
    for (const entry of group.entries) {
      const sct = product.supportedCoverTypes[entry.code];
      if (!sct) return false;
      if (entry.code === 'TRM' && group.isLinkedGroup && !sct.mandatory) return false;
      if (entry.ownership && sct.ownership && sct.ownership !== entry.ownership) return false;
    }
    return true;
  });
}

// ── Manual-mode section definitions ─────────────────────────────────────────

type ExtensionCode = 'TPE' | 'TRE' | 'TPR';

interface ManualSection {
  code: CoverNeedCode;
  label: string;
  placeholder: string;
  extensions?: { code: ExtensionCode; label: string }[];
}

const MANUAL_SECTIONS: ManualSection[] = [
  { code: 'TRM', label: 'Life', placeholder: 'Select a Life product', extensions: [
    { code: 'TPE', label: 'Include TPD Extension' },
    { code: 'TRE', label: 'Include Trauma Extension' },
  ]},
  { code: 'TPS', label: 'Total and Permanent Disability', placeholder: 'Select a Total and Permanent Disability product' },
  { code: 'TRS', label: 'Trauma', placeholder: 'Select a Trauma product', extensions: [
    { code: 'TPR', label: 'Include Total and Permanent Disability extension' },
  ]},
  { code: 'INC', label: 'Income Protection', placeholder: 'Select a Income Protection product' },
  { code: 'BUS', label: 'Business Expenses', placeholder: 'Select a Business Expenses product' },
  { code: 'NES', label: 'Needle Stick', placeholder: 'Select a Needle Stick product' },
  { code: 'CHT', label: 'Child Trauma', placeholder: 'Select a Child Trauma product' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function annualise(amount: number, freq: keyof typeof PREMIUM_FREQUENCY_MULTIPLIER): number {
  return amount * PREMIUM_FREQUENCY_MULTIPLIER[freq];
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Component ───────────────────────────────────────────────────────────────

export function MapProductModal({ open, onClose, policy, onSave }: Props) {
  const { portfolios, loading: portfoliosLoading, error: portfoliosError } = useLegacyPortfolios();

  const [supplierFilter, setSupplierFilter] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [revisionDate, setRevisionDate] = useState('');
  const [manualLinkMode, setManualLinkMode] = useState(false);
  const [premiumInside, setPremiumInside] = useState('0');
  const [premiumOutside, setPremiumOutside] = useState('0');
  const [stampDutyInside, setStampDutyInside] = useState('0');
  const [stampDutyOutside, setStampDutyOutside] = useState('0');

  const [productSelections, setProductSelections] = useState<Partial<Record<CoverNeedCode, string>>>({});
  const [extensionFlags, setExtensionFlags] = useState<Partial<Record<ExtensionCode, boolean>>>({});

  const [allProducts, setAllProducts] = useState<LegacyProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [pendingRestore, setPendingRestore] = useState<ResearchPortfolio | null>(null);

  // ── Auto-mode derived data ──────────────────────────────────────────────

  const coverGroups = useMemo(() => {
    if (!policy) return [];
    return buildCoverGroups(policy.covers);
  }, [policy]);

  const primaryCodes = useMemo(
    () => coverGroups.map((g) => g.entries[0].code),
    [coverGroups],
  );

  // ── Shared derived data ─────────────────────────────────────────────────

  const selectedPortfolio = useMemo(
    () => portfolios.find((p) => p.supplierName === supplierName) ?? null,
    [portfolios, supplierName],
  );

  const filteredPortfolios = useMemo(() => {
    const q = supplierFilter.trim().toLowerCase();
    if (!q) return portfolios;
    return portfolios.filter((p) =>
      p.supplierName.toLowerCase().includes(q) || p.supplierCode.toLowerCase().includes(q),
    );
  }, [portfolios, supplierFilter]);

  // ── Manual-mode: products filtered per section ──────────────────────────

  const productsBySection = useMemo(() => {
    const map: Partial<Record<CoverNeedCode, LegacyProduct[]>> = {};
    for (const section of MANUAL_SECTIONS) {
      const filtered = allProducts.filter((p) => p.supportedCoverTypes[section.code]);
      if (filtered.length > 0) map[section.code] = filtered;
    }
    return map;
  }, [allProducts]);

  // ── Reset effects ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!open || !policy) return;
    const rp = policy.researchPortfolio;

    if (rp) {
      const match = portfolios.find((p) => p.supplierCode === rp.supplierCode);
      setSupplierFilter('');
      setSupplierName(match?.supplierName ?? '');
      setRevisionDate(rp.revisionDate);
      setManualLinkMode(!rp.existingCover);
      setPremiumInside(rp.premiumInsideSuperAnnualised.toFixed(2));
      setPremiumOutside(rp.premiumOutsideSuperAnnualised.toFixed(2));
      setStampDutyInside(rp.stampDutyInsideSuperAnnualised.toFixed(2));
      setStampDutyOutside(rp.stampDutyOutsideSuperAnnualised.toFixed(2));
      setProductSelections({});
      setExtensionFlags({});
      setAllProducts([]);
      setProductsError(null);
      setPendingRestore(rp);
    } else {
      const inside = annualise(policy.premiumSuper, policy.premiumSuperFrequency);
      const outside = annualise(policy.premiumNonSuper, policy.premiumNonSuperFrequency);
      setSupplierFilter('');
      setSupplierName('');
      setRevisionDate('');
      setManualLinkMode(false);
      setPremiumInside(inside.toFixed(2));
      setPremiumOutside(outside.toFixed(2));
      setStampDutyInside('0');
      setStampDutyOutside('0');
      setProductSelections({});
      setExtensionFlags({});
      setAllProducts([]);
      setProductsError(null);
      setPendingRestore(null);
    }
  }, [open, policy, portfolios]);

  useEffect(() => {
    if (pendingRestore) return;
    setRevisionDate('');
    setAllProducts([]);
    setProductSelections({});
    setExtensionFlags({});
    setProductsError(null);
  }, [supplierName]);

  useEffect(() => {
    if (pendingRestore) return;
    setProductSelections({});
    setExtensionFlags({});
  }, [manualLinkMode]);

  // ── Fetch products ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!selectedPortfolio || !revisionDate) return;
    const supplierCode = selectedPortfolio.supplierCode;
    let cancelled = false;
    setProductsLoading(true);
    setProductsError(null);

    fetchLegacyProducts({ supplierCode, date: revisionDate })
      .then((list) => {
        if (cancelled) return;
        setAllProducts(list);
        setProductsLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setProductsError(err.message);
        setProductsLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedPortfolio, revisionDate]);

  // ── Restore product selections from saved portfolio after products load ──

  useEffect(() => {
    if (!pendingRestore || allProducts.length === 0) return;
    const saved = pendingRestore.products;
    const selections: Partial<Record<CoverNeedCode, string>> = {};
    const extFlags: Partial<Record<ExtensionCode, boolean>> = {};

    for (const [code, entry] of Object.entries(saved) as [CoverNeedCode, { productCode: string }][]) {
      if (!entry?.productCode) continue;
      const product = allProducts.find(
        (p) => p.supportedCoverTypes[code]?.researchProductCode === entry.productCode,
      );
      if (!product) continue;

      if (!pendingRestore.existingCover) {
        const section = MANUAL_SECTIONS.find((s) => s.code === code);
        if (section) {
          selections[code] = product.productCode;
        } else {
          const parentSection = MANUAL_SECTIONS.find((s) =>
            s.extensions?.some((e) => e.code === code),
          );
          if (parentSection) {
            selections[parentSection.code] = product.productCode;
            extFlags[code as ExtensionCode] = true;
          }
        }
      } else {
        const group = coverGroups.find((g) => g.entries.some((e) => e.code === code));
        if (group) {
          selections[group.entries[0].code] = product.productCode;
        }
      }
    }

    setProductSelections(selections);
    setExtensionFlags(extFlags);
    setPendingRestore(null);
  }, [allProducts, pendingRestore, coverGroups]);

  // ── Manual-mode: check if selected product supports an extension ────────

  function selectedProductSupports(sectionCode: CoverNeedCode, extCode: string): boolean {
    const selectedCode = productSelections[sectionCode];
    if (!selectedCode) return false;
    const product = allProducts.find(
      (p) => p.productCode === selectedCode && p.supportedCoverTypes[sectionCode],
    );
    return product?.supportedCoverTypes[extCode] !== undefined;
  }

  // ── Save ────────────────────────────────────────────────────────────────

  function resolveResearchCode(topLevelProductCode: string, coverCode: string): string {
    const product = allProducts.find((p) => p.productCode === topLevelProductCode);
    return product?.supportedCoverTypes[coverCode]?.researchProductCode || topLevelProductCode;
  }

  function handleAdd() {
    if (!policy || !selectedPortfolio || !revisionDate) return;
    const products: Partial<Record<CoverNeedCode, { productCode: string }>> = {};

    if (!manualLinkMode) {
      for (const group of coverGroups) {
        const primary = group.entries[0];
        const selectedCode = productSelections[primary.code];
        if (!selectedCode) continue;
        for (const entry of group.entries) {
          products[entry.code] = { productCode: resolveResearchCode(selectedCode, entry.code) };
        }
      }
    } else {
      for (const section of MANUAL_SECTIONS) {
        const selectedCode = productSelections[section.code];
        if (!selectedCode) continue;
        products[section.code] = { productCode: resolveResearchCode(selectedCode, section.code) };
        if (section.extensions) {
          for (const ext of section.extensions) {
            if (extensionFlags[ext.code] && selectedProductSupports(section.code, ext.code)) {
              products[ext.code] = { productCode: resolveResearchCode(selectedCode, ext.code) };
            }
          }
        }
      }
    }

    const portfolio: ResearchPortfolio = {
      supplierCode: selectedPortfolio.supplierCode,
      revisionDate,
      existingCover: !manualLinkMode,
      premiumInsideSuperAnnualised: parseFloat(premiumInside) || 0,
      premiumOutsideSuperAnnualised: parseFloat(premiumOutside) || 0,
      stampDutyInsideSuperAnnualised: parseFloat(stampDutyInside) || 0,
      stampDutyOutsideSuperAnnualised: parseFloat(stampDutyOutside) || 0,
      products,
    };
    onSave(portfolio);
    onClose();
  }

  const canAdd = useMemo(() => {
    if (!selectedPortfolio || !revisionDate) return false;
    if (!manualLinkMode) {
      return primaryCodes.every((c) => productSelections[c]);
    }
    return Object.values(productSelections).some((v) => v);
  }, [selectedPortfolio, revisionDate, manualLinkMode, primaryCodes, productSelections]);

  // ── Render ──────────────────────────────────────────────────────────────

  function renderManualSection(section: ManualSection) {
    const sectionProducts = productsBySection[section.code];
    if (!sectionProducts || sectionProducts.length === 0) return null;

    const selectedCode = productSelections[section.code];

    return (
      <div key={section.code}>
        <div className="text-sm font-bold text-slate-800 mb-1">{section.label}</div>
        {section.extensions && selectedCode && section.extensions.map((ext) => {
          const supported = selectedProductSupports(section.code, ext.code);
          if (!supported) return null;
          return (
            <label key={ext.code} className="flex items-center gap-2 text-xs text-blue-700 mb-1 cursor-pointer">
              <input
                type="checkbox"
                checked={extensionFlags[ext.code] ?? false}
                onChange={(e) => setExtensionFlags((prev) => ({ ...prev, [ext.code]: e.target.checked }))}
                className="accent-blue-600"
              />
              {ext.label}
            </label>
          );
        })}
        <select
          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedCode ?? ''}
          onChange={(e) => {
            setProductSelections((prev) => ({ ...prev, [section.code]: e.target.value }));
            if (section.extensions) {
              setExtensionFlags((prev) => {
                const next = { ...prev };
                for (const ext of section.extensions!) delete next[ext.code];
                return next;
              });
            }
          }}
        >
          <option value="">{section.placeholder}</option>
          {sectionProducts.map((p) => (
            <option key={p.productCode + '::' + p.productName} value={p.productCode}>
              {p.productName || p.productCode}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-800 text-white shrink-0">
          <h3 className="text-sm font-semibold">Select supplier and products</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
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
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                disabled={portfoliosLoading}
              >
                <option value="">Select a supplier</option>
                {filteredPortfolios.map((p) => (
                  <option key={p.supplierName} value={p.supplierName}>
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
              <label className="text-sm text-blue-700">PDS issue date:</label>
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

          {/* Manually link cover toggle */}
          {selectedPortfolio && revisionDate && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={manualLinkMode}
                onChange={(e) => setManualLinkMode(e.target.checked)}
                className="accent-blue-600"
              />
              Manually link cover
            </label>
          )}

          {/* Products: filtered mode (auto-matched to existing covers) */}
          {selectedPortfolio && revisionDate && !manualLinkMode && (
            <div className="space-y-3">
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
              {!productsLoading && !productsError && coverGroups.map((group, groupIdx) => {
                const primary = group.entries[0];
                const filtered = filterProductsForGroup(allProducts, group);
                return (
                  <div key={groupIdx} className="grid grid-cols-[200px_1fr] gap-3 items-start">
                    <div className="text-xs text-slate-700 pt-1.5">
                      {group.entries.map((entry, i) => (
                        <div key={entry.code} className={i === 0 ? 'font-medium' : 'text-slate-500'}>
                          {COVER_NEED_CODE_LABELS[entry.code]}:
                        </div>
                      ))}
                    </div>
                    <select
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={productSelections[primary.code] ?? ''}
                      onChange={(e) => setProductSelections((prev) => ({ ...prev, [primary.code]: e.target.value }))}
                    >
                      <option value="">Select a product</option>
                      {filtered.map((p) => (
                        <option key={p.productCode + '::' + p.productName} value={p.productCode}>
                          {p.productName || p.productCode}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          )}

          {/* Products: manual mode (all cover types) */}
          {selectedPortfolio && revisionDate && manualLinkMode && (
            <div className="space-y-4">
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
              {!productsLoading && !productsError && MANUAL_SECTIONS.map((s) => renderManualSection(s))}
            </div>
          )}

          {/* Total Annual Premium */}
          {selectedPortfolio && revisionDate && (
            <div className="border border-gray-200 rounded">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-bold text-slate-700">
                Total annual premium
              </div>
              <div className="p-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-600">
                      <th className="text-left py-1" />
                      <th className="text-left py-1 px-2">Super</th>
                      <th className="text-left py-1 px-2">Non Super</th>
                      <th className="text-left py-1 px-2">Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-1 text-slate-700">Premium</td>
                      <td className="py-1 px-2">
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={premiumInside}
                          onChange={(e) => setPremiumInside(e.target.value)}
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={premiumOutside}
                          onChange={(e) => setPremiumOutside(e.target.value)}
                        />
                      </td>
                      <td className="py-1 px-2 text-slate-700">
                        {(parseFloat(premiumInside) || 0) + (parseFloat(premiumOutside) || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-700">Stamp Duty</td>
                      <td className="py-1 px-2">
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={stampDutyInside}
                          onChange={(e) => setStampDutyInside(e.target.value)}
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={stampDutyOutside}
                          onChange={(e) => setStampDutyOutside(e.target.value)}
                        />
                      </td>
                      <td className="py-1 px-2 text-slate-700">
                        {(parseFloat(stampDutyInside) || 0) + (parseFloat(stampDutyOutside) || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 shrink-0">
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
