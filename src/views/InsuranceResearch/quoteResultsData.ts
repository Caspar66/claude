// ── Quote results types — mapped from OmniLife /quote/portfolio response ─────

import type { PremiumFrequency } from './insuranceData';

// ── Frequency-keyed premium maps ────────────────────────────────────────────

export type FreqPremiumMap = Partial<Record<PremiumFrequency, number>>;

// ── Included portfolio (allNeedsMet: true) ──────────────────────────────────

export interface QuoteResultRow {
  id: string;
  supplierName: string;
  supplierLogo?: string;
  portfolioName: string;
  products: string;
  premiumByFreq: FreqPremiumMap;
  superPremiumByFreq: FreqPremiumMap;
  nonSuperPremiumByFreq: FreqPremiumMap;
  cumulativePremium: number;
  featureScore: number;
  valueScore: number;
  selected: boolean;
}

// ── Excluded portfolio (allNeedsMet: false) ─────────────────────────────────

export interface ExcludedProduct {
  id: string;
  supplierName: string;
  supplierLogo?: string;
  portfolioName: string;
  errors: string[];
  pdsLink?: string;
  tmdLink?: string;
}

// ── Aggregate results ───────────────────────────────────────────────────────

export interface QuoteResults {
  rows: QuoteResultRow[];
  excluded: ExcludedProduct[];
  populated: boolean;
}

// ── API response parser ─────────────────────────────────────────────────────

function asNum(v: unknown): number {
  return typeof v === 'number' ? v : 0;
}

function asStr(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function asFreqMap(v: unknown): FreqPremiumMap {
  if (!v || typeof v !== 'object') return {};
  const out: FreqPremiumMap = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (['Y', 'H', 'Q', 'M', 'F', 'W'].includes(k) && typeof val === 'number') {
      out[k as PremiumFrequency] = val;
    }
  }
  return out;
}

function parsePortfolio(p: Record<string, unknown>, idx: number): QuoteResultRow | ExcludedProduct {
  const supplier = (p.supplier ?? {}) as Record<string, unknown>;
  const supplierName = asStr(supplier.name);
  const supplierLogo = asStr(supplier.logo) || undefined;
  const portfolioName = asStr(p.name);
  const allNeedsMet = p.allNeedsMet === true;

  if (!allNeedsMet) {
    const links = (p.links ?? {}) as Record<string, unknown>;
    const errors = Array.isArray(p.errors)
      ? (p.errors as unknown[]).map((e) => (typeof e === 'string' ? e : asStr((e as Record<string, unknown>)?.message ?? e)))
      : [];
    return {
      id: `ex-${idx}`,
      supplierName,
      supplierLogo,
      portfolioName,
      errors,
      pdsLink: asStr(links.pds) || undefined,
      tmdLink: asStr(links.tmd) || undefined,
    };
  }

  const products = Array.isArray(p.products)
    ? (p.products as Record<string, unknown>[]).map((pr) => asStr(pr.name)).filter(Boolean).join(', ')
    : '';

  const pt = (p.premiumTotal ?? {}) as Record<string, unknown>;
  const premiumByFreq = asFreqMap(pt.premium);
  const superPremiumByFreq = asFreqMap(pt.premiumInsideSuper);
  const nonSuperPremiumByFreq = asFreqMap(pt.premiumOutsideSuper);

  const projections = (p.premiumTotalProjections ?? {}) as Record<string, unknown>;
  const projPremium = (projections.premium ?? {}) as Record<string, unknown>;
  const yearlyProjections = Array.isArray(projPremium.Y) ? (projPremium.Y as number[]) : [];
  const cumulativePremium = yearlyProjections.reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);

  const score = (p.score ?? {}) as Record<string, unknown>;
  const featureObj = (score.feature ?? {}) as Record<string, unknown>;
  const combinedObj = (score.combined ?? {}) as Record<string, unknown>;

  return {
    id: `qr-${idx}`,
    supplierName,
    supplierLogo,
    portfolioName,
    products,
    premiumByFreq,
    superPremiumByFreq,
    nonSuperPremiumByFreq,
    cumulativePremium,
    featureScore: asNum(featureObj.raw),
    valueScore: asNum(combinedObj.raw),
    selected: false,
  };
}

function extractPortfolios(raw: unknown): Record<string, unknown>[] {
  if (!raw || typeof raw !== 'object') return [];

  // Direct array of portfolios
  if (Array.isArray(raw)) {
    // Check if items look like portfolios (have supplier or allNeedsMet)
    if (raw.length > 0 && typeof raw[0] === 'object' && raw[0] !== null) {
      const first = raw[0] as Record<string, unknown>;
      if ('supplier' in first || 'allNeedsMet' in first) return raw as Record<string, unknown>[];
      // Array of client results — collect all portfolios
      const all: Record<string, unknown>[] = [];
      for (const item of raw) {
        if (item && typeof item === 'object' && 'portfolios' in (item as Record<string, unknown>)) {
          const ps = (item as Record<string, unknown>).portfolios;
          if (Array.isArray(ps)) all.push(...(ps as Record<string, unknown>[]));
        }
      }
      return all;
    }
    return [];
  }

  const obj = raw as Record<string, unknown>;

  // { portfolios: [...] }
  if (Array.isArray(obj.portfolios)) return obj.portfolios as Record<string, unknown>[];

  // { clients: [{ portfolios: [...] }] }  or  { results: [{ portfolios: [...] }] }
  const nested = (obj.clients ?? obj.results ?? obj.data) as unknown;
  if (Array.isArray(nested)) {
    const all: Record<string, unknown>[] = [];
    for (const item of nested) {
      if (item && typeof item === 'object' && 'portfolios' in (item as Record<string, unknown>)) {
        const ps = (item as Record<string, unknown>).portfolios;
        if (Array.isArray(ps)) all.push(...(ps as Record<string, unknown>[]));
      }
    }
    return all;
  }

  return [];
}

export function parsePortfolioResponse(raw: unknown): QuoteResults {
  const portfolios = extractPortfolios(raw);

  const rows: QuoteResultRow[] = [];
  const excluded: ExcludedProduct[] = [];

  portfolios.forEach((p, idx) => {
    const result = parsePortfolio(p, idx);
    if ('products' in result) rows.push(result);
    else excluded.push(result);
  });

  return { rows, excluded, populated: rows.length > 0 || excluded.length > 0 };
}

export function getEmptyQuoteResults(): QuoteResults {
  return { rows: [], excluded: [], populated: false };
}
