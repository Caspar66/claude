import { useState, useEffect, Fragment } from 'react';
import { ArrowLeft, Loader2, ChevronDown, ChevronRight, Check, X, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { postQuotePortfolioFeatures } from '@/services/omnilifeApi';
import type { QuoteResultRow } from './quoteResultsData';

interface Props {
  selectedRows: QuoteResultRow[];
  quoteRequestBody: Record<string, unknown>;
  activeQuoteIndex: number | null;
  onBack: () => void;
}

interface FeatureEntry {
  code: string;
  name: string;
  category: string;
}

interface PortfolioFeatureResult {
  portfolioCode: string;
  supplierName: string;
  portfolioName: string;
  features: Record<string, boolean | string>;
}

interface ParsedFeatures {
  categories: string[];
  features: FeatureEntry[];
  portfolios: PortfolioFeatureResult[];
}

function parseFeatureResponse(raw: unknown, rows: QuoteResultRow[]): ParsedFeatures {
  const portfolios: PortfolioFeatureResult[] = [];
  const featureMap = new Map<string, FeatureEntry>();
  const categorySet = new Set<string>();

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const code = item?.code ?? item?.portfolioCode ?? '';
      const matchRow = rows.find((r) => r.portfolioCode === code);
      const portfolio: PortfolioFeatureResult = {
        portfolioCode: code,
        supplierName: matchRow?.supplierName ?? item?.supplierName ?? code,
        portfolioName: matchRow?.portfolioName ?? item?.portfolioName ?? '',
        features: {},
      };

      const needs = Array.isArray(item?.needs) ? item.needs : [];
      for (const need of needs) {
        const feats = Array.isArray(need?.features) ? need.features : [];
        for (const f of feats) {
          const fCode = f?.code ?? f?.featureCode ?? '';
          const fName = f?.name ?? f?.description ?? fCode;
          const cat = f?.category ?? need?.needCode ?? 'General';
          if (fCode && !featureMap.has(fCode)) {
            featureMap.set(fCode, { code: fCode, name: fName, category: cat });
            categorySet.add(cat);
          }
          const val = f?.value ?? f?.available ?? f?.included;
          portfolio.features[fCode] = typeof val === 'boolean' ? val : (val === 'Y' || val === 'Yes' || val === true);
        }
      }

      portfolios.push(portfolio);
    }
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const dataArray = obj.portfolios ?? obj.data ?? obj.results;
    if (Array.isArray(dataArray)) {
      return parseFeatureResponse(dataArray, rows);
    }

    for (const [key, val] of Object.entries(obj)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const matchRow = rows.find((r) => r.portfolioCode === key);
        const portfolio: PortfolioFeatureResult = {
          portfolioCode: key,
          supplierName: matchRow?.supplierName ?? key,
          portfolioName: matchRow?.portfolioName ?? '',
          features: {},
        };

        const features = val as Record<string, unknown>;
        for (const [fKey, fVal] of Object.entries(features)) {
          if (!featureMap.has(fKey)) {
            featureMap.set(fKey, { code: fKey, name: fKey, category: 'General' });
            categorySet.add('General');
          }
          portfolio.features[fKey] = typeof fVal === 'boolean' ? fVal : (fVal === 'Y' || fVal === 'Yes' || fVal === true);
        }

        portfolios.push(portfolio);
      }
    }
  }

  return {
    categories: Array.from(categorySet),
    features: Array.from(featureMap.values()),
    portfolios,
  };
}

export function FeaturesComparisonPage({ selectedRows, quoteRequestBody, activeQuoteIndex, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedFeatures | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function fetchFeatures() {
      setLoading(true);
      setError(null);

      const codes = selectedRows.map((r) => r.portfolioCode).filter(Boolean);
      if (codes.length === 0) {
        setError('No products selected.');
        setLoading(false);
        return;
      }

      const body = { ...quoteRequestBody };
      if (activeQuoteIndex !== null && Array.isArray(body.clients)) {
        body.clients = [(body.clients as unknown[])[activeQuoteIndex]].filter(Boolean);
      }

      try {
        const raw = await postQuotePortfolioFeatures(codes, body);
        if (cancelled) return;
        const result = parseFeatureResponse(raw, selectedRows);
        setParsed(result);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch features');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFeatures();
    return () => { cancelled = true; };
  }, [selectedRows, quoteRequestBody, activeQuoteIndex]);

  function toggleCategory(cat: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-700 text-white">
        <button onClick={onBack} className="hover:text-white/80">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-sm font-bold">View / Compare Features</h2>
        <span className="text-xs text-white/70">— {selectedRows.length} product{selectedRows.length !== 1 ? 's' : ''} selected</span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
            <p className="text-sm text-slate-500">Fetching feature comparison…</p>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="text-red-600 font-medium mb-2">Error</p>
            <p className="text-sm text-slate-600">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={onBack}>Go Back</Button>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && !error && parsed && (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b-2 border-gray-300">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 min-w-[280px] bg-gray-50">Feature</th>
                {parsed.portfolios.map((p) => (
                  <th key={p.portfolioCode} className="px-3 py-3 text-center text-xs font-semibold text-slate-700 min-w-[140px] bg-gray-50">
                    <div className="font-bold">{p.supplierName}</div>
                    {p.portfolioName && <div className="text-[10px] text-slate-500 font-normal mt-0.5">{p.portfolioName}</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsed.categories.map((cat) => {
                const catFeatures = parsed.features.filter((f) => f.category === cat);
                const isCollapsed = collapsedCategories.has(cat);
                return (
                  <Fragment key={cat}>
                    <tr
                      className="bg-slate-100 cursor-pointer hover:bg-slate-200"
                      onClick={() => toggleCategory(cat)}
                    >
                      <td colSpan={1 + parsed.portfolios.length} className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                          <span className="text-xs font-bold text-slate-700 uppercase">{cat}</span>
                          <span className="text-[10px] text-slate-500">({catFeatures.length})</span>
                        </div>
                      </td>
                    </tr>
                    {!isCollapsed && catFeatures.map((f, idx) => (
                      <tr key={f.code} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-4 py-2 text-xs text-slate-700">{f.name}</td>
                        {parsed.portfolios.map((p) => {
                          const val = p.features[f.code];
                          return (
                            <td key={p.portfolioCode} className="px-3 py-2 text-center">
                              {val === true ? (
                                <Check size={16} className="inline text-emerald-600" />
                              ) : val === false ? (
                                <X size={16} className="inline text-red-400" />
                              ) : (
                                <Minus size={14} className="inline text-slate-300" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
              {parsed.features.length === 0 && (
                <tr>
                  <td colSpan={1 + parsed.portfolios.length} className="px-6 py-8 text-center text-slate-400">
                    No feature data returned from the API.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end px-4 py-2.5 border-t border-gray-200 bg-gray-50">
        <Button variant="outline" size="sm" className="text-xs h-7" onClick={onBack}>
          Back to Results
        </Button>
      </div>
    </div>
  );
}
