import { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, CheckCircle2, MinusCircle } from 'lucide-react';
import { postProductOptions } from '@/services/omnilifeApi';
import {
  parseProductOptionsResponse,
  getNeedLabel,
  type ProductOption,
  type ExcludedProduct,
} from './quoteResultsData';

interface NeedRequirement {
  code: string;
  owner: string;
}

function extractNeedRequirements(clientEntry: Record<string, unknown>): NeedRequirement[] {
  const needs = clientEntry.needs as Record<string, unknown>[] | undefined;
  if (!Array.isArray(needs)) return [];
  const reqs: NeedRequirement[] = [];

  for (const need of needs) {
    const code = Object.keys(need)[0];
    if (!code) continue;
    const fields = need[code] as Record<string, unknown> | undefined;
    if (!fields || typeof fields !== 'object') continue;

    reqs.push({ code, owner: String(fields.owner ?? '') });

    const linked = fields.linkedNeeds as Record<string, unknown>[] | undefined;
    if (Array.isArray(linked)) {
      for (const ln of linked) {
        const lnCode = Object.keys(ln)[0];
        if (!lnCode) continue;
        const lnFields = ln[lnCode] as Record<string, unknown> | undefined;
        if (!lnFields || typeof lnFields !== 'object') continue;
        reqs.push({ code: lnCode, owner: String(lnFields.owner ?? '') });
      }
    }
  }

  return reqs;
}

function productMatchesNeeds(option: ProductOption, reqs: NeedRequirement[]): boolean {
  if (reqs.length === 0) return true;
  return reqs.every((req) =>
    option.supportedNeeds.some(
      (sn) => sn.needCode === req.code && sn.ownership === req.owner,
    ),
  );
}

interface Props {
  product: ExcludedProduct;
  quoteRequestBody: Record<string, unknown>;
  onClose: () => void;
}

export function ExclusionReasonsModal({ product, quoteRequestBody, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchOptions() {
      try {
        setLoading(true);
        setError(null);
        const allClients = quoteRequestBody.clients as unknown[];
        const singleClientBody = {
          ...quoteRequestBody,
          clients: allClients ? [allClients[product.quoteIndex] ?? allClients[0]] : [],
        };
        const raw = await postProductOptions(product.portfolioCode, singleClientBody);
        if (cancelled) return;
        const parsed = parseProductOptionsResponse(raw);
        const clientEntry = (allClients?.[product.quoteIndex] ?? allClients?.[0]) as Record<string, unknown> | undefined;
        const reqs = clientEntry ? extractNeedRequirements(clientEntry) : [];
        const filtered = reqs.length > 0 ? parsed.filter((p) => productMatchesNeeds(p, reqs)) : parsed;
        setProductOptions(filtered);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch product options');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOptions();
    return () => { cancelled = true; };
  }, [product.portfolioCode, quoteRequestBody]);

  const productsWithErrors = productOptions.filter((p) =>
    p.supportedNeeds.some((n) => n.errorMessage),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-navy rounded-t-lg">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Exclusion Reasons — {product.supplierName}
            </h2>
            <p className="text-xs text-white/70">{product.portfolioName}</p>
          </div>
          <button className="text-white/70 hover:text-white" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center justify-center py-12 gap-2 text-slate-500 text-sm">
              <Loader2 size={18} className="animate-spin" />
              Fetching product options...
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm py-8 justify-center">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {!loading && !error && productsWithErrors.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">
              No exclusion details found for this portfolio.
            </div>
          )}

          {!loading && !error && productsWithErrors.length > 0 && (
            <div className="space-y-4">
              {productsWithErrors.map((prod) => (
                <div key={prod.code} className="border border-slate-200 rounded overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                    <span className="text-xs font-semibold text-slate-800">{prod.name}</span>
                    <span className="text-xs text-slate-400 ml-2">({prod.code})</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {prod.supportedNeeds
                      .filter((n) => n.errorMessage)
                      .map((need) => (
                        <div key={need.needCode} className="flex items-start gap-3 px-4 py-2.5">
                          {need.excluded ? (
                            <MinusCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                          ) : (
                            <CheckCircle2 size={14} className="text-amber-500 mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium text-slate-700">
                              {getNeedLabel(need.needCode)}
                            </span>
                            <p className="text-xs text-slate-500 mt-0.5">{need.errorMessage}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-lg flex justify-end">
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
